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
  name:        string
  county:      string
  state:       string
  lat:         number
  lon:         number
  population:  number
  searchCount: number
  nearby:      string[]
}

export interface CameraDoc {
  icdId:        string
  lat:          number
  lon:          number
  nearestCity:  string
  county:       string
  viewCount:    number
  snapshotTime: string
  snapshot:     string  // base64-encoded PNG
}
