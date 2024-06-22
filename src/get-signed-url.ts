import { Handler } from "aws-lambda";

export const handler: Handler = async (event, context) => {
  const method = event.requestContext.http.method;

  return {
    statusCode: 200,
    body: {
      message: process.env.MESSAGE,
      method,
      context,
    },
  };
};
