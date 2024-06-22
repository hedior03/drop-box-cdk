import * as cdk from "aws-cdk-lib";
import { RemovalPolicy } from "aws-cdk-lib";
import { FunctionUrlAuthType, Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import path = require("path");
import { SecretsManager } from "aws-sdk";

export class CdkLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const signingKey = Secret.fromSecretNameV2(
      this,
      "SigningKey",
      "JwtSigningKey"
    ).secretValue.unsafeUnwrap();

    const corsRule: cdk.aws_s3.CorsRule = {
      allowedOrigins: ["*"],
      allowedMethods: [
        cdk.aws_s3.HttpMethods.HEAD,
        cdk.aws_s3.HttpMethods.GET,
        cdk.aws_s3.HttpMethods.PUT,
      ],
      allowedHeaders: ["*"],
    };

    const bucket = new cdk.aws_s3.Bucket(this, "UploadBucket", {
      versioned: true,
      bucketName: "upload-bucket-9nb3tkv3xgc6",
      removalPolicy: RemovalPolicy.DESTROY,
      cors: [corsRule],
    });

    const getSignedUrl = new NodejsFunction(this, "getSignedURL", {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../src/get-signed-url.ts"),
      handler: "handler",
      environment: {
        SIGNING_KEY: signingKey,
        BUCKET_NAME: bucket.bucketName,
      },
    });

    bucket.grantReadWrite(getSignedUrl);
    bucket.grantPut(getSignedUrl);

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
