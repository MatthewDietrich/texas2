import type { Db } from "mongodb";
import type { RouteHandler } from "../types";
import { ok, notFound } from "../response";
import { getDb } from "../db";
import { Collections } from "../collections";
import {
  fetchWellsInPolygon,
  enrichWithStatus,
  type WellPoint,
  type StatusStore,
  type WellStatus,
} from "../rrcWells";

const WELLS_TTL_MS = 60 * 60 * 1000;

function isCacheFresh(city: Record<string, unknown>): boolean {
  return (
    Array.isArray(city.wellsPoints) &&
    typeof city.wellsPointsCachedAt === "string" &&
    Date.now() - new Date(city.wellsPointsCachedAt as string).getTime() <
      WELLS_TTL_MS
  );
}

function makeMongoStore(db: Db): StatusStore {
  return {
    async getByApiNumbers(apis) {
      const docs = await db
        .collection(Collections.rrcWell)
        .find({ api: { $in: apis } }, { projection: { _id: 0 } })
        .toArray();
      const map = new Map<string, WellStatus>();
      for (const doc of docs)
        map.set(doc.api as string, doc as unknown as WellStatus);
      return map;
    },
  };
}

/** GET /cities/:name/wells */
export const getWellsForCity: RouteHandler = async ({ params, origin }) => {
  const db = await getDb();
  const city = await db.collection(Collections.city).findOne(
    { "properties.name": params.name },
    {
      projection: { geometry: 1, wellsPoints: 1, wellsPointsCachedAt: 1, _id: 0 },
      collation: { locale: "en", strength: 2 },
    },
  );

  if (!city) return notFound(`No city found with name "${params.name}"`, origin);

  const geo = city.geometry as
    | { type: "Polygon"; coordinates: [number, number][][] }
    | { type: "MultiPolygon"; coordinates: [number, number][][][] }
    | null;

  if (!geo) return notFound(`No boundary geometry for "${params.name}"`, origin);

  const rings: [number, number][][] =
    geo.type === "Polygon"
      ? geo.coordinates
      : geo.coordinates[0];

  let wellPoints: WellPoint[];
  if (isCacheFresh(city)) {
    wellPoints = city.wellsPoints as WellPoint[];
  } else {
    wellPoints = await fetchWellsInPolygon(rings);
    await db.collection(Collections.city).updateOne(
      { "properties.name": params.name },
      { $set: { wellsPoints: wellPoints, wellsPointsCachedAt: new Date().toISOString() } },
      { collation: { locale: "en", strength: 2 } },
    );
  }

  const wells = await enrichWithStatus(wellPoints, makeMongoStore(db));
  return ok(wells, origin, 3600);
};
