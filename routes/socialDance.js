import Router from "koa-router";
import socialDanceController from "../controller/socialDance.js";

const router = new Router({ prefix: "/social-dance" });

// auth
router.post("/login", socialDanceController.login);
router.post("/refresh", socialDanceController.refresh);
router.get("/me", socialDanceController.fetchMe);

// events
router.get("/events", socialDanceController.fetchEvents);
router.get("/eventsList", socialDanceController.fetchEventsList);
router.post("/events", socialDanceController.createEvent);
router.get("/events/:id", socialDanceController.fetchEvent);
router.put("/events/:id", socialDanceController.updateEvent);
router.delete("/events/:id", socialDanceController.deleteEvent);

// organizers
router.get("/organizers", socialDanceController.fetchOrganizers);
router.put("/organizers/:id", socialDanceController.updateOrganizer);

// workshops
router.get("/workshops", socialDanceController.fetchWorkshops);
router.post("/workshops", socialDanceController.createWorkshop);
router.get("/workshops/:id", socialDanceController.fetchWorkshop);
router.put("/workshops/:id", socialDanceController.updateWorkshop);
router.delete("/workshops/:id", socialDanceController.deleteWorkshop);

export default router;
