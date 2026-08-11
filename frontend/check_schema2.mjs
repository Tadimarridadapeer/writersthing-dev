import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const tables = ['user_followers', 'follows', 'subscriptions', 'transactions', 'orders', 'purchases'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table '${table}' error:`, error.message);
    } else {
      console.log(`Table '${table}' exists. Rows: ${data?.length}`);
      if (data?.length > 0) {
        console.log(`Sample columns for '${table}':`, Object.keys(data[0]).join(', '));
      }
    }
  }
}
test();
