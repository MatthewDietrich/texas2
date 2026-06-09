import { defineBackend } from '@aws-amplify/backend'
import { Duration, CfnOutput } from 'aws-cdk-lib'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// ESM-compatible __dirname
const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Backend definition ───────────────────────────────────────────────────────
// No Amplify-managed resources (auth, data) yet — just a custom CDK stack.
const backend = defineBackend({})

const apiStack = backend.createStack('TexasCityApiStack')

// ── Environment ──────────────────────────────────────────────────────────────
// Set MONGODB_URI, MONGODB_DB, and CORS_ORIGIN in the Amplify Console under
// "Environment variables". Never commit credentials here.
const corsOrigin = process.env.CORS_ORIGIN ?? '*'

// ── Lambda ───────────────────────────────────────────────────────────────────
// Points at the pre-built artifact produced by `cd lambda && npm run build`.
// The amplify.yml preBuild step runs that before CDK synth.
const apiHandler = new lambda.Function(apiStack, 'TexasCityApiHandler', {
  runtime:    lambda.Runtime.NODEJS_20_X,
  handler:    'handler.handler',
  code:       lambda.Code.fromAsset(join(__dirname, '../lambda/dist')),
  timeout:    Duration.seconds(29),
  memorySize: 512,
  environment: {
    MONGODB_URI: process.env.MONGODB_URI ?? '',
    MONGODB_DB:  process.env.MONGODB_DB  ?? 'texas',
    CORS_ORIGIN: corsOrigin,
  },
})

// ── Function URL ─────────────────────────────────────────────────────────────
// Lambda Function URLs use the same HTTP API v2 event payload as API Gateway,
// so the existing handler works without modification.
const fnUrl = apiHandler.addFunctionUrl({
  authType: lambda.FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: [corsOrigin],
    allowedMethods: [lambda.HttpMethod.GET, lambda.HttpMethod.POST],
    allowedHeaders: ['Content-Type'],
    maxAge: Duration.days(1),
  },
})

// ── Output ───────────────────────────────────────────────────────────────────
// After deploying, copy this URL into VITE_API_URL in the Amplify Console so
// the React app can reach the API.
new CfnOutput(apiStack, 'ApiUrl', {
  value:       fnUrl.url,
  description: 'Texas City Snapshot API URL — set this as VITE_API_URL',
  exportName:  'TexasCityApiUrl',
})
