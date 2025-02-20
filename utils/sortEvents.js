const dayjs = require("dayjs");

function sortEvents(events) {
  return events.sort((a, b) => {
    if (dayjs(a.date).isBefore(dayjs(b.date))) return -1;
    if (dayjs(a.date).isAfter(dayjs(b.date))) return 1;
    return 0;
  });
}

module.exports = {
  sortEvents,
};
