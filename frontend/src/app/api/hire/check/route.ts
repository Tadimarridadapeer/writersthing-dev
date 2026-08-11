import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const writerId = searchParams.get('writer_id');
    if (!writerId) return NextResponse.json({ eligible: false }, { status: 400 });

    const supabase = getSupabase();

    // Check users table for flags
    const { data: user } = await supabase
      .from('users')
      .select('is_verified_writer, available_for_hire')
      .eq('id', writerId)
      .single();

    // Check founding writers
    const { data: founding } = await supabase
      .from('founding_writers')
      .select('id')
      .eq('user_id', writerId)
      .eq('status', 'Accepted')
      .maybeSingle();

    const isEligible = !!((user?.is_verified_writer) || (user?.available_for_hire) || founding);

    return NextResponse.json({ eligible: isEligible }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, eligible: false }, { status: 500 });
  }
}
