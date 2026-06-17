import type { APIGatewayProxyResultV2 } from "aws-lambda";

// CORS headers are handled entirely by the Lambda Function URL's CORS configuration.
// Setting them here too causes duplicate Access-Control-Allow-Origin headers, which
// browsers reject. Only Content-Type belongs in the Lambda response.
const HEADERS = { "Content-Type": "application/json" };

export function ok(
  body: unknown,
  _origin?: string,
  ttlSeconds?: number,
): APIGatewayProxyResultV2 {
  const headers: Record<string, string> = { ...HEADERS };
  if (ttlSeconds != null) {
    headers["Cache-Control"] =
      `public, max-age=${ttlSeconds}, s-maxage=${ttlSeconds}`;
  }
  return { statusCode: 200, headers, body: JSON.stringify(body) };
}

export function notFound(
  message: string,
  _origin?: string,
): APIGatewayProxyResultV2 {
  return {
    statusCode: 404,
    headers: HEADERS,
    body: JSON.stringify({ error: message }),
  };
}

export function badRequest(
  message: string,
  _origin?: string,
): APIGatewayProxyResultV2 {
  return {
    statusCode: 400,
    headers: HEADERS,
    body: JSON.stringify({ error: message }),
  };
}

export function serverError(
  message: string,
  _origin?: string,
): APIGatewayProxyResultV2 {
  return {
    statusCode: 500,
    headers: HEADERS,
    body: JSON.stringify({ error: message }),
  };
}
