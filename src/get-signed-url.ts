import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { S3, SecretsManager } from "aws-sdk";
import { jwtVerify } from "jose";

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
) => {
  try {
    const secret = await new SecretsManager()
      .getSecretValue({
        SecretId: "SigningKey",
      })
      .promise();
    const signingKey = JSON.parse(secret.SecretString ?? "{}").secretValue;

    const filename =
      event.queryStringParameters?.filename ?? crypto.randomUUID();

    const token = event.queryStringParameters?.token;

    if (!token) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Bad Request",
        }),
      };
    }

    const encodedSecret = new TextEncoder().encode(signingKey);

    const { payload } = await jwtVerify(token, encodedSecret, {
      algorithms: ["HS256"],
    });

    const { organisation } = payload;

    const bucketName = process.env.BUCKET_NAME;
    const objectKey = `${organisation}/${filename}`;

    const signedUrl = await new S3().getSignedUrlPromise("putObject", {
      Bucket: bucketName,
      Key: objectKey,
      Expires: 3600,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        signedUrl,
        signingKey: process.env.SIGNING_KEY,
      }),
    };
  } catch (error) {
    console.error("error", error);
    return {
      statusCode: 401,
      body: JSON.stringify({
        message: "Unauthorized",
      }),
    };
  }
};
