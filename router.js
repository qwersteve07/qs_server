import Router from "koa-router";
import flowController from "./controller/flow.js";
import socialDanceController from "./controller/socialDance.js";
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

router.get("/social-dance/events", socialDanceController.fetchEvents);
router.get("/social-dance/eventsList", socialDanceController.fetchEventsList);
router.post(`/social-dance/events`, socialDanceController.createEvent);
router.get(`/social-dance/events/:id`, socialDanceController.fetchEvent);
router.put(`/social-dance/events/:id`, socialDanceController.updateEvent);
router.delete(`/social-dance/events/:id`, socialDanceController.deleteEvent);
router.post("/social-dance/login", socialDanceController.login);
router.post("/social-dance/refresh", socialDanceController.refresh);

export default router;
