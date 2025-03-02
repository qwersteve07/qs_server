const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const {
  getEventInEveryWeek,
  getEventInSingleWeek,
} = require("./getStaticEvents");
const customEvents = require("../custom/social-dance-events.json");
const { sortEvents } = require("./sortEvents");

function run() {
  const flowMiniSocialEvents = getEventInEveryWeek("flow-mini-social", 1);
  const flowFridaySocialEvents1 = getEventInSingleWeek(
    "flow-friday-social",
    5,
    1
  );
  const flowBachataMiAmorEvents = getEventInSingleWeek(
    "flow-bachata-mi-amor",
    5,
    2
  );
  const flowFridaySocialEvents2 = getEventInSingleWeek(
    "flow-friday-social",
    5,
    3
  );
  const flowFridaySocialEvents3 = getEventInSingleWeek(
    "flow-friday-social",
    5,
    4
  );

  const flowFridaySocialEvents4 = getEventInSingleWeek(
    "flow-friday-social",
    5,
    5
  );
  const brassMonkeySocialEvents = getEventInEveryWeek(
    "brass-monkey-latin-night",
    2
  );

  const BarcadeBachataNightEvents = getEventInEveryWeek(
    "barcade-bachata-night",
    4
  );

  const outdoorSalsaConcertEvents = getEventInSingleWeek(
    "outdoor-salsa-concert",
    0,
    1
  );

  const flowZoukSocialEvents = getEventInEveryWeek("flow-zouk-social", 4);
  const CopaFridaySocialEvents = getEventInEveryWeek("copa-friday-social", 5);

  const result = [
    ...flowMiniSocialEvents,
    ...flowFridaySocialEvents1,
    ...flowBachataMiAmorEvents,
    ...flowFridaySocialEvents2,
    ...flowFridaySocialEvents3,
    ...flowFridaySocialEvents4,
    ...brassMonkeySocialEvents,
    ...BarcadeBachataNightEvents,
    ...flowZoukSocialEvents,
    ...outdoorSalsaConcertEvents,
    ...CopaFridaySocialEvents,
    ...customEvents.map((event) => ({ ...event, id: uuidv4() })),
  ];

  writeFile(sortEvents(result));
}

function writeFile(data) {
  fs.writeFile(
    "./data/social-dance-events.json",
    JSON.stringify(data),
    (err) => {
      if (err) console.log(err);
      else {
        console.log("File written successfully");
      }
    }
  );
}

run();
