# Postgres（social-dance.tw）

ORM：[Drizzle](https://orm.drizzle.team)。資料表定義在 `db/schema.js`，migration 在 `db/migrations/`。

| 資料表 | 內容 |
|---|---|
| `users` | 後台帳號（原 `social-dance-user.js`） |
| `refresh_tokens` | JWT refresh token（原本存在記憶體） |
| `organizers` / `classes` | 主辦單位與其固定課程 |
| `events` | 活動 / 舞會 |
| `workshops` | 不定期 workshop（原前端 `const/workshop.ts`） |

## Droplet 首次安裝

```bash
# 1. 安裝 Postgres（Ubuntu）
sudo apt update && sudo apt install -y postgresql
sudo systemctl enable --now postgresql

# 2. 建立帳號與資料庫（只監聽 localhost，不需開防火牆）
sudo -u postgres psql -c "CREATE USER qs_server WITH PASSWORD '<強密碼>';"
sudo -u postgres psql -c "CREATE DATABASE social_dance OWNER qs_server;"

# 3. 專案設定
cd ~/qs_server && git pull
cp .env.example .env   # 填入 DATABASE_URL 與兩個 JWT secret
pnpm install           # 或 npm install（新增了 drizzle-orm、pg）

# 4. 建表 + 匯入舊資料
pnpm db:migrate
pnpm db:seed           # 讀 social-db.json / social-dance-user.js / data/seed-workshops.json

# 5. 重啟
pm2 restart server
```

> 換新的 JWT secret 後，所有人需要重新登入一次。

## 之後修改資料表

```bash
# 本機：改 db/schema.js 後產生 migration 並 commit
pnpm db:generate
# droplet：git pull 之後
pnpm db:migrate && pm2 restart server
```

## 備份

```bash
# 先把密碼放進 ~/.pgpass，cron 才不會卡在輸入密碼
echo "localhost:5432:social_dance:qs_server:<強密碼>" >> ~/.pgpass && chmod 600 ~/.pgpass
mkdir -p ~/backups

# 每日備份（crontab -e）
0 4 * * * pg_dump -U qs_server -h localhost social_dance | gzip > ~/backups/social_dance_$(date +\%F).sql.gz
```

建議定期把 `~/backups` 同步到 droplet 以外的地方（例如 DigitalOcean Spaces），或開啟 droplet 的 Backups 功能。

## 瀏覽資料

`pnpm db:studio` 會開啟 Drizzle Studio（需能連到 DB；從本機可用 `ssh -L 5432:localhost:5432 <droplet>` 轉發）。
