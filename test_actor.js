import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), 'frontend', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const actorIds = ['1f8fdb86-0430-47b1-81a9-fbf2b6343542']; // Non-existent user
  const { data: actorsData, error } = await supabase
          .from("users")
          .select("id, name, avatar_url")
          .in("id", actorIds);
  console.log('Result:', actorsData, error);
}
test();
