const Router = require("koa-router");
// const urlController = require("./controller/url");
const flowController = require("./controller/flow");
const latinDanceController = require("./controller/latinDance");
const router = new Router();

router.get("/", (ctx) => {
  ctx.status = 404;
});
// router.post("/generateUrl", urlController.generateUrl);
// router.get("/search/:hash", urlController.searchHash);
router.get("/flow/fetch-static-schedule", flowController.fetchStaticSchedule);
router.post("/flow/fetch-site-schedule", flowController.fetchSiteSchedule);
router.post("/flow/check-in-class", flowController.checkInClass);
router.post("/flow/check-out-class", flowController.checkOutClass);
router.get("/latin-dance/events", latinDanceController.fetchEvents);
router.post(`/latin-dance/events`, latinDanceController.createEvent);
router.get(`/latin-dance/events/:id`, latinDanceController.fetchEvent);
router.put(`/latin-dance/events/:id`, latinDanceController.updateEvent);
router.delete(`/latin-dance/events/:id`, latinDanceController.deleteEvent);

module.exports = router;
