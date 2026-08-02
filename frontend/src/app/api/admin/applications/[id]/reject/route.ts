import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getAdminSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key);
};

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = getAdminSupabase();
    if (!supabase) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    const resolvedParams = await params;
    const appId = resolvedParams.id;

    const { error: updateError } = await supabase
      .from('program_applications')
      .update({ status: 'Rejected' })
      .eq('id', appId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to reject application' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Reject error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
