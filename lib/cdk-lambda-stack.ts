import * as cdk from "aws-cdk-lib";
import { RemovalPolicy } from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import path = require("path");

export class CdkLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const jwtSecret = new cdk.aws_secretsmanager.Secret(this, "JwtSecret", {
      secretName: "SigningKey",
      generateSecretString: {
        secretStringTemplate: "{}",
        generateStringKey: "secretValue",
        excludePunctuation: true,
        includeSpace: false,
        passwordLength: 64,
      },
    });

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
      bucketName: "upload-bucket-uvkmg2cmx99vd6nu",
      removalPolicy: RemovalPolicy.DESTROY,
      cors: [corsRule],
    });

    const getSignedUrl = new NodejsFunction(this, "getSignedURL", {
      runtime: Runtime.NODEJS_20_X,
      entry: path.join(__dirname, "../src/get-signed-url.ts"),
      handler: "handler",
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    bucket.grantReadWrite(getSignedUrl);
    bucket.grantPut(getSignedUrl);

    const createSignedLink = new NodejsFunction(
      this,
      "createSignedBucketLink",
      {
        runtime: Runtime.NODEJS_20_X,
        entry: path.join(__dirname, "../src/create-signed-link.ts"),
        handler: "handler",
        environment: {},
      }
    );

    jwtSecret.grantRead(createSignedLink);
    jwtSecret.grantRead(getSignedUrl);

    const api = new cdk.aws_apigateway.RestApi(this, "UploadApi", {
      restApiName: "UploadApi",
      description: "This service allows you to upload files",
      defaultCorsPreflightOptions: {
        allowOrigins: cdk.aws_apigateway.Cors.ALL_ORIGINS,
        allowMethods: cdk.aws_apigateway.Cors.ALL_METHODS,
        allowHeaders: ["*"],
        allowCredentials: true,
      },
    });

    api.root
      .addResource("get-signed-url")
      .addMethod("GET", new cdk.aws_apigateway.LambdaIntegration(getSignedUrl));

    api.root
      .addResource("create-signed-link")
      .addMethod(
        "POST",
        new cdk.aws_apigateway.LambdaIntegration(createSignedLink),
        {
          methodResponses: [
            {
              statusCode: "200",
              responseParameters: {
                "method.response.header.Access-Control-Allow-Origin": true,
              },
            },
          ],
        }
      );

    const logGroupName = `/aws/lambda/upload-file-uvkmg2cmx99vd6nu`;
    const logGroup = new LogGroup(this, "LogGroup", {
      logGroupName,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_MONTH,
    });

    new cdk.CfnOutput(this, "BucketName", {
      value: bucket.bucketName,
    });
  }
}
