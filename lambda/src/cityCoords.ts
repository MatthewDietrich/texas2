import { getDb } from "./db";
import { Collections } from "./collections";

export interface CityCoords {
  lat: number;
  lon: number;
}

export async function getCityCoords(name: string): Promise<CityCoords | null> {
  const db = await getDb();
  const city = await db.collection(Collections.city).findOne(
    { "properties.name": name },
    {
      projection: {
        "properties.intptlat": 1,
        "properties.intptlon": 1,
        _id: 0,
      },
      collation: { locale: "en", strength: 2 },
    },
  );
  if (!city) return null;
  return {
    lat: parseFloat(city.properties.intptlat),
    lon: parseFloat(city.properties.intptlon),
  };
}
