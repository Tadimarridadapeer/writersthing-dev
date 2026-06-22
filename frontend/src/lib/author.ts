import { SupabaseClient } from "@supabase/supabase-js";

// Cache to prevent duplicate simultaneous creation attempts
const ensurePromises = new Map<string, Promise<any>>();

/**
 * Ensures that an author profile exists for the given user ID.
 * If the profile does not exist, it creates one automatically.
 *
 * @param supabase The Supabase client instance (can be client-side or server-side)
 * @param userId The UUID of the authenticated user
 * @returns The author profile record
 */
export async function ensureAuthorProfile(supabase: SupabaseClient, userId: string) {
  if (!userId) throw new Error("User ID is required to ensure author profile");

  if (ensurePromises.has(userId)) {
    console.log(`[ensureAuthorProfile] Wait on existing promise for user_id: ${userId}`);
    return ensurePromises.get(userId);
  }

  const promise = (async () => {
    console.log(`[ensureAuthorProfile] Current user id: ${userId}`);

    // 1. Check if the author profile already exists
    const { data: existingAuthor, error: fetchError } = await supabase
      .from("authors")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    console.log(`[ensureAuthorProfile] Existing author query result:`, existingAuthor);

    if (fetchError) {
      console.error(`[ensureAuthorProfile] Error fetching author profile:`, fetchError.message);
    }

    if (existingAuthor) {
      console.log(`[ensureAuthorProfile] Author exists. Skipping insert.`);
      return existingAuthor;
    }

    // 2. Profile missing, create it automatically
    console.log(`[ensureAuthorProfile] Insert attempt for user ${userId}...`);
    
    const { data: newAuthor, error: insertError } = await supabase
      .from("authors")
      .insert([{ user_id: userId }])
      .select()
      .single();

    if (insertError) {
      console.error(`[ensureAuthorProfile] Insert error:`, insertError);
      
      // If we hit a unique constraint violation (code 23505) or RLS error (code 42501), 
      // check if it exists again (could be created concurrently or RLS preventing select but failing insert).
      if (insertError.code === "23505" || insertError.code === "42501" || insertError.message.includes("row-level security")) {
        console.log(`[ensureAuthorProfile] Checking if author actually exists after error...`);
        const { data: retryAuthor, error: retryError } = await supabase
          .from("authors")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
          
        if (!retryError && retryAuthor) {
          console.log(`[ensureAuthorProfile] Author was found on retry. Skipping error.`);
          return retryAuthor;
        }
      }
      
      throw new Error(`Failed to create author profile: ${insertError.message}`);
    }

    console.log(`[ensureAuthorProfile] Author created successfully.`);
    return newAuthor;
  })();

  ensurePromises.set(userId, promise);
  
  try {
    const result = await promise;
    return result;
  } catch (error) {
    ensurePromises.delete(userId);
    throw error;
  }
}
