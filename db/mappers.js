// DB row <-> API 物件轉換。API 輸出維持原本 social-db.json 的格式，前端不需修改。
import dayjs from "dayjs";

const omitNullish = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== undefined));

const emptyToNull = (v) => (v === undefined || v === null ? null : v);

// "2026-04-04T00:00:00" / "2026-04-04T00:00:00.000Z" / "2026-11-7" -> "2026-04-04"
export function toDateOnly(value) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(String(value));
  if (match) {
    const [, y, m, d] = match;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("YYYY-MM-DD") : null;
}

// ---------- events ----------
export function eventFromBody(body) {
  return {
    date: toDateOnly(body.date),
    title: body.title ?? "",
    host: emptyToNull(body.host),
    hostName: emptyToNull(body.hostName),
    locate: emptyToNull(body.locate),
    locateName: emptyToNull(body.locateName),
    area: emptyToNull(body.area),
    startAt: emptyToNull(body.startAt),
    endAt: emptyToNull(body.endAt),
    rate: emptyToNull(body.rate),
    types: Array.isArray(body.types) ? body.types : [],
    fee: body.fee === undefined || body.fee === null ? null : String(body.fee),
    canceled: body.canceled === true || body.canceled === "true",
    content: emptyToNull(body.content),
    note: emptyToNull(body.note),
    eventUrl: emptyToNull(body.eventUrl),
  };
}

export function eventToApi(row) {
  return omitNullish({
    id: row.id,
    date: `${row.date}T00:00:00`,
    title: row.title,
    host: row.host,
    hostName: row.hostName,
    locate: row.locate,
    locateName: row.locateName,
    area: row.area,
    startAt: row.startAt,
    endAt: row.endAt,
    rate: row.rate,
    types: row.types,
    fee: row.fee,
    canceled: row.canceled,
    content: row.content,
    note: row.note,
    eventUrl: row.eventUrl,
    calendarEventId: row.calendarEventId,
  });
}

// ---------- organizers / classes ----------
export function organizerFromBody(body) {
  return {
    name: body.name ?? "",
    city: emptyToNull(body.city),
    thumbnail: emptyToNull(body.thumbnail),
    content: emptyToNull(body.content),
    links: Array.isArray(body.links) ? body.links : [],
    related: Array.isArray(body.related) ? body.related : [],
    solo: typeof body.solo === "boolean" ? body.solo : null,
    hide: typeof body.hide === "boolean" ? body.hide : null,
  };
}

export function classesFromBody(organizerId, classList) {
  return (Array.isArray(classList) ? classList : []).map((c, position) => ({
    organizerId,
    type: c.type ?? "",
    name: c.name ?? "",
    level: emptyToNull(c.level),
    weekday: emptyToNull(c.weekday),
    time: emptyToNull(c.time),
    position,
  }));
}

export function organizerToApi(row, classRows) {
  return omitNullish({
    id: row.id,
    name: row.name,
    city: row.city,
    thumbnail: row.thumbnail,
    content: row.content,
    links: row.links,
    classes: classRows.map((c) =>
      omitNullish({ type: c.type, name: c.name, weekday: c.weekday, level: c.level, time: c.time }),
    ),
    related: row.related,
    solo: row.solo,
    hide: row.hide,
  });
}

// ---------- workshops ----------
export function workshopFromBody(body) {
  return {
    name: body.name ?? "",
    type: emptyToNull(body.type),
    date: toDateOnly(body.date),
    startAt: emptyToNull(body.startAt),
    endAt: emptyToNull(body.endAt),
    locate: emptyToNull(body.locate),
    level: emptyToNull(body.level),
    price: emptyToNull(body.price),
    details: emptyToNull(body.details),
    url: emptyToNull(body.url),
    host: emptyToNull(body.host),
  };
}

export function workshopToApi(row) {
  return omitNullish({
    id: row.id,
    name: row.name,
    type: row.type,
    date: row.date,
    startAt: row.startAt,
    endAt: row.endAt,
    locate: row.locate,
    level: row.level,
    price: row.price,
    details: row.details,
    url: row.url,
    host: row.host,
  });
}
