const TOKEN_URL =
  "https://ercotb2c.b2clogin.com/ercotb2c.onmicrosoft.com/B2C_1_PUBAPI-ROPC-FLOW/oauth2/v2.0/token";
const CLIENT_ID = "fec253ea-0d06-4272-a5e6-b478baeecd70";
const API_BASE = "https://api.ercot.com/api/public-reports";

const RT_SPP_ENDPOINT = "/np6-905-cd/spp_node_zone_hub";
const LOAD_FORECAST_ENDPOINT = "/np3-565-cd/lf_by_model_weather_zone";

interface ErcotConfig {
  username: string;
  password: string;
  subscriptionKey: string;
}

interface CachedToken {
  idToken: string;
  expiresAt: number;
}

let tokenCache: CachedToken | null = null;

function getConfig(): ErcotConfig {
  const username = process.env.ERCOT_USERNAME;
  const password = process.env.ERCOT_PASSWORD;
  const subscriptionKey = process.env.ERCOT_SUBSCRIPTION_KEY;
  if (!username || !password || !subscriptionKey) {
    throw new Error(
      "Missing ERCOT credentials: set ERCOT_USERNAME, ERCOT_PASSWORD, ERCOT_SUBSCRIPTION_KEY",
    );
  }
  return { username, password, subscriptionKey };
}

async function getToken(config: ErcotConfig): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    console.log("[ercot] using cached token");
    return tokenCache.idToken;
  }
  console.log("[ercot] fetching new token");

  const body = new URLSearchParams({
    grant_type: "password",
    username: config.username,
    password: config.password,
    response_type: "id_token",
    scope: `openid ${CLIENT_ID}`,
    client_id: CLIENT_ID,
  });

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`ERCOT token request failed: ${res.status}`);
  }

  const json = (await res.json()) as { id_token: string; expires_in: number };
  // Cache with a 60-second buffer before actual expiry
  tokenCache = {
    idToken: json.id_token,
    expiresAt: Date.now() + (json.expires_in - 60) * 1000,
  };
  return tokenCache.idToken;
}

async function fetchErcot<T>(
  endpoint: string,
  params: Record<string, string> = {},
): Promise<T> {
  const config = getConfig();
  const token = await getToken(config);

  const url = new URL(API_BASE + endpoint);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  console.log(`[ercot] GET ${url.toString()}`);

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Ocp-Apim-Subscription-Key": config.subscriptionKey,
    },
    signal: AbortSignal.timeout(10_000),
  });

  const body = await res.text();
  console.log(
    `[ercot] ${endpoint} → ${res.status} (${body.length} bytes):`,
    body.slice(0, 300),
  );

  if (!res.ok) {
    throw new Error(
      `ERCOT API ${res.status} for ${endpoint}: ${body.slice(0, 200)}`,
    );
  }

  return JSON.parse(body) as T;
}

// ── Response shapes ───────────────────────────────────────────────────────────

export interface ErcotPage<T> {
  _meta: { totalPages: number; totalRecords: number };
  data: T[];
}

export interface RtSppRecord {
  SCEDTimestamp: string;
  RepeatedHourFlag: string;
  SettlementPoint: string;
  SettlementPointPrice: number;
  SettlementPointType: string;
}

export interface LoadForecastRecord {
  DeliveryDate: string;
  HourEnding: string;
  DSTFlag: string;
  SystemTotal: number;
  COAST?: number;
  EAST?: number;
  FAR_WEST?: number;
  NORTH?: number;
  NORTH_C?: number;
  SOUTH_C?: number;
  SOUTHERN?: number;
  WEST?: number;
  HOUSTON?: number;
}

// ── Public helpers ────────────────────────────────────────────────────────────

export async function getRtSpp(
  params: Record<string, string> = {},
): Promise<ErcotPage<RtSppRecord>> {
  return fetchErcot<ErcotPage<RtSppRecord>>(RT_SPP_ENDPOINT, params);
}

export async function getLoadForecast(
  params: Record<string, string> = {},
): Promise<ErcotPage<LoadForecastRecord>> {
  return fetchErcot<ErcotPage<LoadForecastRecord>>(
    LOAD_FORECAST_ENDPOINT,
    params,
  );
}
