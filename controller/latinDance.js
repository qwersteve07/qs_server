const latinDanceEvents = require("../data/latin-dance-events.json");

const fetchEvents = async (ctx) => {
  ctx.status = 201;
  ctx.body = { result: latinDanceEvents };
};

module.exports = {
  fetchEvents,
};
