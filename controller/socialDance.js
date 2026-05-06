import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";
import { sortEventsMethod } from "../utils/sortEvents.js";
import { JSONFilePreset } from "lowdb/node";
import { socialDanceUsers } from "../social-dance-user.js";
import googleCalendar from "../calendar.js";

dayjs.extend(isSameOrAfter);

const socialData = { events: [], organizers: [] };
const db = await JSONFilePreset("social-db.json", socialData);

const ACCESS_TOKEN_SECRET = "this-is-my-damn-access-token-secret";
const REFRESH_TOKEN_SECRET = "this-is-my-damn-refresh-token-secret";

let refreshTokens = [];

function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    ACCESS_TOKEN_SECRET,
    {
      expiresIn: "1d",
    },
  );
  const refreshToken = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    REFRESH_TOKEN_SECRET,
    {
      expiresIn: "7d",
    },
  );

  refreshTokens.push(refreshToken);

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
  const body = ctx.request.body;
  const parseData = JSON.parse(body);
  const user = socialDanceUsers.find((u) => u.username === parseData.username);

  if (!user || !bcrypt.compareSync(parseData.password, user.password)) {
    ctx.status = 401;
    ctx.body = { error: "Invalid credentials" };
    return;
  }

  ctx.status = 200;
  const tokens = generateTokens(user);
  ctx.body = { data: tokens };
};

const refresh = async (ctx) => {
  const body = ctx.request.body;
  const parseData = JSON.parse(body);

  if (
    !parseData.refreshToken ||
    !refreshTokens.includes(parseData.refreshToken)
  ) {
    ctx.status = 403;
    ctx.body = { error: "Invalid refresh token1" };
    return;
  }

  try {
    const user = jwt.verify(parseData.refreshToken, REFRESH_TOKEN_SECRET);
    const tokens = generateTokens(user);
    refreshTokens = refreshTokens.filter(
      (token) => token !== parseData.refreshToken,
    );
    refreshTokens.push(tokens.refreshToken);
    ctx.status = 200;
    ctx.body = { data: tokens };
  } catch (error) {
    console.log(error);
    ctx.status = 403;
    ctx.body = { error: "Invalid refresh token2" };
  }
};

const fetchEventsData = (query) => {
  if (!query || Object.keys(query).length === 0) return db.data.events;

  const result = db.data.events.filter((event) => {
    const eventYear = dayjs(event.date).year();
    const eventMonth = dayjs(event.date).month() + 1;
    const requestYear = parseInt(query.year);
    const requestMonth = parseInt(query.month);

    const matchCurrentMonth =
      eventYear === requestYear && eventMonth === requestMonth;
    const matchLastMonth =
      eventYear === requestYear && eventMonth === requestMonth - 1;
    const matchNextMonth =
      eventYear === requestYear && eventMonth === requestMonth + 1;
    const matchNextYearFirstMonth =
      eventYear === requestYear + 1 && eventMonth === 1;
    const matchLastYearLastMonth =
      eventYear === requestYear - 1 && eventMonth === 12;

    if (requestMonth === 12) {
      // 要取得後一年一月的 event
      return matchCurrentMonth || matchLastMonth || matchNextYearFirstMonth;
    } else if (requestMonth === 1) {
      return matchCurrentMonth || matchNextMonth || matchLastYearLastMonth;
    } else {
      return matchCurrentMonth || matchLastMonth || matchNextMonth;
    }
  });

  return result;
};

const writeEventsData = async (data) => {
  let { events } = db.data;
  let targetIndex = events.findIndex((event) => event.id === data.id);
  if (targetIndex !== -1) {
    events[targetIndex] = data;
  } else {
    events.push(data);
  }

  const result = events.toSorted(sortEventsMethod);
  db.data.events = result;
  await db.write();
  return db.data.events;
};

const deleteEventsData = async (index) => {
  let { events } = db.data;

  events.splice(index, 1);

  const result = events.toSorted(sortEventsMethod);
  db.data.events = result;
  await db.write();
  return db.data.events;
};

const fetchMe = async (ctx) => {
  const validateAuthResult = validateAuth(ctx);

  if (!validateAuthResult?.ok) {
    return validateAuthResult;
  }

  ctx.status = 201;
  ctx.body = { result: validateAuthResult.data };
};

// 前台 event
const fetchEvents = async (ctx) => {
  const query = ctx.request.query;
  const result = fetchEventsData(query);
  ctx.status = 201;
  ctx.body = { result };
};

// 後台 event，加上 auth驗證
const fetchEventsList = async (ctx) => {
  const validateAuthResult = validateAuth(ctx);

  if (!validateAuthResult?.ok) {
    return validateAuthResult;
  }

  const result = fetchEventsData();
  ctx.status = 201;
  ctx.body = { result };
};

const createEvent = async (ctx) => {
  const validateAuthResult = validateAuth(ctx);

  if (!validateAuthResult?.ok) {
    return validateAuthResult;
  }

  const body = ctx.request.body;

  const parseBody = JSON.parse(body);

  const calendarEventData = googleCalendar.calendarEventAdapter(parseBody);

  const calendarEventResult = await googleCalendar.createCalendarEvent(
    calendarEventData,
    parseBody.area,
  );

  const newData = {
    ...parseBody,
    calendarEventId: calendarEventResult.id,
    id: uuidv4(),
  };

  const result = await writeEventsData(newData);
  ctx.status = 201;
  ctx.body = { result };
};

const fetchEvent = async (ctx) => {
  const eventsData = fetchEventsData();
  const id = ctx.request.params.id;
  const result = eventsData.find((event) => event.id === id);
  ctx.status = 201;
  ctx.body = { result };
};

const updateEvent = async (ctx) => {
  const validateAuthResult = validateAuth(ctx);

  if (!validateAuthResult?.ok) {
    return validateAuthResult;
  }

  const id = ctx.request.params.id;
  const body = ctx.request.body;
  const eventsData = fetchEventsData();

  const target = eventsData.find((event) => event.id === id);
  if (!target) {
    ctx.status = 204;
    ctx.body = { result: "event not found" };
    return;
  }

  const parseBody = JSON.parse(body);

  const calendarEventData = googleCalendar.calendarEventAdapter(parseBody);

  await googleCalendar.updateCalendarEvent(
    target.calendarEventId,
    calendarEventData,
    parseBody.area,
  );

  const result = writeEventsData({ ...parseBody, id });
  ctx.status = 201;
  ctx.body = { result };
};

const deleteEvent = async (ctx) => {
  const validateAuthResult = validateAuth(ctx);

  if (!validateAuthResult?.ok) {
    return validateAuthResult;
  }

  const id = ctx.request.params.id;
  const eventsData = fetchEventsData();
  const targetIndex = eventsData.findIndex((event) => event.id === id);
  if (targetIndex === -1) {
    ctx.status = 204;
    ctx.body = { result: "event not found" };
    return;
  }

  const targetEvent = eventsData.find((event) => event.id === id);

  await googleCalendar.deleteCalendarEvent(
    targetEvent.calendarEventId,
    targetEvent.area,
  );

  const result = deleteEventsData(targetIndex);
  ctx.status = 201;
  ctx.body = { result };
};

const fetchOrganizers = async (ctx) => {
  const result = db.data.organizers;
  ctx.status = 201;
  ctx.body = { result };
};

const updateOrganizer = async (ctx) => {
  const validateAuthResult = validateAuth(ctx);

  if (!validateAuthResult?.ok) {
    return validateAuthResult;
  }

  const id = ctx.request.params.id;
  const body = ctx.request.body;
  const { organizers } = db.data;

  const targetIndex = organizers.findIndex((organizer) => organizer.id === id);
  if (targetIndex === -1) {
    ctx.status = 204;
    ctx.body = { result: "organizer not found" };
    return;
  }

  await db.update(({ organizers }) =>
    organizers.splice(targetIndex, 1, JSON.parse(body)),
  );

  ctx.status = 201;
  ctx.body = { result: db.data.organizers };
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
  login,
  refresh,
};
