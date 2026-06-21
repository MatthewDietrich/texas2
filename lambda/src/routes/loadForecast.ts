import type { RouteHandler } from "../types";
import { ok } from "../response";
import { getDb } from "../db";
import { Collections } from "../collections";
import { fetchLoadForecast, type LoadForecastRecord } from "../gridstatus";

export const refreshLoadForecast: RouteHandler = async ({ origin }) => {
  const now = new Date();

  // Sort by most recently published first — latest publishes are always for upcoming intervals
  const records = await fetchLoadForecast({
    sort: "-publish_time_utc",
    limit: "20",
  });

  console.log(`[loadForecast] GridStatus returned ${records.length} records`);

  // Deduplicate: keep one record per interval start time
  const seen = new Map<string, LoadForecastRecord>();
  for (const r of records) {
    if (!seen.has(r.interval_start_utc)) seen.set(r.interval_start_utc, r);
  }

  const docs = [...seen.values()];
  if (docs.length === 0) {
    console.log("[loadForecast] no records returned from GridStatus");
    return ok({ updated: 0 }, origin);
  }

  const db = await getDb();
  const result = await db.collection(Collections.ercotLoadForecast).bulkWrite(
    docs.map((r) => ({
      updateOne: {
        filter: { interval_start_utc: r.interval_start_utc },
        update: { $set: { ...r, _fetchedAt: now } },
        upsert: true,
      },
    })),
  );

  console.log(
    `[loadForecast] upserted ${result.upsertedCount} new, updated ${result.modifiedCount} existing`,
  );
  return ok({ updated: docs.length }, origin);
};
