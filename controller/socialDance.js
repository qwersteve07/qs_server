const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs").promises;
const path = require("path");
const filePath = path.join(__dirname, "..", "/data/social-dance-events.json");
const dayjs = require("dayjs");
const isSameOrAfter = require("dayjs/plugin/isSameOrAfter");
const { sortEvents } = require("../utils/sortEvents");
dayjs.extend(isSameOrAfter);

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

const fetchEventsJson = async () => {
  // const data = await fetch("https://api.qs07-lee.com/social-dance/events").then(
  //   (data) => data.json()
  // );

  // console.log(data.result);

  // return data.result.filter((d) => {
  //   return dayjs(d.date).isSameOrAfter(dayjs().subtract(1, "d"));
  // });
  // return data.result;

  const fileData = await fs.readFile(filePath, "utf-8");
  const data = JSON.parse(fileData);

  return data;
};

const writeEventsJson = async (json) => {
  fs.writeFile(filePath, JSON.stringify(sortEvents(json), null, 2));
};

const fetchEvents = async (ctx) => {
  const result = await fetchEventsJson();
  ctx.status = 201;
  ctx.body = { result };
};

const fetchEventsList = async (ctx) => {
  const validateResult = validateAuth(ctx);

  if (!validateResult?.ok) {
    return validateResult;
  }

  const result = await fetchEventsJson();
  ctx.status = 201;
  ctx.body = { result };
};

const createEvent = async (ctx) => {
  const validateResult = validateAuth(ctx);

  if (!validateResult?.ok) {
    return validateResult;
  }

  const jsonData = await fetchEventsJson();
  const body = ctx.request.body;
  jsonData.push({ ...JSON.parse(body), id: uuidv4() });

  writeEventsJson(jsonData);
  ctx.status = 201;
  ctx.body = { result: jsonData };
};

const fetchEvent = async (ctx) => {
  const jsonData = await fetchEventsJson();
  const id = ctx.request.params.id;
  ctx.status = 201;
  ctx.body = { result: jsonData.find((x) => x.id === id) };
};

const updateEvent = async (ctx) => {
  const validateResult = validateAuth(ctx);

  if (!validateResult?.ok) {
    return validateResult;
  }

  const id = ctx.request.params.id;
  const body = ctx.request.body;
  const jsonData = await fetchEventsJson();

  const index = jsonData.findIndex((event) => event.id === id);
  if (index === -1) {
    ctx.status = 500;
    ctx.body = { result: "event not found" };
    return;
  }

  jsonData[index] = { ...jsonData[index], ...JSON.parse(body) };
  writeEventsJson(jsonData);

  ctx.status = 201;
  ctx.body = { result: jsonData[index] };
};

const deleteEvent = async (ctx) => {
  const validateResult = validateAuth(ctx);

  if (!validateResult?.ok) {
    return validateResult;
  }

  const id = ctx.request.params.id;
  const jsonData = await fetchEventsJson();

  const index = jsonData.findIndex((user) => user.id === id);
  if (index === -1) {
    ctx.status = 500;
    ctx.body = { result: "event not found" };
    return;
  }

  jsonData.splice(index, 1);
  writeEventsJson(jsonData);

  ctx.status = 201;
  ctx.body = { result: jsonData[index] };
};

module.exports = {
  fetchEvents,
  fetchEventsList,
  fetchEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  login,
  refresh,
};
