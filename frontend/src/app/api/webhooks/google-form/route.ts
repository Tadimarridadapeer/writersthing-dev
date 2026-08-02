import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const getAdminSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key);
};

export async function POST(request: Request) {
  try {
    const supabase = getAdminSupabase();
    if (!supabase) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

    const data = await request.json();

    const {
      full_name,
      email,
      country,
      city,
      writer_type,
      experience,
      genres,
      about,
      portfolio_link,
      published_before,
      reason,
      expectations,
      provide_feedback,
      join_community,
      source
    } = data;

    if (!full_name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Get the Founding Writers program ID
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id')
      .eq('name', 'Founding Writers')
      .single();

    if (programError || !program) {
      console.error('Program not found:', programError);
      return NextResponse.json({ error: 'Program not found' }, { status: 500 });
    }

    // 2. Check for duplicate email (optional since DB has unique constraint, but good for custom error message)
    const { data: existingApp, error: existingError } = await supabase
      .from('program_applications')
      .select('id')
      .eq('program_id', program.id)
      .eq('email', email)
      .single();
      
    if (existingApp) {
      return NextResponse.json({ error: 'An application with this email already exists' }, { status: 409 });
    }

    // 3. Insert the application
    const { data: insertedApp, error: insertError } = await supabase
      .from('program_applications')
      .insert({
        program_id: program.id,
        full_name,
        email,
        country,
        city,
        writer_type,
        experience,
        genres: Array.isArray(genres) ? genres : [genres].filter(Boolean),
        about,
        portfolio_link,
        published_before: published_before === true || published_before === 'true' || published_before === 'Yes',
        reason,
        expectations,
        provide_feedback: provide_feedback === true || provide_feedback === 'true' || provide_feedback === 'Yes',
        join_community: join_community === true || join_community === 'true' || join_community === 'Yes',
        source,
        status: 'Pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting application:', insertError);
      return NextResponse.json({ error: 'Failed to submit application', details: insertError }, { status: 500 });
    }

    return NextResponse.json({ success: true, application: insertedApp }, { status: 201 });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
