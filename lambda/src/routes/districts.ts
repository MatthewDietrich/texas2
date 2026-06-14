import type { RouteHandler } from "../types";
import { getDb } from "../db";
import { getCctvListByDistrict } from "../txdot";
import { ok, badRequest } from "../response";

/**
 * POST /districts/:code/refresh
 *
 * Fetches the live camera list from TxDOT for the given district and upserts
 * each camera into the cameras collection. Tracking fields (timesViewed,
 * lastViewed) are preserved on existing documents via $setOnInsert.
 */
export const refreshDistrict: RouteHandler = async ({ params, origin }) => {
  const districtCode = params.code?.toUpperCase();
  if (!districtCode) return badRequest("District code is required", origin);

  const cameras = await getCctvListByDistrict(districtCode);
  if (cameras.length === 0) return ok({ updated: 0, inserted: 0 }, origin);

  const db = await getDb();

  const ops = cameras.map((cam) => ({
    updateOne: {
      filter: { icdId: cam.icdId },
      update: {
        $set: {
          icdId: cam.icdId,
          direction: cam.direction,
          location: {
            type: "Point" as const,
            coordinates: [cam.longitude, cam.latitude] as [number, number],
          },
          hasSnapshot: cam.hasSnapshot,
          districtAbbreviation: districtCode,
        },
        $setOnInsert: {
          timesViewed: 0,
          lastViewed: null,
        },
      },
      upsert: true,
    },
  }));

  const result = await db.collection("cameras").bulkWrite(ops);

  return ok(
    {
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
    },
    origin,
  );
};
