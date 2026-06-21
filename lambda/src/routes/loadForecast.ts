import type { RouteHandler } from "../types";
import { ok } from "../response";
import { getDb } from "../db";
import { Collections } from "../collections";
import { fetchLoadForecast, type LoadForecastRecord } from "../gridstatus";

export const refreshLoadForecast: RouteHandler = async ({ origin }) => {
  const now = new Date();
  const db = await getDb();

  const latest = await db
    .collection(Collections.ercotLoadForecast)
    .findOne({}, { sort: { _fetchedAt: -1 }, projection: { _fetchedAt: 1 } });

  const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);
  if (latest?._fetchedAt && latest._fetchedAt > fourHoursAgo) {
    console.log("[loadForecast] data is fresh, skipping GridStatus fetch");
    return ok({ updated: 0, skipped: true }, origin);
  }

  const startOfHour = new Date(now);
  startOfHour.setMinutes(0, 0, 0);
  const end = new Date(startOfHour.getTime() + 4 * 60 * 60 * 1000);
  const toGS = (d: Date) => d.toISOString().slice(0, 19) + "+00:00";

  const records = await fetchLoadForecast({
    start_time: toGS(startOfHour),
    end_time: toGS(end),
    publish_time: "latest",
    timezone: "market",
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
