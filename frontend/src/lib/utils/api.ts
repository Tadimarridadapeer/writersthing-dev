import { NextResponse } from "next/server";

export function createApiResponse<T>(success: boolean, message: string, data: T | null = null, status: number = 200) {
  return NextResponse.json(
    {
      success,
      message,
      data: data || {}
    },
    { status }
  );
}

export function createApiError(message: string, status: number = 400) {
  return createApiResponse(false, message, null, status);
}
