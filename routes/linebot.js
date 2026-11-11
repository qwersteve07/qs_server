import Router from "koa-router";
import linebotController from "../controller/linebot.js";

const router = new Router();

router.post("/linebot", linebotController.receiveMessage);

export default router;
