import { kml as kmlToGeoJson } from "@tmcw/togeojson";
import { DOMParser } from "xmldom";
import type { FeatureCollection } from "geojson";
import { getClient, getDb } from "../db";
import { Collections } from "../collections";
import type { RouteHandler } from "../types";
import { ok } from "../response";

const SIRENS_URL =
  "https://www.google.com/maps/d/kml?mid=1fRAxrc0b1Wng0PRe3d9x9mzQD6s&forcekml=1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** POST /sirens/refresh — fetch latest siren locations from Google Maps KML */
export const updateSirens: RouteHandler = async ({ origin }) => {
  const db = await getDb();

  const newest = await db
    .collection(Collections.siren)
    .findOne({}, { sort: { _fetchedAt: -1 }, projection: { _fetchedAt: 1 } });

  if (
    newest?._fetchedAt &&
    Date.now() - new Date(newest._fetchedAt).getTime() < CACHE_TTL_MS
  ) {
    return ok({ skipped: true, inserted: 0 }, origin);
  }

  const res = await fetch(SIRENS_URL);
  if (!res.ok) throw new Error(`Failed to fetch sirens: ${res.status}`);

  const kmlText = await res.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(kmlText, "text/xml");
  const geoJSON = kmlToGeoJson(xmlDoc) as FeatureCollection;

  const features = geoJSON.features ?? [];
  if (!features.length) return ok({ skipped: false, inserted: 0 }, origin);

  const fetchedAt = new Date().toISOString();
  const docs = features.map((f) => ({ ...f, _fetchedAt: fetchedAt }));

  const mongoClient = await getClient();
  const session = mongoClient.startSession();
  let insertedCount = 0;
  try {
    await session.withTransaction(async () => {
      await db.collection(Collections.siren).deleteMany({}, { session });
      const result = await db
        .collection(Collections.siren)
        .insertMany(docs, { session, ordered: false });
      insertedCount = result.insertedCount;
    });
  } finally {
    await session.endSession();
  }

  return ok({ skipped: false, inserted: insertedCount }, origin);
};
