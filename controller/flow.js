const axios = require("axios");
const flowScheduleData = require("../data/flow-schedule.json");

const fetchStaticSchedule = async (ctx) => {
  ctx.status = 201;
  ctx.body = { result: flowScheduleData };
};

const fetchSiteSchedule = async (ctx) => {
  if (ctx) {
    // from server
    const { loginCookie } = ctx.request.body;

    await axios
      .post(
        "https://flowtaipei.com/php/personcheckinclasstables.php",
        { pagetype: "listall" },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Cookie: `wordpress_logged_in_020ece90047cac4af73cbc81ae477f5a=${loginCookie}`,
          },
        }
      )
      .then((res) => {
        ctx.status = 201;
        ctx.body = { result: res.data };
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  } else {
    // crawler use
    return await axios
      .post(
        "https://flowtaipei.com/php/personcheckinclasstables.php",
        { pagetype: "listall" },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
        }
      )
      .then((res) => res.data);
  }
};

const checkInClass = async (ctx) => {
  const { classLog, memberId } = ctx.request.body;

  await axios
    .post(
      "https://flowtaipei.com/php/personcheckin.php",
      {
        checkinidclasslog: classLog,
        checkinstudent: memberId,
        checkinattendancetype: 1,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      }
    )
    .then(() => {
      ctx.status = 201;
      ctx.body = true;
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};

const checkOutClass = async (ctx) => {
  const { checkoutStudentCode } = ctx.request.body;

  await axios
    .post(
      "https://flowtaipei.com/php/personcheckin.php",
      {
        deleteidlinkedclasslogstudent: checkoutStudentCode,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
      }
    )
    .then(() => {
      ctx.status = 201;
      ctx.body = true;
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};

module.exports = {
  fetchStaticSchedule,
  fetchSiteSchedule,
  checkInClass,
  checkOutClass,
};
