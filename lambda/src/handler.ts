import type {
  APIGatewayProxyEventV2,
  APIGatewayProxyResultV2,
} from "aws-lambda";
import { MongoTopologyClosedError } from "mongodb";
import type { Route, RouteContext } from "./types";
import { notFound, serverError } from "./response";
import { resetClient } from "./db";
import {
  listCities,
  getCity,
  getSample,
  getTopSearched,
  getRecentSearched,
  recordSearch,
} from "./routes/cities";
import { getCamera, getCamerasForCity, recordView } from "./routes/cameras";
import { getWeather } from "./routes/weather";
import { refreshDistrict } from "./routes/districts";
import { refreshReservoirs } from "./routes/reservoirs";

// ── Route table ──────────────────────────────────────────────────────────────
// Pattern groups become named params (keys array must match group order).

const ROUTES: Route[] = [
  // Cities — reads
  { method: "GET", pattern: /^\/cities$/, keys: [], handler: listCities },
  {
    method: "GET",
    pattern: /^\/cities\/sample$/,
    keys: [],
    handler: getSample,
  },
  {
    method: "GET",
    pattern: /^\/cities\/([^/]+)$/,
    keys: ["name"],
    handler: getCity,
  },
  {
    method: "GET",
    pattern: /^\/cities\/([^/]+)\/cameras$/,
    keys: ["name"],
    handler: getCamerasForCity,
  },
  {
    method: "GET",
    pattern: /^\/cities\/([^/]+)\/weather$/,
    keys: ["name"],
    handler: getWeather,
  },
  {
    method: "GET",
    pattern: /^\/searches\/top$/,
    keys: [],
    handler: getTopSearched,
  },
  {
    method: "GET",
    pattern: /^\/searches\/recent$/,
    keys: [],
    handler: getRecentSearched,
  },
  // Cameras — reads
  {
    method: "GET",
    pattern: /^\/cameras\/([^/]+)$/,
    keys: ["id"],
    handler: getCamera,
  },
  // Cities — writes
  {
    method: "POST",
    pattern: /^\/cities\/([^/]+)\/search$/,
    keys: ["name"],
    handler: recordSearch,
  },
  // Cameras — writes
  {
    method: "POST",
    pattern: /^\/cameras\/([^/]+)\/view$/,
    keys: ["id"],
    handler: recordView,
  },
  // Districts — writes
  {
    method: "POST",
    pattern: /^\/districts\/([^/]+)\/refresh$/,
    keys: ["code"],
    handler: refreshDistrict,
  },
  // Reservoirs — writes
  {
    method: "POST",
    pattern: /^\/reservoirs\/refresh$/,
    keys: [],
    handler: refreshReservoirs,
  },
];

// ── Handler ──────────────────────────────────────────────────────────────────

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
  const method = event.requestContext.http.method.toUpperCase();
  const path = event.rawPath.replace(/^\/api/, ""); // strip /api prefix if API Gateway adds one

  // OPTIONS preflight is handled by the Lambda Function URL — it never reaches here

  // Match route
  for (const route of ROUTES) {
    if (route.method !== method) continue;
    const match = path.match(route.pattern);
    if (!match) continue;

    const params: Record<string, string> = {};
    route.keys.forEach((key, i) => {
      params[key] = decodeURIComponent(match[i + 1] ?? "");
    });

    const ctx: RouteContext = {
      params,
      query: (event.queryStringParameters ?? {}) as Record<string, string>,
      body: parseBody(event),
      origin: "",
    };

    try {
      return await route.handler(ctx);
    } catch (err) {
      if (err instanceof MongoTopologyClosedError) {
        console.warn(
          `[${method} ${path}] topology closed — resetting connection and retrying`,
        );
        resetClient();
        try {
          return await route.handler(ctx);
        } catch (retryErr) {
          console.error(`[${method} ${path}] retry failed`, retryErr);
        }
      } else {
        console.error(`[${method} ${path}]`, err);
      }
      return serverError("Internal server error");
    }
  }

  return notFound(`No route for ${method} ${path}`);
};

function parseBody(event: APIGatewayProxyEventV2): unknown {
  if (!event.body) return null;
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}
