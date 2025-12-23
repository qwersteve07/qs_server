import dayjs from "dayjs";

function sortEvents(events) {
  return events.sort(sortEventsMethod);
}

function sortEventsMethod(a, b) {
  if (dayjs(a.date).isBefore(dayjs(b.date))) return -1;
  if (dayjs(a.date).isAfter(dayjs(b.date))) return 1;
  return 0;
}

export { sortEvents, sortEventsMethod };
