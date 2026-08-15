import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ensureAuthorProfile } from "@/lib/author";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/marketplace";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const user = data.user;
      const email = user.email || "";
      const name = user.user_metadata?.name || user.user_metadata?.full_name || email.split("@")[0] || "User";
      const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

      // 1. Ensure user record exists in public.users
      try {
        const { data: existingUser } = await supabase
          .from("users")
          .select("id, name, email")
          .eq("id", user.id)
          .maybeSingle();

        if (!existingUser) {
          await supabase.from("users").insert([
            {
              id: user.id,
              name,
              email,
              avatar_url: avatarUrl,
              created_at: new Date().toISOString()
            }
          ]);
          
          // Send welcome email for new Google signups
          try {
            const res = await sendWelcomeEmail(email, name);
            if (!res.success) console.error("Failed to send OAuth welcome email:", res.error);
          } catch (emailErr) {
            console.error("Welcome email exception:", emailErr);
          }
        }

        // 2. Ensure Author profile exists
        await ensureAuthorProfile(supabase, user.id);
      } catch (syncErr) {
        console.error("Auth callback sync error:", syncErr);
      }

      // Return redirect response
      const response = NextResponse.redirect(new URL(next, requestUrl.origin));
      
      // Inject fallback user JSON into cookie for client hydration
      response.cookies.set("writersthing_user", JSON.stringify({
        id: user.id,
        email,
        name,
        avatar_url: avatarUrl,
        role: user.user_metadata?.role || "Author"
      }), { path: "/", maxAge: 60 * 60 * 24 * 30 });

      return response;
    }
  }

  // Fallback to login if callback failed
  return NextResponse.redirect(new URL("/login?error=Google authentication failed", requestUrl.origin));
}
