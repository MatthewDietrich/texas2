const DISTRICT_BASE = "https://its.txdot.gov/its/DistrictIts";

export interface TxDotCameraStatus {
  icdId: string;
  direction: string;
  latitude: number;
  longitude: number;
  hasSnapshot: boolean;
}

export interface TxDotCameraSnapshot {
  icd_Id: string;
  snippet: string;
  timestampFormatted: string;
}

export async function getCctvListByDistrict(
  districtCode: string,
): Promise<TxDotCameraStatus[]> {
  const url = `${DISTRICT_BASE}/GetCctvStatusListByDistrict?districtCode=${encodeURIComponent(districtCode)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TxDOT district API ${res.status} for "${districtCode}"`);
  }
  return res.json() as Promise<TxDotCameraStatus[]>;
}

// Returns the snapshot as a base64 string.
// TxDOT caches snapshots server-side for ~5 minutes.
export async function getCctvSnapshot(
  icdId: string,
  districtCode: string,
): Promise<string> {
  const url = `${DISTRICT_BASE}/GetCctvSnapshotByIcdId?icdId=${encodeURIComponent(icdId)}&districtCode=${encodeURIComponent(districtCode)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`TxDOT snapshot API ${res.status} for "${icdId}"`);
  }
  const data = (await res.json()) as TxDotCameraSnapshot | null;
  if (!data?.snippet) {
    throw new Error(`TxDOT snapshot returned no data for "${icdId}"`);
  }
  return data.snippet;
}
