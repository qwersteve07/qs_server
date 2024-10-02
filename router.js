const Router = require("koa-router");
const urlController = require("./controller/url");
const flowController = require("./controller/flow");
const router = new Router();

router.get("/", (ctx) => {
  ctx.body = "hello";
  ctx.status = 200;
});
router.post("/generateUrl", urlController.generateUrl);
router.get("/search/:hash", urlController.searchHash);
router.get("/flow/fetch-static-schedule", flowController.fetchStaticSchedule);
router.post("/flow/fetch-site-schedule", flowController.fetchSiteSchedule);
router.post("/flow/check-in-class", flowController.checkInClass);
router.post("/flow/check-out-class", flowController.checkOutClass);

module.exports = router;
