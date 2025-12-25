import dayjs from "dayjs";
import socialData from "../template/social.json" with { type: "json" };;
import weekOfYear from "dayjs/plugin/weekOfYear.js";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { v4 as uuidv4 } from "uuid";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(weekOfYear);
dayjs.tz.setDefault("Asia/Taipei");

function getEventInEveryWeek(socialName, weekday) {
  const currentYear = dayjs('2026-01-01').year();
  const currentWeek = dayjs('2026-01-01').week(1);
  let currentDay = currentWeek.day(weekday);
  const list = [];
  const selectSocial = socialData[socialName];

  // 透過 dayjs().week(1) 選到的第一天可能為前年
  // 需要在 +7 到當年的第一個 weekday
  if (currentDay.year() < currentYear) {
    currentDay = currentDay.add(7, "day");
  }

  while (currentDay.year() === currentYear) {
    list.push({
      id: uuidv4(),
      date: currentDay,
      content: "",
      ...selectSocial,
    });

    currentDay = currentDay.add(7, "day");
  }

  return list;
}

function getEventInSingleWeek(socialName, weekday, weekCount) {
  const currentYear = dayjs('2026-01-01').year();
  let currentMonth = dayjs('2026-01-01').month(0);
  let currentDay = currentMonth.date(1);
  let currentWeekCount = 1;
  const list = [];
  const selectSocial = socialData[socialName];
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
      date: currentDay,
      content: "",
      ...selectSocial,
    });

    currentMonth = currentMonth.add(1, "month");
    currentDay = currentMonth.date(1);
    currentWeekCount = 1;
  }

  return list;
}

export { getEventInEveryWeek, getEventInSingleWeek };
