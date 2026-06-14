import type { APIGatewayProxyResultV2 } from "aws-lambda";
import { Document, WithId } from "mongodb";

export interface RouteContext {
  params: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
  origin: string;
}

export type RouteHandler = (
  ctx: RouteContext,
) => Promise<APIGatewayProxyResultV2>;

export interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  handler: RouteHandler;
}

// ── MongoDB document shapes ──────────────────────────────────────────────────

export interface CityDoc extends WithId<Document> {
  properties: {
    name: string;
    intptlat: string;
    intptlon: string;
  };
  population: number;
  timesSearched: number;
  lastSearched: string | null;
  nearby: string[];
}

export interface CameraDoc {
  icdId: string;
  direction: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude] — GeoJSON order
  };
  hasSnapshot: boolean;
  districtAbbreviation: string;
  timesViewed: number;
  lastViewed: string | null;
}

export interface AirportDoc {
  type: "Feature";
  id: number;
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: {
    GID: number;
    AIRPRT_NM: string;
  };
}

export interface HighwayDoc {
  type: "Feature";
  id: number;
  geometry: {
    type: "LineString";
    coordinates: [number, number][];
  };
  name: string;
}
