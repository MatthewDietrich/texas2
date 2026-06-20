import type { RouteHandler } from "../types";
import { ok, notFound } from "../response";
import { getCityCoords } from "../cityCoords";
import { getDb } from "../db";
import { Collections } from "../collections";

// Maps ERCOT load zone NAME to the matching field in GridStatus ercot_load_forecast_by_forecast_zone.
// GridStatus columns: houston | north | south | west
const ZONE_TO_FIELD: Record<string, string> = {
  HOUSTON: "houston",
  NORTH: "north",
  "NORTH CENTRAL": "north",
  NORTHWEST: "north",
  SOUTH: "south",
  "SOUTH CENTRAL": "south",
  WEST: "west",
  "FAR WEST": "west",
};

/** GET /cities/:name/energy */
export const getEnergyForCity: RouteHandler = async ({ params, origin }) => {
  const coords = await getCityCoords(params.name);
  if (!coords)
    return notFound(`No city found with name "${params.name}"`, origin);

  const db = await getDb();
  const { lat, lon } = coords;

  const zoneDoc = await db.collection(Collections.ercotLoadZone).findOne({
    geometry: {
      $geoIntersects: {
        $geometry: { type: "Point", coordinates: [lon, lat] },
      },
    },
  });

  if (!zoneDoc) {
    return ok({ loadZone: null, loadForecast: [] }, origin, 300);
  }

  const zoneName = (zoneDoc as any).properties.NAME as string;
  const zoneField = ZONE_TO_FIELD[zoneName.toUpperCase()] ?? null;

  const now = new Date();
  const forecastDocs = await db
    .collection(Collections.ercotLoadForecast)
    .find(
      { interval_start_utc: { $gte: now.toISOString() } },
      { projection: { _id: 0, _fetchedAt: 0 }, sort: { interval_start_utc: 1 } },
    )
    .limit(4)
    .toArray();

  const loadForecast = forecastDocs.map((r: any) => ({
    intervalStart: r.interval_start_utc,
    systemMW: Math.round(r.system_total),
    zoneMW: zoneField != null ? Math.round(r[zoneField] ?? 0) : null,
  }));

  return ok({ loadZone: zoneName, loadForecast }, origin, 300);
};
