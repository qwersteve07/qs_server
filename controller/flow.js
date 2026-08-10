import axios from "axios";
import flowScheduleData from "../data/flow-schedule.json" with { type: "json" };

const fetchStaticSchedule = async (ctx) => {
  ctx.status = 201;
  ctx.body = { result: flowScheduleData };
};

const fetchSiteSchedule = async (ctx) => {
  if (ctx) {
    // from server
    const { loginCookie } = ctx.request.body;

    const fetchClassTableHtml = async (dateOffset)=>{
      return await axios
      .post(
        "https://flowtaipei.com/php/personcheckinclasstables.php",
        { pagetype: "listall",date_offset: dateOffset },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Cookie: `wordpress_logged_in_020ece90047cac4af73cbc81ae477f5a=${loginCookie}`,
          },
        }
      )
      .then((res) => res.data);
    }

    return await Promise.all([fetchClassTableHtml(0),fetchClassTableHtml(7),fetchClassTableHtml(14),fetchClassTableHtml(21),fetchClassTableHtml(28),fetchClassTableHtml(35)]).then(result=>{
      const htmlString = result[0].concat(result[1]).concat(result[2]).concat(result[3]).concat(result[4]).concat(result[5])
      ctx.status = 201;
      ctx.body = { result: htmlString };
    })
    .catch((error) => {
      console.error("Error:", error);
    });
  } else {
    // crawler use
    const fetchClassTableHtml = async (dateOffset)=>{
      return await axios
      .post(
        "https://flowtaipei.com/php/personcheckinclasstables.php",
        { pagetype: "listall",date_offset: dateOffset },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          },
        }
      )
      .then((res) => res.data);
    }
    return await Promise.all([fetchClassTableHtml(0),fetchClassTableHtml(7),fetchClassTableHtml(14),fetchClassTableHtml(21),fetchClassTableHtml(28),fetchClassTableHtml(35)]).then(result=>{
      return result[0].concat(result[1]).concat(result[2]).concat(result[3]).concat(result[4]).concat(result[5])
    })
    
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

export default { fetchStaticSchedule, fetchSiteSchedule, checkInClass, checkOutClass };
