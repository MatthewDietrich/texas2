import type { APIGatewayProxyResultV2 } from 'aws-lambda'

const CORS_HEADERS = (origin: string) => ({
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
})

export function ok(body: unknown, origin: string): APIGatewayProxyResultV2 {
  return { statusCode: 200, headers: CORS_HEADERS(origin), body: JSON.stringify(body) }
}

export function notFound(message: string, origin: string): APIGatewayProxyResultV2 {
  return { statusCode: 404, headers: CORS_HEADERS(origin), body: JSON.stringify({ error: message }) }
}

export function badRequest(message: string, origin: string): APIGatewayProxyResultV2 {
  return { statusCode: 400, headers: CORS_HEADERS(origin), body: JSON.stringify({ error: message }) }
}

export function serverError(message: string, origin: string): APIGatewayProxyResultV2 {
  return { statusCode: 500, headers: CORS_HEADERS(origin), body: JSON.stringify({ error: message }) }
}

export function noContent(origin: string): APIGatewayProxyResultV2 {
  return { statusCode: 204, headers: CORS_HEADERS(origin), body: '' }
}
