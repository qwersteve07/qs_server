import Koa from "koa";
import { koaBody } from "koa-body";
import cors from "@koa/cors";
import router from "./router.js";
import runCron from "./cron.js";
const app = new Koa();
const port = 8080;

(async () => {
  // await redisService.init();

  runCron();

  const allowedOrigins = [
    "https://fast-flow-three.vercel.app",
    "http://fast-flow-three.vercel.app",
    "https://social-dance.tw",
    "http://social-dance.tw",
    "http://localhost:8000",
    "http://localhost:3000",
  ];

  app
    .use(
      cors({
        origin: (ctx) => {
          const requestOrigin = ctx.request.header.origin;
          return allowedOrigins.includes(requestOrigin) ? requestOrigin : "";
        },
      })
    )
    .use(koaBody({ multipart: true }))
    .use(router.routes())
    .use(router.allowedMethods())
    .listen(port, () => {
      console.log(`server listen to ${port}`);
    });
})();
