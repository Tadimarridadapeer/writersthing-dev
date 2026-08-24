import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), 'frontend', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: user, error: userError } = await supabase.from('users').select('id, email, name').eq('email', 'dadapeer.personal@gmail.com').single();
  console.log('User:', user, userError);
  
  if (user) {
    const { data: notifs, error: notifError } = await supabase.from('notifications').select('*').eq('user_id', user.id).eq('type', 'system_message');
    console.log('Notifs:', notifs, notifError);
  }
}
test();
