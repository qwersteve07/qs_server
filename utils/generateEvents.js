import {
  getEventInEveryWeek,
  getEventInSingleWeek,
} from "./getStaticEvents.js";
import { sortEventsMethod } from "./sortEvents.js";
import { JSONFilePreset } from "lowdb/node";

async function run() {
  const socialData = { events: [], classes: [] };
  const db = await JSONFilePreset("social-db2.json", socialData);

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

  const suaveSocialEvents = getEventInEveryWeek("suave-latin-social", 3);

  const laCalleEvents = getEventInEveryWeek("la-calle", 3);

  const bailaloFreePratica = getEventInEveryWeek("bailalo-free-practica", 4);

  const events = [
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
    ...suaveSocialEvents,
    ...laCalleEvents,
    ...bailaloFreePratica,
  ];

  const result = events.toSorted(sortEventsMethod);
  db.data.events = result;
  await db.write();
}

run();
