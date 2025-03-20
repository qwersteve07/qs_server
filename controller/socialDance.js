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
const SECRET_KEY = "this-is-my-damn-secret-key";

function validateAuth(ctx) {
  const authHeader = ctx.headers.authorization;

  if (!authHeader) {
    ctx.status = 401;
    ctx.body = { error: "Unauthorized" };
    return;
  }

  try {
    const token = authHeader.split(" ")[1];

    const result = jwt.verify(token, SECRET_KEY);

    if (!result) throw "";
    return { ok: true };
  } catch (error) {
    ctx.status = 403;
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

  const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, {
    expiresIn: "1h",
  });
  ctx.body = { token };
};

const fetchEventsJson = async () => {
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

  console.log(validateResult);

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
  fetchEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  login,
};
