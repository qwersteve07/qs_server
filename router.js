import Router from "koa-router";
import flowRouter from "./routes/flow.js";
import socialDanceRouter from "./routes/socialDance.js";
import linebotRouter from "./routes/linebot.js";

const router = new Router();

router.get("/", (ctx) => {
  ctx.status = 404;
});

for (const serviceRouter of [flowRouter, socialDanceRouter, linebotRouter]) {
  router.use(serviceRouter.routes(), serviceRouter.allowedMethods());
}

export default router;
