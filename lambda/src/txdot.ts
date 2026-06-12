const DISTRICT_BASE = 'https://its.txdot.gov/its/DistrictIts'
const ITS_BASE      = 'https://its.txdot.gov/its'

// ── TxDOT response shapes ────────────────────────────────────────────────────
// Verify field names by logging the raw response against a real district code.

export interface TxDotCameraStatus {
  icdId:       string
  direction:   string
  latitude:    number
  longitude:   number
  hasSnapshot: boolean
}

// ── API calls ────────────────────────────────────────────────────────────────

export async function getCctvListByDistrict(districtCode: string): Promise<TxDotCameraStatus[]> {
  const url = `${DISTRICT_BASE}/GetCctvStatusListByDistrict?districtCode=${encodeURIComponent(districtCode)}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`TxDOT district API ${res.status} for "${districtCode}"`)
  }
  return res.json() as Promise<TxDotCameraStatus[]>
}

// Returns the snapshot image as a base64 string.
// TxDOT caches snapshots server-side for ~5 minutes.
export async function getCctvSnapshot(icdId: string, districtCode: string): Promise<string> {
  const url = `${ITS_BASE}/GetCctvSnapshotByIcdId?icdId=${encodeURIComponent(icdId)}&districtCode=${encodeURIComponent(districtCode)}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`TxDOT snapshot API ${res.status} for "${icdId}"`)
  }
  const buffer = await res.arrayBuffer()
  return Buffer.from(buffer).toString('base64')
}
