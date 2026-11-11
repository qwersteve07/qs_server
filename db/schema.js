import {
  pgTable,
  text,
  integer,
  serial,
  boolean,
  date,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// 後台登入帳號（原 social-dance-user.js）
// role 等於該帳號可管理的 organizer id，或 "superUser" / "user"
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 原本存在記憶體，pm2 重啟就會消失
export const refreshTokens = pgTable("refresh_tokens", {
  token: text("token").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const organizers = pgTable("organizers", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  city: text("city"),
  thumbnail: text("thumbnail"),
  content: text("content"),
  links: jsonb("links").$type().default([]).notNull(),
  // related 是內嵌的子單位卡片（有自己的 id/name/thumbnail/content/links），維持 jsonb
  related: jsonb("related").$type().default([]).notNull(),
  solo: boolean("solo"),
  hide: boolean("hide"),
  // 前台列表的顯示順序（原 JSON 陣列順序）
  position: integer("position").notNull().default(0),
});

export const classes = pgTable(
  "classes",
  {
    id: serial("id").primaryKey(),
    organizerId: text("organizer_id")
      .notNull()
      .references(() => organizers.id, { onDelete: "cascade", onUpdate: "cascade" }),
    // 可能是單一字串 "salsa" 或陣列 ["salsa", "bachata"]
    type: jsonb("type").notNull(),
    name: text("name").notNull(),
    level: text("level"),
    weekday: text("weekday"),
    time: text("time"),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("classes_organizer_idx").on(t.organizerId)],
);

// host / locate 不加外鍵：現有資料裡 host 有 "user"、"superUser" 等非 organizer 的值，
// locate 對應的場地清單目前在前端 const/location-*.ts
export const events = pgTable(
  "events",
  {
    id: text("id").primaryKey(),
    date: date("date", { mode: "string" }).notNull(),
    title: text("title").notNull(),
    host: text("host"),
    hostName: text("host_name"),
    locate: text("locate"),
    locateName: text("locate_name"),
    area: text("area"),
    startAt: text("start_at"),
    endAt: text("end_at"),
    rate: text("rate"),
    types: text("types").array().default([]).notNull(),
    fee: text("fee"),
    canceled: boolean("canceled").default(false).notNull(),
    content: text("content"),
    note: text("note"),
    eventUrl: text("event_url"),
    calendarEventId: text("calendar_event_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("events_date_idx").on(t.date)],
);

// 不定期 workshop（原前端 const/workshop.ts），欄位對應前端 Workshop 型別
export const workshops = pgTable(
  "workshops",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    type: text("type"),
    date: date("date", { mode: "string" }).notNull(),
    startAt: text("start_at"),
    endAt: text("end_at"),
    locate: text("locate"),
    level: text("level"),
    price: text("price"),
    details: text("details"),
    url: text("url"),
    host: text("host"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("workshops_date_idx").on(t.date)],
);
