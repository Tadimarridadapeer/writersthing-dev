import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

function getSupabaseAdmin() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies();
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    // Authenticate user
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Mock user if not authenticated
    const userId = user?.id || "mock-user-123";

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "Story";

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ message: "Invalid file type. Only JPEG, PNG, WebP, GIF, and AVIF are allowed." }, { status: 400 });
    }

    // Validate file size (10 MB max)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ message: "File too large. Maximum size is 10 MB." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const bucket = "covers";
    // Use userId prefix for organized storage
    const imgPath = `${userId}/${Date.now()}-${type.toLowerCase()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload using service role key — bypasses RLS
    const supabaseAdmin = getSupabaseAdmin();
    const { error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(imgPath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Cover upload error:", uploadError);
      return NextResponse.json({ message: "Upload failed: " + uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(imgPath);

    return NextResponse.json({ publicUrl }, { status: 200 });
  } catch (error: any) {
    console.error("Upload cover error:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
