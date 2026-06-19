import type { CityDoc, RouteHandler } from "../types";
import { getDb } from "../db";
import { ok, notFound, badRequest } from "../response";
import { Collections } from "../collections";

/** GET /cities — full name list for autocomplete */
export const listCities: RouteHandler = async ({ origin }) => {
  const db = await getDb();
  const docs = await db
    .collection(Collections.city)
    .find({}, { projection: { "properties.name": 1, _id: 0 } })
    .sort({ "properties.name": 1 })
    .toArray();
  return ok(
    docs.map((d) => d.properties.name),
    origin,
  );
};

/** GET /cities/:name — full city document */
export const getCity: RouteHandler = async ({ params, origin }) => {
  const DISTANCE_METERS = 16093;
  const NUM_SIRENS = 20;
  const db = await getDb();
  const city = await db
    .collection(Collections.city)
    .findOne(
      { "properties.name": params.name },
      { projection: { _id: 0 }, collation: { locale: "en", strength: 2 } },
    );
  if (!city)
    return notFound(`No city found with name "${params.name}"`, origin);

  const lat = parseFloat(city.properties.intptlat);
  const lon = parseFloat(city.properties.intptlon);

  const [nearbyDocs, countyDocs, reservoirDocs, sirenDocs] = await Promise.all([
    db
      .collection(Collections.city)
      .aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [lon, lat] },
            distanceField: "dist",
            spherical: true,
            key: "geometry",
            query: { "properties.name": { $ne: city.properties.name } },
          },
        },
        { $limit: 3 },
        { $project: { "properties.name": 1, _id: 0 } },
      ])
      .toArray(),
    db
      .collection(Collections.county)
      .aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [lon, lat] },
            distanceField: "dist",
            spherical: true,
            key: "geometry",
          },
        },
        { $limit: 1 },
        { $project: { "properties.name": 1, _id: 0 } },
      ])
      .toArray(),
    db
      .collection(Collections.reservoir)
      .aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [lon, lat] },
            distanceField: "dist",
            spherical: true,
          },
        },
        { $limit: 5 },
        {
          $project: {
            "properties.name": 1,
            percentFull: 1,
            geometry: 1,
            _id: 0,
          },
        },
      ])
      .toArray(),
    db
      .collection(Collections.siren)
      .aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [lon, lat] },
            key: "geometry",
            distanceField: "dist",
            maxDistance: DISTANCE_METERS,
            spherical: true,
          },
        },
        { $limit: NUM_SIRENS },
        { $sort: { dist: 1 } },
        { $project: { _id: 0, _fetchedAt: 0 } },
      ])
      .toArray(),
  ]);

  const reservoirCities = await Promise.all(
    reservoirDocs.map((r: any) =>
      db
        .collection(Collections.city)
        .aggregate([
          {
            $geoNear: {
              near: { type: "Point", coordinates: r.geometry.coordinates },
              distanceField: "dist",
              spherical: true,
              key: "geometry",
            },
          },
          { $limit: 1 },
          { $project: { "properties.name": 1, _id: 0 } },
        ])
        .next(),
    ),
  );

  const TWENTY_FOUR_HOURS = 86400;

  function sanitizeDescription(description: unknown): string | null {
    if (!description) return null;
    let raw: string | null = null;
    if (typeof description === "string") {
      raw = description;
    } else if (
      typeof description === "object" &&
      "@text" in (description as object)
    ) {
      const text = (description as Record<string, unknown>)["value"];
      if (typeof text === "string") raw = text;
    }
    if (!raw) return null;
    return (
      raw
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim() || null
    );
  }

  return ok(
    {
      ...city,
      county: countyDocs[0]?.properties?.name ?? null,
      nearby: nearbyDocs.map((d: any) => d.properties.name),
      reservoirs: reservoirDocs.map((d: any, i: number) => ({
        name: d.properties.name,
        percentFull: d.percentFull ?? null,
        nearestCity: (reservoirCities[i] as any)?.properties?.name ?? null,
      })),
      sirens: sirenDocs.map((d: any) => ({
        name: d.properties?.name ?? null,
        description: sanitizeDescription(d.properties?.description),
        lat: d.geometry?.coordinates?.[1] ?? null,
        lon: d.geometry?.coordinates?.[0] ?? null,
      })),
    },
    origin,
    TWENTY_FOUR_HOURS,
  );
};

/** GET /searches/top?limit=100 — most-searched cities, sorted by timesSearched desc */
export const getTopSearched: RouteHandler = async ({ query, origin }) => {
  const limit = Math.min(Number(query.limit ?? 100), 500);
  const db = await getDb();
  const docs = await db
    .collection(Collections.city)
    .find(
      {},
      { projection: { "properties.name": 1, timesSearched: 1, _id: 0 } },
    )
    .sort({ timesSearched: -1 })
    .limit(limit)
    .toArray();
  return ok(
    docs.map((d) => ({
      name: d.properties.name,
      timesSearched: d.timesSearched,
    })),
    origin,
  );
};

/** GET /searches/recent?limit=10 — most recently searched cities, sorted by lastSearched desc */
export const getRecentSearched: RouteHandler = async ({ query, origin }) => {
  const limit = Math.min(Number(query.limit ?? 10), 50);
  const db = await getDb();
  const docs = (await db
    .collection(Collections.city)
    .find(
      { lastSearched: { $exists: true, $ne: null } },
      {
        projection: {
          "properties.name": 1,
          "properties.intptlat": 1,
          "properties.intptlon": 1,
          lastSearched: 1,
          _id: 0,
        },
      },
    )
    .sort({ lastSearched: -1 })
    .limit(limit)
    .toArray()) as CityDoc[];
  return ok(
    docs.map((d) => ({
      name: d.properties.name,
      lastSearched: d.lastSearched,
    })),
    origin,
  );
};

/** POST /cities/:name/search — increment timesSearched and stamp lastSearched */
export const recordSearch: RouteHandler = async ({ params, origin }) => {
  if (!params.name) return badRequest("City name is required", origin);
  const db = await getDb();
  const result = await db.collection(Collections.city).findOneAndUpdate(
    { "properties.name": params.name },
    [
      {
        $set: {
          timesSearched: {
            $cond: [
              { $eq: ["$timesSearched", null] },
              1,
              { $add: ["$timesSearched", 1] },
            ],
          },
          lastSearched: new Date(),
        },
      },
    ],
    {
      returnDocument: "after",
      projection: { "properties.name": 1, timesSearched: 1, _id: 0 },
      collation: { locale: "en", strength: 2 },
    },
  );
  if (!result)
    return notFound(`No city found with name "${params.name}"`, origin);
  return ok(
    { name: result.properties.name, timesSearched: result.timesSearched },
    origin,
  );
};

/** GET /cities/sample - select random cities spaced apart on the map */
export const getSample: RouteHandler = async () => {
  function parseCoord(city: CityDoc): [number, number] {
    return [
      parseFloat(city.properties.intptlon),
      parseFloat(city.properties.intptlat),
    ];
  }

  const minDistanceMeters = 50000;
  const earthRadiusMeters = 6378100;
  const distanceInRadians = minDistanceMeters / earthRadiusMeters;

  const db = await getDb();
  const city1 = (await db
    .collection(Collections.city)
    .aggregate([{ $sample: { size: 1 } }])
    .next()) as CityDoc;
  const coord1 = parseCoord(city1);
  const city2 = (await db
    .collection(Collections.city)
    .aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: coord1 },
          distanceField: "distanceFromCity1",
          minDistance: minDistanceMeters, // Must be further than this
          spherical: true,
        },
      },
      { $sample: { size: 1 } },
    ])
    .next()) as CityDoc;
  const coord2 = parseCoord(city2);
  const city3 = (await db
    .collection(Collections.city)
    .aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: coord1 },
          distanceField: "distanceFromCity1",
          minDistance: minDistanceMeters,
          spherical: true,
        },
      },
      {
        $match: {
          location: {
            $not: {
              $geoWithin: {
                $centerSphere: [coord2, distanceInRadians],
              },
            },
          },
        },
      },
      {
        $match: {
          _id: { $nin: [city1._id, city2._id] },
        },
      },
      {
        $sample: { size: 1 },
      },
    ])
    .next()) as CityDoc;
  return ok([city1, city2, city3]);
};
