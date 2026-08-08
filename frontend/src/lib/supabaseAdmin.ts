import { createClient } from "@supabase/supabase-js";

export const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase admin credentials");
    throw new Error("Server configuration error: Missing Supabase Admin Credentials");
  }

  return createClient(supabaseUrl, supabaseServiceKey);
};
