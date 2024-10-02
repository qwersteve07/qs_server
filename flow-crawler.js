const fetch = require("node-fetch");
const cheerio = require("cheerio");
const fs = require("fs");
const dayjs = require("dayjs");

async function fetchFromFlowWebsite() {
  return await fetch(
    "https://flowtaipei.com/php/personcheckinclasstables.php",
    {
      method: "POST",
      headers: {
        "Content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      body: new URLSearchParams({
        pagetype: "listall",
      }),
    }
  ).then((res) => res.text());
}

function parseWithCheerio(html) {
  const $ = cheerio.load(html);
  let result = [];
  $(".flow_container_98_1000")
    .find("table[name=class_table]")
    .each((_, table) => {
      // 未登入時有些課程會設定隱藏
      if ($(table).text().trim() === "") return;
      let dataItem = {};

      if ($(table).find("h3").text().includes("本周沒有課哦")) {
        // 當週停課
        dataItem.status = "suspend";
      } else if (
        // 單堂取消
        $(table).find("button")?.attr()?.value.includes("CanceledInPersonClass")
      ) {
        dataItem.status = "canceled";
      } else {
        dataItem.status = "active";
      }

      $(table)
        .find("td[hidden]")
        .each((index, td) => {
          if (index === 0) {
            dataItem.classLog = $(td).text().trim();
          }
          if (index === 9) {
            const text = $(td).text().trim();
            dataItem.dayOfWeek = dayjs(text).day();
            dataItem.date = text;
          }
          if (index === 11) {
            const title = $(td).text().trim();

            const getDanceType = (title) => {
              if (title.toLowerCase().includes("salsa")) {
                return "salsa";
              } else if (title.toLowerCase().includes("bachata")) {
                return "bachata";
              } else if (title.toLowerCase().includes("zouk")) {
                return "zouk";
              } else {
                return "salsa";
              }
            };

            dataItem.title = title;
            dataItem.type = getDanceType(title);
          }
          if (index === 12) {
            dataItem.teacher = $(td)
              .text()
              .trim()
              .split(",")
              .map((t) => t.trim());
          }
          if (index === 13) {
            dataItem.classId = $(td).text().trim();
          }
          if (index === 10) {
            dataItem.time = $(td).text().trim();
          }
        });

      const imageSrc = $(table).find(".flow_img_500").attr();
      if (imageSrc) {
        dataItem.imageSrc = $(table).find(".flow_img_500").attr().src;
      }

      result.push(dataItem);
    });

  return result;
}

(async () => {
  const htmlString = await fetchFromFlowWebsite();
  const data = parseWithCheerio(htmlString);
  fs.writeFile("./data/flow-schedule.json", JSON.stringify(data), (err) => {
    if (err) console.log(err);
    else {
      console.log("File written successfully");
    }
  });
})();
