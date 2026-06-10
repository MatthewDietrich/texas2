import type { APIGatewayProxyResultV2 } from 'aws-lambda'

export interface RouteContext {
  params: Record<string, string>
  query:  Record<string, string>
  body:   unknown
  origin: string
}

export type RouteHandler = (ctx: RouteContext) => Promise<APIGatewayProxyResultV2>

export interface Route {
  method:  string
  pattern: RegExp
  keys:    string[]
  handler: RouteHandler
}

// ── MongoDB document shapes ──────────────────────────────────────────────────

export interface CityDoc {
  properties: {
    name: string
  }
  county:        string
  state:         string
  lat:           number
  lon:           number
  population:    number
  timesSearched: number
  lastSearched:  string | null
  nearby:        string[]
}

export interface CameraDoc {
  icdId:                string
  direction:            string
  location: {
    type:        'Point'
    coordinates: [number, number]  // [longitude, latitude] — GeoJSON order
  }
  hasSnapshot:          boolean
  districtAbbreviation: string
  timesViewed:          number
  lastViewed:           string | null
}
