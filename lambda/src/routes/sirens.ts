import { kml as kmlToGeoJson } from '@tmcw/togeojson';
import { DOMParser } from 'xmldom';
import type { FeatureCollection } from 'geojson';
import { getClient, getDb } from "../db";
import { Collections } from "../collections";

const SIRENS_URL = "https://www.google.com/maps/d/kml?mid=1fRAxrc0b1Wng0PRe3d9x9mzQD6s&forcekml=1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function updateSirens(): Promise<{ inserted: number } | { skipped: true }> {
    const db = await getDb();

    const newest = await db
        .collection(Collections.siren)
        .findOne({}, { sort: { _fetchedAt: -1 }, projection: { _fetchedAt: 1 } });

    if (newest?._fetchedAt && Date.now() - new Date(newest._fetchedAt).getTime() < CACHE_TTL_MS) {
        return { skipped: true };
    }

    const res = await fetch(SIRENS_URL);
    if (!res.ok) throw new Error(`Failed to fetch sirens: ${res.status}`);

    const kmlText = await res.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(kmlText, 'text/xml');
    const geoJSON = kmlToGeoJson(xmlDoc) as FeatureCollection;

    const features = geoJSON.features ?? [];
    if (!features.length) return { inserted: 0 };

    const fetchedAt = new Date().toISOString();
    const docs = features.map((f) => ({ ...f, _fetchedAt: fetchedAt }));

    const mongoClient = await getClient();
    const session = mongoClient.startSession();
    let insertedCount = 0;
    try {
        await session.withTransaction(async () => {
            await db.collection(Collections.siren).deleteMany({}, { session });
            const result = await db.collection(Collections.siren).insertMany(docs, { session, ordered: false });
            insertedCount = result.insertedCount;
        });
    } finally {
        await session.endSession();
    }

    return { inserted: insertedCount };
}