import { APIGatewayProxyEvent, APIGatewayProxyHandler } from "aws-lambda";
import { SecretsManager } from "aws-sdk";
import { SignJWT } from "jose";

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
) => {
  const secret = await new SecretsManager()
    .getSecretValue({
      SecretId: "SigningKey",
    })
    .promise();
  const signingKey = JSON.parse(secret.SecretString ?? "{}").secretValue;

  try {
    const body = JSON.parse(event.body ?? "{}");

    const { payload, lifespan } = body;
    const encodedSecret = new TextEncoder().encode(signingKey);

    const token = await new SignJWT(payload!)
      .setIssuedAt(Date.now())
      .setExpirationTime(lifespan ?? "1day")
      .setProtectedHeader({ alg: "HS256" })
      .sign(encodedSecret);

    return {
      statusCode: 200,
      body: JSON.stringify({
        token,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal Server Error",
      }),
    };
  }
};
