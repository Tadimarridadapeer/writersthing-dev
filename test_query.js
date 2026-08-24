import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(process.cwd(), 'frontend', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const userId = '040f8437-bed3-400f-9d24-08489958f6f5'; // Dadapeer
  
  let query = supabase
      .from("notifications")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(0, 4);
  query = query.eq("is_archived", false);
  const { data, count, error } = await query;
  
  const actorIds = [...new Set(data.map((n) => n.actor_id).filter(Boolean))];
  const { data: actorsData, error: actorsError } = await supabase
    .from("users")
    .select("id, name, avatar_url")
    .in("id", actorIds);
    
  console.log('Actors error:', actorsError);
  
  // Also fetch unread count efficiently
  const { count: unreadCount, error: unreadError } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false)
    .eq("is_archived", false);
    
  console.log('Unread error:', unreadError);
}
test();
