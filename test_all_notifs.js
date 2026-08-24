import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), 'frontend', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: users, error: userError } = await supabase.from('users').select('id, email, name, avatar_url').in('email', ['dadapeer.personal@gmail.com', 'tadimarridadapeer225@gmail.com']);
  console.log('Users:', users);
}
test();
