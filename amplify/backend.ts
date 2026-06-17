import { App, Stack, Duration, CfnOutput } from "aws-cdk-lib";
import type { StackProps } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
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
      },
    });

    // Allowed origins: Amplify production URL + custom domain + localhost for dev.
    // Set AMPLIFY_APP_URL and CUSTOM_DOMAIN_URL in the Amplify Console environment variables.
    const allowedOrigins = [
      process.env.AMPLIFY_APP_URL ?? "",
      process.env.CUSTOM_DOMAIN_URL ?? "",
      "http://localhost:4200",
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

    new CfnOutput(this, "ApiUrl", {
      value: fnUrl.url,
      description: "Texas City Snapshot API URL — set this as VITE_API_URL",
      exportName: "TexasCityApiUrl",
    });
  }
}

const app = new App();
new TexasCityApiStack(app, "TexasCityApiStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
  },
});
