import { Handler } from "aws-lambda";
import { SignJWT } from "jose";

export const handler: Handler = async (event) => {
  const method = event.requestContext.http.method as string;
  if (method === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    };
  }

  if (method !== "POST") {
    return {
      statusCode: 405,
      body: {
        message: "Method Not Allowed",
      },
    };
  }

  try {
    const body = JSON.parse(event.body);

    const { payload, lifespan } = body;
    const encodedSecret = new TextEncoder().encode(process.env.SIGNING_KEY);

    const token = await new SignJWT(payload!)
      .setIssuedAt(Date.now())
      .setExpirationTime(lifespan ?? "1day")
      .setProtectedHeader({ alg: "HS256" })
      .sign(encodedSecret);

    return {
      statusCode: 200,
      body: {
        token,
      },
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: {
        message: "Internal Server Error",
      },
    };
  }
};
