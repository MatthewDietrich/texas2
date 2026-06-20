import type { RouteHandler } from "../types";
import { ok, notFound } from "../response";
import { getCityCoords } from "../cityCoords";
import { getDb } from "../db";
import { Collections } from "../collections";

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

  const zoneName = ((zoneDoc as any).properties.NAME as string).toLowerCase();

  const now = new Date();
  const sampleDoc = await db.collection(Collections.ercotLoadForecast).findOne({});
  console.log("[energy] sample forecast doc:", JSON.stringify(sampleDoc));
  console.log("[energy] querying interval_start_utc >=", now.toISOString());
  const forecastDocs = await db
    .collection(Collections.ercotLoadForecast)
    .find(
      { interval_start_utc: { $gte: now.toISOString() } },
      { projection: { _id: 0, _fetchedAt: 0 }, sort: { interval_start_utc: 1 } },
    )
    .limit(4)
    .toArray();
  console.log("[energy] forecastDocs count:", forecastDocs.length);

  const loadForecast = forecastDocs.map((r: any) => ({
    intervalStart: r.interval_start_utc,
    systemMW: Math.round(r.system_total),
    zoneMW: zoneName != null ? Math.round(r[zoneName] ?? 0) : null,
  }));

  return ok({ loadZone: zoneName, loadForecast }, origin, 300);
};
