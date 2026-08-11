require("dotenv").config({ path: "frontend/.env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase.rpc('get_policies', { table_name: 'stories' });
  if (error) {
    console.error("RPC failed, trying raw query...", error.message);
    const { data: raw, error: rawErr } = await supabase.from('stories').select('id').limit(1);
    console.log("Raw query success:", !rawErr);
  } else {
    console.log(data);
  }
}
run();
