import { Handler } from "aws-lambda";
import { S3 } from "aws-sdk";
import { jwtVerify } from "jose";

const s3 = new S3();

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
  const filename = event.queryStringParameters?.filename ?? crypto.randomUUID();

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

    const { organisation } = payload;

    const bucketName = process.env.BUCKET_NAME;
    const objectKey = `${organisation}/${filename}`;

    const signedUrl = await s3.getSignedUrlPromise("putObject", {
      Bucket: bucketName,
      Key: objectKey,
      Expires: 3600,
    });

    return {
      statusCode: 200,
      body: {
        signedUrl,
      },
    };
  } catch (error) {
    return {
      statusCode: 401,
      body: {
        message: "Unauthorized",
        error,
        // signingKey: process.env.SIGNING_KEY,
        // token,
      },
    };
  }
};
