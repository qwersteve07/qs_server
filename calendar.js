import dayjs from "dayjs";
import { google } from "googleapis";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 1. Path to your service account key file
const KEYPATH = path.join(__dirname, "service-account.json");

// 2. Define the required scope
const SCOPES = ["https://www.googleapis.com/auth/calendar"];

// 3. Initialize the Auth client
export const auth = new google.auth.GoogleAuth({
  keyFile: KEYPATH,
  scopes: SCOPES,
});

const client = await auth.getClient();
const googleCalendar = google.calendar({ version: "v3", auth: client });

function getCalendarId(area) {
  const taipeiSocialCalendarId =
    "ec733cbbe56f90c9acd2c47828fadc6931174e8b2a9ced82b3ad69d859303cc0@group.calendar.google.com";
  const taichungSocialCalendarId =
    "7545e8582ab41487b9328126af6c1fca5b545f96b113b96c8982ff4aeb9567dc@group.calendar.google.com";
  const soundTaiwanCalendarId =
    "2716680e39594079d1d881c584ddeddaa93feec79e5fe6aa0274a3ab01b3a8ee@group.calendar.google.com";

  switch (area) {
    case "taipei":
      return taipeiSocialCalendarId;
    case "taichung":
      return taichungSocialCalendarId;
    default:
      return soundTaiwanCalendarId;
  }
}

async function createCalendarEvent(eventData, area) {
  try {
    const result = await googleCalendar.events.insert({
      calendarId: getCalendarId(area),
      resource: eventData,
    });
    return result.data;
  } catch (error) {
    console.error("Error creating calendar event:", error);
  }
}

async function updateCalendarEvent(eventId, eventData, area) {
  try {
    await googleCalendar.events.patch({
      calendarId: getCalendarId(area),
      eventId: eventId,
      resource: eventData,
    });
  } catch (error) {
    console.error("Error creating calendar event:", error);
  }
}

async function deleteCalendarEvent(eventId, area) {
  try {
    await googleCalendar.events.delete({
      calendarId: getCalendarId(area),
      eventId: eventId,
    });
  } catch (error) {
    // If the event was already deleted, Google returns a 410 Gone error
    console.error("Error deleting event:", error.message);
  }
}

function calendarEventAdapter(data) {
  const startDateTime = dayjs(
    `${data.date.split("T")[0]}T${data.startAt}:00+08:00`,
  );
  let endDateTime = dayjs(`${data.date.split("T")[0]}T${data.endAt}:00+08:00`);
  if (startDateTime.isAfter(endDateTime)) {
    endDateTime = endDateTime.add(1, "d");
  }

  function description() {
    const hostText = data.hostName ? `👑 主辦 - ${data.hostName}\n` : "";
    const feeText = data.fee ? `💰 ${data.fee}\n` : "";
    const rateText = data.rate ? `🎧 ${data.rate}\n` : "";
    const contentText = data.content ? `💬 ${data.content} \n` : "";
    const noteText = data.note ? `👁️ ${data.note} \n` : "";
    const urlText = data.eventUrl ? `🔗 瞭解更多 ${data.eventUrl}` : "";

    return `${hostText}${feeText}${rateText}${contentText}${noteText}${urlText}`;
  }

  return {
    summary: data.title,
    location: data.locateName,
    description: description(),
    transparency: "transparent",
    start: {
      dateTime: startDateTime.format(),
    },
    end: {
      dateTime: endDateTime.format(),
    },
  };
}

export default {
  calendarEventAdapter,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
};
