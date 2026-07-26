import { NextResponse } from "next/server";
import { logger } from "./logger";
import { v4 as uuidv4 } from "uuid";

type ApiHandler = (req: Request, ...args: any[]) => Promise<Response>;

export function withObservability(handler: ApiHandler, routeName: string): ApiHandler {
  return async (req: Request, ...args: any[]) => {
    const requestId = req.headers.get("x-request-id") || uuidv4();
    const startTime = performance.now();
    const method = req.method;
    const url = new URL(req.url).pathname;

    logger.info(`[API] Started ${method} ${url}`, { requestId, routeName });

    try {
      // Execute the actual handler
      const response = await handler(req, ...args);
      
      const endTime = performance.now();
      const executionTime = (endTime - startTime).toFixed(2);

      // Performance logging
      logger.performance(`[API] Completed ${method} ${url}`, {
        requestId,
        routeName,
        status: response.status,
        executionTimeMs: executionTime,
      });

      // Clone response to inject request ID header if possible
      const newHeaders = new Headers(response.headers);
      newHeaders.set("x-request-id", requestId);
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
      });

    } catch (error: any) {
      const endTime = performance.now();
      const executionTime = (endTime - startTime).toFixed(2);

      logger.error(`[API] Unhandled Exception in ${method} ${url}`, {
        requestId,
        routeName,
        executionTimeMs: executionTime,
        error: error,
      });

      return NextResponse.json(
        { 
          message: "Internal Server Error", 
          requestId // Return Request ID for easier support tracking
        }, 
        { status: 500 }
      );
    }
  };
}
