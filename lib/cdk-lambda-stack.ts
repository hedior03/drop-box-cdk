import * as cdk from "aws-cdk-lib";
import { RemovalPolicy } from "aws-cdk-lib";
import { FunctionUrlAuthType, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import path = require("path");

export class CdkLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // move to AWS Secrets Manager and Parameter Store
    const signingKey = "fjf4pw^qek$3*@9p";
    const bucketName = "upload-bucket-9nb3tkv3xgc6";

    const bucket = new Bucket(this, "UploadBucket", {
      bucketName,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const getSignedUrl = new NodejsFunction(this, "getSignedURL", {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../src/get-signed-url.ts"),
      handler: "handler",
      environment: {
        SIGNING_KEY: signingKey,
        BUCKET_NAME: bucketName,
      },
    });

    bucket.grantReadWrite(getSignedUrl);

    const logGroupName = `/aws/lambda/upload-file-9nb3tkv3xgc6/${getSignedUrl.functionName}`;
    const logGroup = new LogGroup(this, "LogGroup", {
      logGroupName,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_MONTH,
    });

    const getSignedUrlEndpoint = getSignedUrl.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ["*"],
      },
    });

    new cdk.CfnOutput(this, "getSignedUrl", {
      value: getSignedUrlEndpoint.url,
    });

    new cdk.CfnOutput(this, "BucketName", {
      value: bucket.bucketName,
    });
  }
}
