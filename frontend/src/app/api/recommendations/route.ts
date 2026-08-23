import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { RecommendationService } from "@/lib/recommendationService";

function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          const cookieStore = await cookies();
          return cookieStore.getAll();
        },
        async setAll(cookiesToSet) {
          const cookieStore = await cookies();
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set({ name, value, ...options });
          });
        },
      },
    }
  );
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    
    // Attempt to get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    const recommendationService = new RecommendationService(supabase, user);

    // Bypassing personalized recommendations for now to show all content to all users
    const recommendations = await recommendationService.getFallbackRecommendations(page, limit);

    // Wrap in standard pagination response format
    const hasMore = recommendations.sections.some((s: any) => s.items.length === limit);
    return NextResponse.json({
      data: recommendations,
      hasMore,
      nextPage: hasMore ? page + 1 : null
    }, { status: 200 });
  } catch (error: any) {
    console.error("Recommendations API error:", error);
    return NextResponse.json({ message: error.message || "Failed to fetch recommendations" }, { status: 500 });
  }
}
