import { App, Stack, Duration, CfnOutput } from "aws-cdk-lib";
import type { StackProps } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import { Construct } from "constructs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

class TexasCityApiStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const apiHandler = new lambda.Function(this, "TexasCityApiHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: "handler.handler",
      code: lambda.Code.fromAsset(join(__dirname, "../lambda/dist")),
      timeout: Duration.seconds(29),
      memorySize: 512,
      environment: {
        MONGODB_URI: process.env.MONGODB_URI ?? "",
        MONGODB_DB: process.env.MONGODB_DB ?? "texas",
        GRIDSTATUS_API_KEY: process.env.GRIDSTATUS_API_KEY ?? "",
      },
    });

    // Allowed origins: Amplify production URL + custom domain + dev custom domain + localhost for dev.
    // Set AMPLIFY_APP_URL, CUSTOM_DOMAIN_URL, and DEV_CUSTOM_DOMAIN_URL in the Amplify Console environment variables.
    const allowedOrigins = [
      process.env.AMPLIFY_APP_URL ?? "",
      process.env.CUSTOM_DOMAIN_URL ?? "",
      process.env.DEV_CUSTOM_DOMAIN_URL ?? "",
    ].filter(Boolean);

    // CORS is owned entirely here — the Lambda itself sets no Access-Control-* headers.
    const fnUrl = apiHandler.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins,
        allowedMethods: [lambda.HttpMethod.GET, lambda.HttpMethod.POST],
        allowedHeaders: ["Content-Type"],
        maxAge: Duration.days(1),
      },
    });

    new events.Rule(this, "DailyRefreshRule", {
      schedule: events.Schedule.rate(Duration.days(1)),
      targets: [new targets.LambdaFunction(apiHandler)],
    });

    new events.Rule(this, "HourlyLoadForecastRule", {
      schedule: events.Schedule.rate(Duration.hours(1)),
      targets: [
        new targets.LambdaFunction(apiHandler, {
          event: events.RuleTargetInput.fromObject({
            source: "aws.events",
            "detail-type": "load-forecast-refresh",
          }),
        }),
      ],
    });

    new CfnOutput(this, "ApiUrl", {
      value: fnUrl.url,
      description: "Texas City Snapshot API URL — set this as VITE_API_URL",
      exportName: `TexasCityApiUrl-${branch}`,
    });
  }
}

const branch = process.env.AWS_BRANCH ?? process.env.AMPLIFY_BRANCH ?? "main";
const stackName =
  branch === "main" ? "TexasCityApiStack" : `TexasCityApiStack-${branch}`;

const app = new App();
new TexasCityApiStack(app, stackName, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "us-east-2",
  },
});
