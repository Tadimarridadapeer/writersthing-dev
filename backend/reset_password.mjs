import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function resetPassword() {
  try {
    const email = 'dadapeer.personal@gmail.com';
    const newPassword = 'NewPassword123!';
    
    console.log(`Searching for user with email: ${email}...`);
    
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error fetching users:', listError);
      return;
    }
    
    const user = users.find(u => u.email === email);
    
    if (!user) {
      console.error(`User with email ${email} not found.`);
      return;
    }
    
    console.log(`User found! ID: ${user.id}. Updating password...`);
    
    const { data, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword
    });
    
    if (updateError) {
      console.error('Error updating password:', updateError);
    } else {
      console.log('Password updated successfully!');
      console.log(`New password is: ${newPassword}`);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

resetPassword();
