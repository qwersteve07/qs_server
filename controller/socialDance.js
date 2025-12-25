import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";
import { sortEventsMethod } from "../utils/sortEvents.js";
import { JSONFilePreset } from "lowdb/node";
dayjs.extend(isSameOrAfter);

const socialData = { events: [], classes: [] };
const db = await JSONFilePreset("social-db.json", socialData);

const users = [
  {
    id: 1,
    username: "qwersteve07",
    password: bcrypt.hashSync("asdfjames07", 10),
  },
];
const ACCESS_TOKEN_SECRET = "this-is-my-damn-access-token-secret";
const REFRESH_TOKEN_SECRET = "this-is-my-damn-refresh-token-secret";

let refreshTokens = [];

function generateTokens(user) {
  const accessToken = jwt.sign(
    { id: user.id, username: user.username },
    ACCESS_TOKEN_SECRET,
    {
      expiresIn: "1d",
    }
  );
  const refreshToken = jwt.sign(
    { id: user.id, username: user.username },
    REFRESH_TOKEN_SECRET,
    {
      expiresIn: "7d",
    }
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
    return { ok: true };
  } catch (error) {
    ctx.status = 401;
    ctx.body = { error: "Invalid token" };
  }
}

const login = async (ctx) => {
  const body = ctx.request.body;
  const parseData = JSON.parse(body);
  const user = users.find((u) => u.username === parseData.username);

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
      (token) => token !== parseData.refreshToken
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
    return (
      dayjs(event.date).year() === parseInt(query.year) &&
      dayjs(event.date).month() + 1 === parseInt(query.month)
    );
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

// 前台 event
const fetchEvents = async (ctx) => {
  console.log(ctx.request.query);
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
  const newData = {
    ...JSON.parse(body),
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
    ctx.status = 500;
    ctx.body = { result: "event not found" };
    return;
  }

  const result = writeEventsData({ ...JSON.parse(body), id });
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
    ctx.status = 500;
    ctx.body = { result: "event not found" };
    return;
  }

  eventsData.splice(targetIndex, 1);

  const result = fetchEventsData();
  ctx.status = 201;
  ctx.body = { result };
};

export default {
  fetchEvents,
  fetchEventsList,
  fetchEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  login,
  refresh,
};
