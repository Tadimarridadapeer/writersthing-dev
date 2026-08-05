import { supabase } from "@/lib/supabase";

export async function signInWithGoogle(redirectTo?: string) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const callbackUrl = `${origin}/auth/callback${redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ""}`;

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: "offline",
          prompt: "select_account"
        }
      }
    });

    if (error) {
      if (error.message?.includes("provider is not enabled") || (error as any).status === 400) {
        throw new Error("Google Sign-In is not enabled in your Supabase project yet. Please enable Google in Supabase Dashboard > Authentication > Providers.");
      }
      throw error;
    }

    return data;
  } catch (err: any) {
    if (err?.message?.includes("provider is not enabled")) {
      throw new Error("Google Sign-In is not enabled in your Supabase project yet. Please enable Google in Supabase Dashboard > Authentication > Providers.");
    }
    throw err;
  }
}
