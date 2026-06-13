import type { RouteHandler } from '../types'
import { getDb } from '../db'
import { ok } from '../response'
import { Collections } from '../collections'

const GEOJSON_URL = 'https://www.waterdatafortexas.org/reservoirs/statewide/recent-conditions.geojson'

interface ReservoirFeature {
  properties: {
    full_name:   string
    percent_full: number | null
    timestamp:   string
  }
}

/** POST /reservoirs/refresh — bulk-update percentFull from Water Data for Texas */
export const refreshReservoirs: RouteHandler = async ({ origin }) => {
  const res = await fetch(GEOJSON_URL)
  if (!res.ok) throw new Error(`Water Data API ${res.status}`)

  const { features } = await res.json() as { features: ReservoirFeature[] }

  const operations = features
    .filter(f => f.properties.full_name && f.properties.percent_full != null)
    .map(f => ({
      updateOne: {
        filter: { 'properties.name': f.properties.full_name },
        update: { $set: {
          percentFull:          f.properties.percent_full,
          percentFullUpdatedAt: f.properties.timestamp,
        }},
      },
    }))

  if (!operations.length) return ok({ updated: 0 }, origin)

  const db     = await getDb()
  const result = await db.collection(Collections.reservoir).bulkWrite(operations, { ordered: false })

  return ok({ updated: result.modifiedCount }, origin)
}
