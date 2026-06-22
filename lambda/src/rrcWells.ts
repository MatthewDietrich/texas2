// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Ring = [number, number][];

interface EsriPolygon {
  rings: Ring[];
  spatialReference: { wkid: number };
}

export interface WellPoint {
  api: string;
  longitude: number;
  latitude: number;
  attributes: Record<string, unknown>;
}

export interface WellStatus {
  api: string;
  status: string | null;
  wellType: string | null;
  completionDate: string | null;
  plugDate: string | null;
  lastProductionMonth: string | null;
  oilBbl: number | null;
  gasMcf: number | null;
}

interface EnrichedWell extends WellPoint {
  status: WellStatus | null;
}

interface ArcGisFeature {
  geometry: { x: number; y: number } | null;
  attributes: Record<string, unknown>;
}

interface ArcGisQueryResponse {
  features?: ArcGisFeature[];
  error?: { code: number; message: string };
  exceededTransferLimit?: boolean;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const WELLS_QUERY_URL =
  "https://gis.rrc.texas.gov/server/rest/services/RRC_Public/Wells/MapServer/0/query";

const TOKEN_URL =
  "https://gis.rrc.texas.gov/server/tokens/generateToken";

const PAGE_SIZE = 2000;

const API_FIELD = "API";

const OUT_FIELDS = ["API", "LEASE_NAME", "OPERATOR_NO", "WELL_NO"];

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------

interface TokenCache {
  value: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

async function getToken(): Promise<string> {
  // Refresh 60 s before expiry so in-flight requests don't race the cutoff
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.value;
  }

  const body = new URLSearchParams({
    f: "json",
    client: "requestip",
    expiration: "120", // minutes
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) throw new Error(`RRC token request failed: HTTP ${res.status}`);

  const data = (await res.json()) as {
    token?: string;
    expires?: number;
    error?: { code: number; message: string };
  };

  if (data.error) {
    throw new Error(`RRC token error ${data.error.code}: ${data.error.message}`);
  }
  if (!data.token) throw new Error("RRC token response missing token field");

  tokenCache = {
    value: data.token,
    // ArcGIS returns `expires` as a Unix ms timestamp
    expiresAt: data.expires ?? Date.now() + 120 * 60 * 1000,
  };

  return tokenCache.value;
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

function ringIsClockwise(ring: Ring): boolean {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    sum += (x2 - x1) * (y2 + y1);
  }
  return sum > 0;
}

function toEsriPolygon(geojsonRings: Ring[]): EsriPolygon {
  const rings = geojsonRings.map((ring, idx) => {
    const clockwise = ringIsClockwise(ring);
    const wantClockwise = idx === 0;
    return clockwise === wantClockwise ? ring : [...ring].reverse();
  });
  return { rings, spatialReference: { wkid: 4326 } };
}

// ---------------------------------------------------------------------------
// Live GIS query
// ---------------------------------------------------------------------------

async function fetchWellsPage(
  polygon: EsriPolygon,
  offset: number,
  retrying = false,
): Promise<ArcGisQueryResponse> {
  const token = await getToken();

  const body = new URLSearchParams({
    f: "json",
    token,
    geometry: JSON.stringify(polygon),
    geometryType: "esriGeometryPolygon",
    inSR: "4326",
    outSR: "4326",
    spatialRel: "esriSpatialRelIntersects",
    outFields: OUT_FIELDS.join(","),
    returnGeometry: "true",
    resultRecordCount: String(PAGE_SIZE),
    resultOffset: String(offset),
  });

  const res = await fetch(WELLS_QUERY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    throw new Error(`RRC query failed: HTTP ${res.status}`);
  }

  const data = (await res.json()) as ArcGisQueryResponse;

  if (data.error) {
    // 499 = token expired/invalid — clear cache and retry once
    if (data.error.code === 499 && !retrying) {
      tokenCache = null;
      return fetchWellsPage(polygon, offset, true);
    }
    throw new Error(`RRC query error ${data.error.code}: ${data.error.message}`);
  }

  return data;
}

export async function fetchWellsInPolygon(geojsonRings: Ring[]): Promise<WellPoint[]> {
  const polygon = toEsriPolygon(geojsonRings);
  const wells: WellPoint[] = [];
  let offset = 0;

  while (true) {
    const page = await fetchWellsPage(polygon, offset);
    const features = page.features ?? [];

    for (const f of features) {
      if (!f.geometry) continue;
      wells.push({
        api: String(f.attributes[API_FIELD] ?? ""),
        longitude: f.geometry.x,
        latitude: f.geometry.y,
        attributes: f.attributes,
      });
    }

    const more =
      features.length === PAGE_SIZE || page.exceededTransferLimit === true;
    if (!more) break;
    offset += PAGE_SIZE;
  }

  return wells;
}

// ---------------------------------------------------------------------------
// Join against ingested status/production store
// ---------------------------------------------------------------------------

// Replace with your real data access (Postgres, etc.). Keyed by 14-digit API.
export interface StatusStore {
  getByApiNumbers(apis: string[]): Promise<Map<string, WellStatus>>;
}

export async function enrichWithStatus(
  wells: WellPoint[],
  store: StatusStore,
): Promise<EnrichedWell[]> {
  const apis = wells.map((w) => w.api).filter((a) => a.length > 0);
  const statusByApi = await store.getByApiNumbers(apis);

  return wells.map((w) => ({
    ...w,
    status: statusByApi.get(w.api) ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function getCityWells(
  cityBoundary: Ring[],
  store: StatusStore,
): Promise<EnrichedWell[]> {
  const wells = await fetchWellsInPolygon(cityBoundary);
  return enrichWithStatus(wells, store);
}