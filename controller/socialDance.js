import "dotenv/config";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import { and, asc, eq, gte, lt, lte } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import {
  eventFromBody,
  eventToApi,
  organizerFromBody,
  classesFromBody,
  organizerToApi,
  workshopFromBody,
  workshopToApi,
  toDateOnly,
} from "../db/mappers.js";
import googleCalendar from "../calendar.js";

const { users, refreshTokens, organizers, classes, events, workshops } = schema;

const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } = process.env;
if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error("ACCESS_TOKEN_SECRET / REFRESH_TOKEN_SECRET are not set (see .env.example)");
}

// 前端以 text body 傳 JSON 字串；若之後改用 application/json，koaBody 會先 parse 成物件
function parseBody(ctx) {
  const body = ctx.request.body;
  return typeof body === "string" ? JSON.parse(body) : body ?? {};
}

// ---------- auth ----------
async function generateTokens(user) {
  const payload = { id: user.id, username: user.username, role: user.role };
  const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "1d" });
  // jwtid 確保同一秒內簽發的 token 也不會相同（refresh_tokens 以 token 為主鍵）
  const refreshToken = jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: "7d", jwtid: uuidv4() });

  await db.insert(refreshTokens).values({
    token: refreshToken,
    userId: user.id,
    expiresAt: dayjs().add(7, "day").toDate(),
  });

  return { accessToken, refreshToken };
}

function validateAuth(ctx) {
  const authHeader = ctx.headers.authorization;

  if (!authHeader) {
    ctx.status = 401;
    ctx.body = { error: "Unauthorized" };
    return;
  }

  try {
    const token = authHeader.split(" ")[1];
    const result = jwt.verify(token, ACCESS_TOKEN_SECRET);
    if (!result) throw "";
    return { ok: true, data: result };
  } catch (error) {
    ctx.status = 401;
    ctx.body = { error: "Invalid token" };
  }
}

const login = async (ctx) => {
  const parseData = parseBody(ctx);
  const [user] = await db.select().from(users).where(eq(users.username, String(parseData.username ?? "")));

  if (!user || !bcrypt.compareSync(String(parseData.password ?? ""), user.passwordHash)) {
    ctx.status = 401;
    ctx.body = { error: "Invalid credentials" };
    return;
  }

  ctx.status = 200;
  ctx.body = { data: await generateTokens(user) };
};

const refresh = async (ctx) => {
  const parseData = parseBody(ctx);
  const token = parseData.refreshToken;

  const [stored] = token
    ? await db.select().from(refreshTokens).where(eq(refreshTokens.token, token))
    : [];

  if (!stored) {
    ctx.status = 403;
    ctx.body = { error: "Invalid refresh token1" };
    return;
  }

  try {
    jwt.verify(token, REFRESH_TOKEN_SECRET);
    // 以 DB 中最新的帳號資料簽發（role 若被調整會立即生效）
    const [user] = await db.select().from(users).where(eq(users.id, stored.userId));
    if (!user) throw new Error("user not found");

    await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
    // 順便清掉過期的 token
    await db.delete(refreshTokens).where(lte(refreshTokens.expiresAt, new Date()));

    ctx.status = 200;
    ctx.body = { data: await generateTokens(user) };
  } catch (error) {
    console.log(error);
    ctx.status = 403;
    ctx.body = { error: "Invalid refresh token2" };
  }
};

const fetchMe = async (ctx) => {
  const validateAuthResult = validateAuth(ctx);
  if (!validateAuthResult?.ok) return validateAuthResult;

  ctx.status = 201;
  ctx.body = { result: validateAuthResult.data };
};

// ---------- events ----------
const eventOrder = [asc(events.date), asc(events.createdAt)];

// 有 year/month 時回傳「前一個月 ~ 下一個月」三個月的活動（含跨年）
async function fetchEventsData(query) {
  if (!query || Object.keys(query).length === 0) {
    const rows = await db.select().from(events).orderBy(...eventOrder);
    return rows.map(eventToApi);
  }

  const year = parseInt(query.year);
  const month = parseInt(query.month);
  if (Number.isNaN(year) || Number.isNaN(month)) return [];

  const current = dayjs(new Date(year, month - 1, 1));
  const from = current.subtract(1, "month").format("YYYY-MM-DD");
  const to = current.add(2, "month").format("YYYY-MM-DD");

  const rows = await db
    .select()
    .from(events)
    .where(and(gte(events.date, from), lt(events.date, to)))
    .orderBy(...eventOrder);
  return rows.map(eventToApi);
}

async function findEvent(id) {
  const [row] = await db.select().from(events).where(eq(events.id, id));
  return row;
}

// 前台 event
const fetchEvents = async (ctx) => {
  ctx.status = 201;
  ctx.body = { result: await fetchEventsData(ctx.request.query) };
};

// 後台 event，加上 auth驗證
const fetchEventsList = async (ctx) => {
  const validateAuthResult = validateAuth(ctx);
  if (!validateAuthResult?.ok) return validateAuthResult;

  ctx.status = 201;
  ctx.body = { result: await fetchEventsData() };
};

const fetchEvent = async (ctx) => {
  const row = await findEvent(ctx.request.params.id);
  ctx.status = 201;
  ctx.body = { result: row ? eventToApi(row) : undefined };
};

const createEvent = async (ctx) => {
  const validateAuthResult = validateAuth(ctx);
  if (!validateAuthResult?.ok) return validateAuthResult;

  const body = parseBody(ctx);
  const data = eventFromBody(body);
  if (!data.date) {
    ctx.status = 400;
    ctx.body = { error: "invalid date" };
    return;
  }

  const calendarEventResult = await googleCalendar.createCalendarEvent(
    googleCalendar.calendarEventAdapter(body),
    body.area,
  );

  await db.insert(events).values({ ...data, id: uuidv4(), calendarEventId: calendarEventResult.id });

  ctx.status = 201;
  ctx.body = { result: await fetchEventsData() };
};

const updateEvent = async (ctx) => {
  const validateAuthResult = validateAuth(ctx);
  if (!validateAuthResult?.ok) return validateAuthResult;

  const id = ctx.request.params.id;
  const target = await findEvent(id);
  if (!target) {
    ctx.status = 204;
    ctx.body = { result: "event not found" };
    return;
  }

  const body = parseBody(ctx);
  const data = eventFromBody(body);
  if (!data.date) {
    ctx.status = 400;
    ctx.body = { error: "invalid date" };
    return;
  }

  await googleCalendar.updateCalendarEvent(
    target.calendarEventId,
    googleCalendar.calendarEventAdapter(body),
    body.area,
  );

  // 前端不會送 calendarEventId，保留原值（舊版會在每次編輯後遺失）
  await db.update(events).set({ ...data, updatedAt: new Date() }).where(eq(events.id, id));

  ctx.status = 201;
  ctx.body = { result: await fetchEventsData() };
};

const deleteEvent = async (ctx) => {
  const validateAuthResult = validateAuth(ctx);
  if (!validateAuthResult?.ok) return validateAuthResult;

  const id = ctx.request.params.id;
  const target = await findEvent(id);
  if (!target) {
    ctx.status = 204;
    ctx.body = { result: "event not found" };
    return;
  }

  await googleCalendar.deleteCalendarEvent(target.calendarEventId, target.area);
  await db.delete(events).where(eq(events.id, id));

  ctx.status = 201;
  ctx.body = { result: await fetchEventsData() };
};

// ---------- organizers ----------
async function fetchOrganizersData() {
  const [organizerRows, classRows] = await Promise.all([
    db.select().from(organizers).orderBy(asc(organizers.position)),
    db.select().from(classes).orderBy(asc(classes.organizerId), asc(classes.position)),
  ]);

  const classesByOrganizer = new Map();
  for (const c of classRows) {
    if (!classesByOrganizer.has(c.organizerId)) classesByOrganizer.set(c.organizerId, []);
    classesByOrganizer.get(c.organizerId).push(c);
  }
  return organizerRows.map((o) => organizerToApi(o, classesByOrganizer.get(o.id) ?? []));
}

const fetchOrganizers = async (ctx) => {
  ctx.status = 201;
  ctx.body = { result: await fetchOrganizersData() };
};

const updateOrganizer = async (ctx) => {
  const validateAuthResult = validateAuth(ctx);
  if (!validateAuthResult?.ok) return validateAuthResult;

  const id = ctx.request.params.id;
  const [target] = await db.select().from(organizers).where(eq(organizers.id, id));
  if (!target) {
    ctx.status = 204;
    ctx.body = { result: "organizer not found" };
    return;
  }

  const body = parseBody(ctx);

  // 前端送完整 organizer（含 classes），整筆取代
  await db.transaction(async (tx) => {
    await tx.update(organizers).set(organizerFromBody(body)).where(eq(organizers.id, id));
    await tx.delete(classes).where(eq(classes.organizerId, id));
    const classRows = classesFromBody(id, body.classes);
    if (classRows.length) await tx.insert(classes).values(classRows);
  });

  ctx.status = 201;
  ctx.body = { result: await fetchOrganizersData() };
};

// ---------- workshops ----------
// GET /social-dance/workshops?from=YYYY-MM-DD  （from 可省略，省略則回傳全部）
async function fetchWorkshopsData(query = {}) {
  const from = toDateOnly(query.from);
  const rows = await db
    .select()
    .from(workshops)
    .where(from ? gte(workshops.date, from) : undefined)
    .orderBy(asc(workshops.date), asc(workshops.createdAt));
  return rows.map(workshopToApi);
}

const fetchWorkshops = async (ctx) => {
  ctx.status = 201;
  ctx.body = { result: await fetchWorkshopsData(ctx.request.query) };
};

const fetchWorkshop = async (ctx) => {
  const [row] = await db.select().from(workshops).where(eq(workshops.id, ctx.request.params.id));
  ctx.status = 201;
  ctx.body = { result: row ? workshopToApi(row) : undefined };
};

const createWorkshop = async (ctx) => {
  const validateAuthResult = validateAuth(ctx);
  if (!validateAuthResult?.ok) return validateAuthResult;

  const data = workshopFromBody(parseBody(ctx));
  if (!data.date || !data.name) {
    ctx.status = 400;
    ctx.body = { error: "name and date are required" };
    return;
  }

  await db.insert(workshops).values({ ...data, id: uuidv4() });
  ctx.status = 201;
  ctx.body = { result: await fetchWorkshopsData() };
};

const updateWorkshop = async (ctx) => {
  const validateAuthResult = validateAuth(ctx);
  if (!validateAuthResult?.ok) return validateAuthResult;

  const id = ctx.request.params.id;
  const data = workshopFromBody(parseBody(ctx));
  if (!data.date || !data.name) {
    ctx.status = 400;
    ctx.body = { error: "name and date are required" };
    return;
  }

  const updated = await db
    .update(workshops)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(workshops.id, id))
    .returning({ id: workshops.id });
  if (!updated.length) {
    ctx.status = 404;
    ctx.body = { error: "workshop not found" };
    return;
  }

  ctx.status = 201;
  ctx.body = { result: await fetchWorkshopsData() };
};

const deleteWorkshop = async (ctx) => {
  const validateAuthResult = validateAuth(ctx);
  if (!validateAuthResult?.ok) return validateAuthResult;

  const deleted = await db
    .delete(workshops)
    .where(eq(workshops.id, ctx.request.params.id))
    .returning({ id: workshops.id });
  if (!deleted.length) {
    ctx.status = 404;
    ctx.body = { error: "workshop not found" };
    return;
  }

  ctx.status = 201;
  ctx.body = { result: await fetchWorkshopsData() };
};

export default {
  fetchMe,
  fetchEvents,
  fetchEventsList,
  fetchEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  fetchOrganizers,
  updateOrganizer,
  fetchWorkshops,
  fetchWorkshop,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  login,
  refresh,
};
