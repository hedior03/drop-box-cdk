import { Handler } from "aws-lambda";

export const handler: Handler = async (event, context) => {
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

  return {
    statusCode: 200,
    body: {
      signingKey: process.env.SIGNING_KEY,
      token,
    },
  };
};
