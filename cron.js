const cron = require("node-cron");
const runFlowCrawler = require("./utils/flow-crawler");

const runCron = () => {
  cron.schedule("0 0 * * *", () => {
    runFlowCrawler();
  });
};

module.exports = runCron;
