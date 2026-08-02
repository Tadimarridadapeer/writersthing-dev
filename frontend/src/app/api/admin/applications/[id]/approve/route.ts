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
    // In a real app, verify admin session here. Since we don't have session cookie parsing set up 
    // consistently across all API routes in this mock, we'll assume the request is authorized 
    // or handle it if passed a token.
    
    const supabase = getAdminSupabase();
    if (!supabase) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });

    const resolvedParams = await params;
    const appId = resolvedParams.id;

    // 1. Get Application
    const { data: application, error: appError } = await supabase
      .from('program_applications')
      .select('*, programs(*)')
      .eq('id', appId)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.status === 'Approved') {
      return NextResponse.json({ error: 'Application already approved' }, { status: 400 });
    }

    const program = application.programs;

    // 2. Check Capacity
    if (program.max_capacity && program.current_count >= program.max_capacity) {
      return NextResponse.json({ error: 'Founding Writers Program Closed (100/100)' }, { status: 403 });
    }

    const newFounderNumber = program.current_count + 1;

    // 3. Create User Account in Auth (if not exists)
    // Supabase admin API allows creating users.
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: application.email,
      email_confirm: true,
      user_metadata: { full_name: application.full_name },
      // Optional: Generate a random password if you aren't sending an invite email
      password: Math.random().toString(36).slice(-8) + 'A1!' 
    });

    // It's possible the user already exists. We should handle that.
    let userId = authUser?.user?.id;
    if (authError && authError.message.includes('already registered')) {
       // Try to fetch the user from public.users
       const { data: existingUser } = await supabase.from('users').select('id').eq('email', application.email).single();
       if (existingUser) {
           userId = existingUser.id;
       } else {
           return NextResponse.json({ error: 'User exists in Auth but not in public.users' }, { status: 500 });
       }
    } else if (authError) {
       console.error("Auth Error:", authError);
       return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
    }

    // 4. Create public profile if it was just created
    if (authUser?.user) {
        await supabase.from('users').upsert({
            id: userId,
            name: application.full_name,
            email: application.email,
            role: 'Author'
        });
        await supabase.from('authors').upsert({
            user_id: userId
        });
        
        // Supabase typically sends a reset password/welcome email here if configured.
    }

    // 5. Assign Badge
    const { error: badgeError } = await supabase.from('user_badges').insert({
        user_id: userId,
        badge_type: 'founding_writer',
        badge_number: newFounderNumber
    });

    if (badgeError) {
        console.error("Badge Error:", badgeError);
        return NextResponse.json({ error: 'Failed to assign badge' }, { status: 500 });
    }

    // 6. Update Program Count & App Status
    await supabase.from('programs').update({ current_count: newFounderNumber }).eq('id', program.id);
    await supabase.from('program_applications').update({ status: 'Approved' }).eq('id', appId);

    return NextResponse.json({ success: true, founderNumber: newFounderNumber }, { status: 200 });
  } catch (error: any) {
    console.error('Approve error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
