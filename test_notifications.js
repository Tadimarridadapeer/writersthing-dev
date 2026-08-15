const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'frontend/.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runTest() {
  console.log('--- STARTING NOTIFICATION SYSTEM TESTS ---');

  // Find two users for testing
  const { data: users } = await supabase.from('users').select('id, name').limit(2);
  if (!users || users.length < 2) {
    console.error('Need at least 2 users to run tests.');
    return;
  }
  
  const user1 = users[0];
  const user2 = users[1];
  console.log(`User 1: ${user1.name} (${user1.id})`);
  console.log(`User 2: ${user2.name} (${user2.id})`);

  // TEST A: FOLLOW
  console.log('\n--- TEST A: FOLLOW ---');
  // Clean up any existing follow
  await supabase.from('follows').delete().eq('follower_id', user1.id).eq('following_id', user2.id);
  
  // Clean up any existing notifications for this test
  await supabase.from('notifications').delete().eq('user_id', user2.id).eq('actor_id', user1.id).eq('type', 'new_follower');

  // Insert follow
  const { error: followError } = await supabase.from('follows').insert({
    follower_id: user1.id,
    following_id: user2.id
  });
  
  if (followError) console.error('Failed to follow:', followError);
  else console.log(`User 1 followed User 2.`);

  // Check notification
  // Small delay to allow trigger to complete
  await new Promise(r => setTimeout(r, 500));
  
  const { data: followNotifs } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user2.id)
    .eq('actor_id', user1.id)
    .eq('type', 'new_follower');
    
  if (followNotifs && followNotifs.length === 1) {
    console.log('✅ PASS: Follow notification created successfully for User 2.');
    console.log('Notification data:', followNotifs[0]);
  } else {
    console.error('❌ FAIL: Follow notification missing or duplicated.', followNotifs);
  }
  
  // TEST B: SELF-NOTIFICATION PROTECTION
  console.log('\n--- TEST B: SELF-NOTIFICATION PROTECTION ---');
  await supabase.from('follows').delete().eq('follower_id', user1.id).eq('following_id', user1.id);
  await supabase.from('follows').insert({ follower_id: user1.id, following_id: user1.id });
  
  await new Promise(r => setTimeout(r, 500));
  const { data: selfNotifs } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user1.id)
    .eq('actor_id', user1.id)
    .eq('type', 'new_follower');
    
  if (!selfNotifs || selfNotifs.length === 0) {
    console.log('✅ PASS: Self-notification was successfully prevented.');
  } else {
    console.error('❌ FAIL: Self-notification was created!', selfNotifs);
  }

  console.log('\nTests completed.');
}

runTest();
