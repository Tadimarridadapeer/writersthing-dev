const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for backend

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials missing in backend .env");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
