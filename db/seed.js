// 一次性把 social-db.json / social-dance-user.js / data/seed-workshops.json 匯入 Postgres
// 用法：node db/seed.js          （資料表非空時會中止）
//       node db/seed.js --force  （清空 users/organizers/classes/events/workshops 後重新匯入）
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { sql } from "drizzle-orm";
import { db, pool, schema } from "./index.js";
import { eventFromBody, organizerFromBody, classesFromBody, workshopFromBody } from "./mappers.js";

const { users, organizers, classes, events, workshops } = schema;
const force = process.argv.includes("--force");

const readJson = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url), "utf8"));

const socialDb = readJson("../social-db.json");
const workshopSeed = readJson("../data/seed-workshops.json");
const { socialDanceUsers } = await import("../social-dance-user.js");

await db.transaction(async (tx) => {
  const [{ count }] = await tx.select({ count: sql`count(*)::int` }).from(events);
  if (count > 0 && !force) {
    throw new Error(`events table already has ${count} rows. Re-run with --force to wipe and re-import.`);
  }
  if (force) {
    await tx.execute(
      sql`TRUNCATE ${classes}, ${organizers}, ${events}, ${workshops}, ${users} RESTART IDENTITY CASCADE`,
    );
  }

  // users：保留原 id，之後 serial 從最大 id 繼續
  await tx.insert(users).values(
    socialDanceUsers.map((u) => ({ id: u.id, username: u.username, passwordHash: u.password, role: u.role })),
  );
  await tx.execute(sql`SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users))`);

  // organizers + classes
  for (const [position, o] of socialDb.organizers.entries()) {
    await tx.insert(organizers).values({ id: o.id, position, ...organizerFromBody(o) });
    const classRows = classesFromBody(o.id, o.classes);
    if (classRows.length) await tx.insert(classes).values(classRows);
  }

  // events：用 createdAt 保留原本陣列順序（同一天的活動排序依此）
  const baseTime = Date.now() - socialDb.events.length * 1000;
  const seenIds = new Set();
  const reassigned = [];
  const eventRows = socialDb.events.map((e, i) => {
    let id = e.id;
    if (!id || seenIds.has(id)) {
      id = uuidv4();
      reassigned.push({ oldId: e.id, newId: id, date: e.date, title: e.title });
    }
    seenIds.add(id);
    const row = eventFromBody(e);
    if (!row.date) throw new Error(`event ${e.id} has invalid date: ${e.date}`);
    const createdAt = new Date(baseTime + i * 1000);
    return { id, ...row, calendarEventId: e.calendarEventId ?? null, createdAt, updatedAt: createdAt };
  });
  for (let i = 0; i < eventRows.length; i += 200) {
    await tx.insert(events).values(eventRows.slice(i, i + 200));
  }

  // workshops
  if (workshopSeed.length) {
    await tx.insert(workshops).values(workshopSeed.map((w) => ({ id: w.id ?? uuidv4(), ...workshopFromBody(w) })));
  }

  console.log(
    `seeded: ${socialDanceUsers.length} users, ${socialDb.organizers.length} organizers, ` +
      `${eventRows.length} events, ${workshopSeed.length} workshops`,
  );
  if (reassigned.length) {
    console.log("duplicate event ids were given new ids:");
    console.table(reassigned);
  }
});

await pool.end();
