import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), 'frontend', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('notifications').select('*').limit(1);
  console.log('Test select:', error);
  
  const { data: policies, error: pError } = await supabase.rpc('get_policies_for_table', { table_name: 'notifications' });
  console.log('Policies RPC:', pError || policies);
}
test();
