import type { RouteHandler } from "../types";
import { ok, notFound } from "../response";
import { getCityCoords } from "../cityCoords";
import { getDb } from "../db";
import { Collections } from "../collections";
import { getRtSpp, getLoadForecast } from "../ercot";

// Map ERCOT load zone NAMEs to the column name in the load forecast report.
// Zones not listed here fall back to SystemTotal only.
const ZONE_TO_FORECAST_COL: Record<string, string> = {
  HOUSTON: "HOUSTON",
  NORTH: "NORTH",
  SOUTH: "SOUTHERN",
  WEST: "WEST",
  NORTHWEST: "NORTH",
  "FAR WEST": "FAR_WEST",
  "SOUTH CENTRAL": "SOUTH_C",
  "NORTH CENTRAL": "NORTH_C",
};

function centralDate(): string {
  return new Date().toLocaleDateString("en-US", {
    timeZone: "America/Chicago",
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

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
    return ok(
      {
        loadZone: null,
        currentPrice: null,
        recentPrices: [],
        loadForecast: [],
      },
      origin,
      300,
    );
  }

  const zoneName = (zoneDoc as any).properties.NAME as string;
  const settlementPoint = `LZ_${zoneName.replace(/[\s-]+/g, "_").toUpperCase()}`;
  const forecastCol = ZONE_TO_FORECAST_COL[zoneName.toUpperCase()] ?? null;
  const today = centralDate();

  const [sppResult, forecastResult] = await Promise.allSettled([
    getRtSpp({ SettlementPoint: settlementPoint, size: "24" }),
    getLoadForecast({ DeliveryDate: today, size: "24" }),
  ]);

  const sppRecords =
    sppResult.status === "fulfilled" ? sppResult.value.data : [];
  const recentPrices = sppRecords.map((r) => ({
    timestamp: r.SCEDTimestamp,
    price: Math.round(r.SettlementPointPrice * 100) / 100,
  }));
  const currentPrice = recentPrices.at(-1) ?? null;

  const forecastRecords =
    forecastResult.status === "fulfilled" ? forecastResult.value.data : [];
  const loadForecast = forecastRecords.map((r) => ({
    hourEnding: r.HourEnding,
    systemMW: Math.round(r.SystemTotal),
    zoneMW:
      forecastCol != null
        ? Math.round(((r as any)[forecastCol] as number) ?? 0)
        : null,
  }));

  return ok(
    {
      loadZone: zoneName,
      settlementPoint,
      currentPrice,
      recentPrices,
      loadForecast,
    },
    origin,
    300,
  );
};
