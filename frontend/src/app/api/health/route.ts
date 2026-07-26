import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export async function GET() {
  const startTime = performance.now();
  const supabase = getSupabase();
  let dbStatus = "unknown";
  let storageStatus = "unknown";

  try {
    // Check Database Connectivity
    const { data: dbData, error: dbError } = await supabase.from('authors').select('id').limit(1);
    if (dbError) throw dbError;
    dbStatus = "connected";
  } catch (err) {
    dbStatus = "disconnected";
    logger.error("[Health] Database Connectivity Failed", { error: err });
  }

  try {
    // Check Storage Connectivity
    const { data: storageData, error: storageError } = await supabase.storage.listBuckets();
    if (storageError) throw storageError;
    storageStatus = "connected";
  } catch (err) {
    storageStatus = "disconnected";
    logger.error("[Health] Storage Connectivity Failed", { error: err });
  }

  const endTime = performance.now();
  const executionTimeMs = (endTime - startTime).toFixed(2);
  
  const status = (dbStatus === "connected" && storageStatus === "connected") ? "healthy" : "degraded";

  const response = {
    status,
    version: process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    database: dbStatus,
    storage: storageStatus,
    executionTimeMs
  };

  if (status === "healthy") {
    logger.performance("[Health] Check Passed", response);
    return NextResponse.json(response, { status: 200 });
  } else {
    logger.warn("[Health] Check Degraded", response);
    return NextResponse.json(response, { status: 503 });
  }
}
