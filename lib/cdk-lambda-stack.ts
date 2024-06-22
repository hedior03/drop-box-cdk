import * as cdk from "aws-cdk-lib";
import { FunctionUrlAuthType, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import path = require("path");
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getSignedUrl = new NodejsFunction(this, "getSignedURL", {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../src/get-signed-url.ts"),
      handler: "handler",
      environment: {
        SIGNING_KEY: "fjf4pw^qek$3*@9p",
      },
    });

    const getSignedUrlEndpoint = getSignedUrl.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ["*"],
      },
    });

    new cdk.CfnOutput(this, "getSignedUrlEndpoint", {
      value: getSignedUrlEndpoint.url,
    });
  }
}
