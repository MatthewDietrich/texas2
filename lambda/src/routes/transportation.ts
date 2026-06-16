import type { RouteHandler } from "../types";
import { getDb } from "../db";
import { ok, notFound, badRequest } from "../response";
import { Collections } from "../collections";

const METERS_PER_MILE = 1609.34;
const AIRPORT_RADIUS_MILES = 50;
const HIGHWAY_RADIUS_MILES = 25;
const MAX_AIRPORTS = 5;
const MAX_HIGHWAYS = 5;

/** GET /cities/:name/transportation — nearby airports and highways */
export const getTransportationForCity: RouteHandler = async ({
  params,
  origin,
}) => {
  if (!params.name) return badRequest("City name is required", origin);

  const db = await getDb();
  const city = await db.collection(Collections.city).findOne(
    { "properties.name": params.name },
    {
      projection: {
        "properties.intptlat": 1,
        "properties.intptlon": 1,
        _id: 0,
      },
      collation: { locale: "en", strength: 2 },
    },
  );
  if (!city)
    return notFound(`No city found with name "${params.name}"`, origin);

  const lat = parseFloat(city.properties.intptlat);
  const lon = parseFloat(city.properties.intptlon);
  const near = { type: "Point" as const, coordinates: [lon, lat] };

  const [airports, highways] = await Promise.all([
    db
      .collection(Collections.airport)
      .aggregate([
        {
          $geoNear: {
            near,
            key: "geometry",
            distanceField: "dist",
            maxDistance: AIRPORT_RADIUS_MILES * METERS_PER_MILE,
            spherical: true,
          },
        },
        { $limit: MAX_AIRPORTS },
        {
          $project: {
            _id: 0,
            name: "$properties.ARPRT_NM",
            distanceMiles: { $divide: ["$dist", METERS_PER_MILE] },
          },
        },
      ])
      .toArray(),
    db
      .collection(Collections.highway)
      .aggregate([
        {
          $geoNear: {
            near,
            key: "geometry",
            distanceField: "dist",
            query: { name: { $ne: null } },
            maxDistance: HIGHWAY_RADIUS_MILES * METERS_PER_MILE,
            spherical: true,
          },
        },
        // Highways are stored as many line segments per name — keep only
        // the closest segment for each named highway.
        {
          $group: {
            _id: "$name",
            distanceMiles: { $min: { $divide: ["$dist", METERS_PER_MILE] } },
          },
        },
        { $sort: { distanceMiles: 1 } },
        { $limit: MAX_HIGHWAYS },
        { $project: { _id: 0, name: "$_id", distanceMiles: 1 } },
      ])
      .toArray(),
  ]);

  return ok(
    {
      airports: airports.map((a) => ({
        name: a.name as string,
        distanceMiles: Math.round(a.distanceMiles as number),
      })),
      highways: highways.map((h) => ({
        name: h.name as string,
        distanceMiles: Math.round(h.distanceMiles as number),
      })),
    },
    origin,
  );
};
