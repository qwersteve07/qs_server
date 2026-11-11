// 套用 db/migrations 內尚未執行的 migration（production 不需安裝 drizzle-kit）
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "./index.js";

await migrate(db, { migrationsFolder: new URL("./migrations", import.meta.url).pathname });
console.log("migrations applied");
await pool.end();
