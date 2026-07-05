import { supabase } from "./supabase";

export const uploadAvatar = async (file: File, userId: string): Promise<string | null> => {
  try {
    // 1. File Type Validation
    const allowedExtensions = ['png', 'jpg', 'jpeg', 'webp'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      throw new Error("Invalid file type. Only PNG, JPG, JPEG, and WEBP are allowed.");
    }

    // Max File Size Validation has been removed per user request

    // 3. Define path: profiles/{user_id}/avatar.{ext}
    const filePath = `${userId}/avatar.${fileExt}`;
    console.log("Supabase Storage - Uploading profile image to path:", filePath);

    // 4. Upload/Overwrite in Supabase Storage profiles bucket
    const { data, error: uploadError } = await supabase.storage
      .from("profiles")
      .upload(filePath, file, {
        upsert: true,
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error("Supabase Storage - Upload error details:", uploadError);
      throw uploadError;
    }

    console.log("Supabase Storage - Upload success data:", data);

    // 5. Generate Public URL
    const { data: { publicUrl } } = supabase.storage
      .from("profiles")
      .getPublicUrl(filePath);

    console.log("Supabase Storage - Generated Public URL:", publicUrl);

    // 6. Update public.users.avatar_url inside PostgreSQL (Non-blocking)
    const { data: dbData, error: dbError } = await supabase
      .from("users")
      .update({ avatar_url: publicUrl })
      .eq("id", userId)
      .select();

    if (dbError) {
      console.error("Supabase DB - Update avatar_url error (ignored):", dbError.message);
    } else {
      console.log("Supabase DB - Updated avatar_url success:", dbData);
    }

    // Update authors table profile_image (Non-blocking)
    const { error: authorDbError } = await supabase
      .from("authors")
      .update({ profile_image: publicUrl })
      .eq("user_id", userId);

    if (authorDbError) {
      console.error("Supabase DB - Update authors profile_image error (ignored):", authorDbError.message);
    }

    // 7. Update Session User Metadata to trigger instant Navbar/Context updates
    const { error: authError } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl }
    });

    if (authError) {
      console.warn("Supabase Auth - Failed to update metadata:", authError.message);
    }

    return publicUrl;
  } catch (error: any) {
    console.error("uploadAvatar failed:", error);
    throw error;
  }
};
