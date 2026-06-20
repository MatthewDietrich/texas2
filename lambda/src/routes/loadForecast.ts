import type { RouteHandler } from "../types";
import { ok } from "../response";
import { getDb } from "../db";
import { Collections } from "../collections";
import { fetchLoadForecast, type LoadForecastRecord } from "../gridstatus";

export const refreshLoadForecast: RouteHandler = async ({ origin }) => {
  const now = new Date();
  const end = new Date(now.getTime() + 4 * 60 * 60 * 1000);

  const records = await fetchLoadForecast({
    start: now.toISOString(),
    end: end.toISOString(),
    limit: "20", // fetch extra to deduplicate multiple publishes per interval
  });

  // Keep only the most recently published forecast per interval
  const latest = new Map<string, LoadForecastRecord>();
  for (const r of records) {
    const existing = latest.get(r.interval_start_utc);
    if (!existing || r.publish_time_utc > existing.publish_time_utc) {
      latest.set(r.interval_start_utc, r);
    }
  }

  const docs = [...latest.values()];
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
