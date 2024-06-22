import { Handler } from "aws-lambda";
import { jwtVerify } from "jose";

export const handler: Handler = async (event) => {
  const method = event.requestContext.http.method as string;
  if (method === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    };
  }

  if (method !== "GET") {
    return {
      statusCode: 405,
      body: {
        message: "Method Not Allowed",
      },
    };
  }

  const token = event.queryStringParameters?.token;

  if (!token) {
    return {
      statusCode: 400,
      body: {
        message: "Bad Request",
      },
    };
  }

  const encodedSecret = new TextEncoder().encode(process.env.SIGNING_KEY);

  try {
    const { payload } = await jwtVerify(token, encodedSecret, {
      algorithms: ["HS256"],
    });

    const { organisation, author } = payload;

    return {
      statusCode: 200,
      body: {
        payload,
      },
    };
  } catch (error) {
    return {
      statusCode: 401,
      body: {
        message: "Unauthorized",
        // error,
        // signingKey: process.env.SIGNING_KEY,
        // token,
      },
    };
  }
};
