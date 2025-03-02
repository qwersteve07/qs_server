const Koa = require("koa");
const { koaBody } = require("koa-body");
const cors = require("@koa/cors");
const router = require("./router");
// const redisService = require("./redis");
const runCron = require("./cron");
const app = new Koa();
const port = 8080;

(async () => {
  // await redisService.init();

  runCron();

  const allowedOrigins = [
    "https://fast-flow-three.vercel.app/",
    "http://fast-flow-three.vercel.app/",
    "https://social-dance.tw",
    "http://social-dance.tw",
    "http://localhost:8000",
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
