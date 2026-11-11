import Router from "koa-router";
import flowController from "../controller/flow.js";

const router = new Router({ prefix: "/flow" });

router.get("/fetch-static-schedule", flowController.fetchStaticSchedule);
router.post("/fetch-site-schedule", flowController.fetchSiteSchedule);
router.post("/check-in-class", flowController.checkInClass);
router.post("/check-out-class", flowController.checkOutClass);

export default router;
