const Koa = require("koa");
const { koaBody } = require("koa-body");
const cors = require("@koa/cors");
const router = require("./router");
const redisService = require("./redis");
const app = new Koa();
const port = 8080;

(async () => {
  await redisService.init();
  app
    .use(cors())
    .use(koaBody({ multipart: true }))
    .use(router.routes())
    .use(router.allowedMethods())
    .listen(port, () => {
      console.log(`server listen to ${port}`);
    });
})();
