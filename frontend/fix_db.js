const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// We need a postgres connection string. Supabase URL is https://xxx.supabase.co
// We can construct the postgres URL: postgres://postgres.[project-ref]:[db-password]@aws-0-region.pooler.supabase.com:6543/postgres
// But we don't have the DB password directly, only the service role key!
