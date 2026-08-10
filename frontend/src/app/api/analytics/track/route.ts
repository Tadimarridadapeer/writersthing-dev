import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contentType, contentId, referrer, sessionId } = body;

    if (!contentType || !contentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Initialize Supabase client
    const supabase = createServerClient(
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

    // Get user if authenticated
    const { data: { user } } = await supabase.auth.getUser();

    // Extract device and location from headers (Vercel specific headers)
    const headers = request.headers;
    const country = headers.get("x-vercel-ip-country") || "Unknown";
    const userAgent = headers.get("user-agent") || "";
    
    // Simple device detection
    let deviceType = "desktop";
    if (/mobile/i.test(userAgent)) deviceType = "mobile";
    if (/tablet/i.test(userAgent) || /ipad/i.test(userAgent)) deviceType = "tablet";

    // Call the secure RPC function to log the view
    const { error } = await supabase.rpc("log_content_view", {
      p_content_type: contentType,
      p_content_id: contentId,
      p_viewer_id: user?.id || null,
      p_session_id: sessionId || null,
      p_device_type: deviceType,
      p_country: country,
      p_referrer: referrer || null,
    });

    if (error) {
      console.error("Analytics Error:", error);
      return NextResponse.json({ error: "Failed to log event" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Analytics Server Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
