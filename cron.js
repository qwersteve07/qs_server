import cron from "node-cron";
import runFlowCrawler from "./utils/flow-crawler.js";

const runCron = () => {
  cron.schedule("0 0 * * *", () => {
    runFlowCrawler();
  });
};

export default runCron;
