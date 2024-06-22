import * as cdk from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import path = require("path");
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'CdkLambdaQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    const getSignedUrl = new NodejsFunction(this, "getSignedURL", {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../src/get-signed-url.ts"),
      handler: "handler",
      environment: {
        MESSAGE: "Hello World!"
      }
    });
  }
}
