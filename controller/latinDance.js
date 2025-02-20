const { v4: uuidv4 } = require("uuid");
const fs = require("fs").promises;
const path = require("path");
const filePath = path.join(__dirname, "..", "/data/latin-dance-events.json");
const dayjs = require("dayjs");
const isSameOrAfter = require("dayjs/plugin/isSameOrAfter");
dayjs.extend(isSameOrAfter);

const fetchEventsJson = async () => {
  const fileData = await fs.readFile(filePath, "utf-8");
  const data = JSON.parse(fileData);
  // 因為要透過 format 才會轉為正確時區
  // 為了能夠將當天的資料也傳遞回來，須先往前推一天
  return data.filter((d) =>
    dayjs(d.date).isSameOrAfter(dayjs().subtract(1, "day"))
  );
};

const writeEventsJson = async (json) => {
  fs.writeFile(filePath, JSON.stringify(json, null, 2));
};

const fetchEvents = async (ctx) => {
  const result = await fetchEventsJson();
  ctx.status = 201;
  ctx.body = { result };
};

const createEvent = async (ctx) => {
  const jsonData = await fetchEventsJson();

  jsonData.push({ ...JSON.parse(body), id: uuidv4() });

  jsonData[index] = { ...jsonData[index], ...JSON.parse(body) };

  fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));
  ctx.status = 201;
  ctx.body = { result: jsonData[index] };
};

const fetchEvent = async (ctx) => {
  const jsonData = await fetchEventsJson();
  const id = ctx.request.params.id;
  ctx.status = 201;
  ctx.body = { result: jsonData.find((x) => x.id === id) };
};

const updateEvent = async (ctx) => {
  const id = ctx.request.params.id;
  const body = ctx.request.body;
  const jsonData = await fetchEventsJson();

  const index = jsonData.findIndex((user) => user.id === id);
  if (index === -1) {
    ctx.status = 500;
    ctx.body = { result: "user not found" };
    return;
  }

  jsonData[index] = { ...jsonData[index], ...JSON.parse(body) };
  writeEventsJson(jsonData);

  ctx.status = 201;
  ctx.body = { result: jsonData[index] };
};

const deleteEvent = async (ctx) => {
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
};
