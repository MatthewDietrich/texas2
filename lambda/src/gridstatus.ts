const BASE = "https://api.gridstatus.io/v1";

function getApiKey(): string {
  const key = process.env.GRIDSTATUS_API_KEY;
  if (!key) throw new Error("Missing GRIDSTATUS_API_KEY");
  return key;
}

export interface LoadForecastRecord {
  intervalstarttime: string;
  north: number;
  south: number;
  west: number;
  houston: number;
  system_total: number;
  [key: string]: unknown;
}

export async function fetchLoadForecast(
  params: Record<string, string>,
): Promise<LoadForecastRecord[]> {
  const url = new URL(
    `${BASE}/datasets/ercot_load_forecast_by_forecast_zone/query`,
  );
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: { "X-Api-Key": getApiKey() },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GridStatus ${res.status}: ${body.slice(0, 200)}`);
  }

  const json = (await res.json()) as { data: LoadForecastRecord[] };
  return json.data;
}
