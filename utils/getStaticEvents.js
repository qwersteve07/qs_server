const dayjs = require("dayjs");
const socialData = require("../custom/social.json");
var weekOfYear = require("dayjs/plugin/weekOfYear");
var utc = require("dayjs/plugin/utc");
var timezone = require("dayjs/plugin/timezone");
const { v4: uuidv4 } = require("uuid");

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekOfYear);
dayjs.tz.setDefault("Asia/Taipei");

function getEventInEveryWeek(name, weekday) {
  const currentYear = dayjs().year();
  const currentWeek = dayjs().week(1);
  let currentDay = currentWeek.day(weekday);
  const list = [];
  const selectSocial = socialData[name];

  // 透過 dayjs().week(1) 選到的第一天可能為前年
  // 需要在 +7 到當年的第一個 weekday
  if (currentDay.year() < currentYear) {
    currentDay = currentDay.add(7, "day");
  }

  while (currentDay.year() === currentYear) {
    list.push({
      id: uuidv4(),
      title: selectSocial.name,
      start: `${currentDay.format("YYYY-MM-DDT")}${selectSocial["startAt"]}`,
      end: `${currentDay.format("YYYY-MM-DDT")}${selectSocial["endAt"]}`,
      ...selectSocial,
    });

    currentDay = currentDay.add(7, "day");
  }

  return list;
}

function getEventInSingleWeek(name, weekday, weekCount) {
  const currentYear = dayjs().year();
  let currentMonth = dayjs().month(0);
  let currentDay = currentMonth.date(1);
  let currentWeekCount = 1;
  const list = [];
  const selectSocial = socialData[name];
  let loopContinue = false;

  while (currentDay.year() === currentYear) {
    while (currentDay.$W !== weekday) {
      currentDay = currentDay.add(1, "day");
    }

    while (currentWeekCount !== weekCount) {
      currentDay = currentDay.add(1, "week");
      if (currentDay.$M !== currentMonth.$M) {
        currentMonth = currentMonth.add(1, "month");
        currentDay = currentMonth.date(1);
        currentWeekCount = 1;
        loopContinue = true;
        break;
      }
      currentWeekCount++;
    }

    if (loopContinue) {
      loopContinue = false;
      continue;
    }

    list.push({
      id: uuidv4(),
      title: selectSocial.name,
      start: `${currentDay.format("YYYY-MM-DDT")}${selectSocial["startAt"]}`,
      end: `${currentDay.format("YYYY-MM-DDT")}${selectSocial["endAt"]}`,
      ...selectSocial,
    });

    currentMonth = currentMonth.add(1, "month");
    currentDay = currentMonth.date(1);
    currentWeekCount = 1;
  }

  return list;
}

module.exports = {
  getEventInEveryWeek,
  getEventInSingleWeek,
};
