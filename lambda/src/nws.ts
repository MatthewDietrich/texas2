const ALERTS_BASE = "https://api.weather.gov/alerts/active";

export interface NwsAlert {
  id: string;
  areaDesc: string;
  sent: string;
  effective: string;
  onset: string;
  expires: string;
  ends: string | null;
  status: string;
  messageType: string;
  severity: string;
  certainty: string;
  urgency: string;
  event: string;
}

export interface NwsAlerts {
  type: string;
  features: Array<{
    type: string;
    properties: NwsAlert;
    geometry: object | null;
  }>;
}

export async function getActiveAlerts(
  latitude: number,
  longitude: number,
): Promise<NwsAlerts> {
  const point = `${latitude},${longitude}`;
  const res = await fetch(`${ALERTS_BASE}?point=${point}`);
  if (!res.ok) throw new Error(`NWS alerts API ${res.status} for ${point}`);
  return res.json() as Promise<NwsAlerts>;
}
