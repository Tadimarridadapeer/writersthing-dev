import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { STORAGE_CONFIG } from "@/config/storage";
import { logger } from "@/lib/logger";
import { withObservability } from "@/lib/api-logger";

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

export const POST = withObservability(async (req: Request) => {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      logger.security("Upload rejected: Authentication required");
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Resolve Author Record
    let { data: authorData, error: authorError } = await supabaseAdmin
      .from("authors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (authorError || !authorData) {
      // Auto-create author profile for user
      const { data: newAuthor, error: createError } = await supabaseAdmin
        .from("authors")
        .insert({ user_id: user.id })
        .select("id")
        .single();
      
      if (createError) {
        logger.warn("Upload rejected: Authors record missing and could not create", { userId: user.id });
        return NextResponse.json({ message: "Authors record missing. Please create an author profile first." }, { status: 403 });
      }
      authorData = newAuthor;
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const priceStr = formData.get("price") as string;
    const price = priceStr && !isNaN(Number(priceStr)) && Number(priceStr) > 0 ? Number(priceStr) : 99;
    const coverFile = formData.get("coverFile") as File | null;
    const pdfFile = formData.get("pdfFile") as File | null;

    const isPublishing = req.headers.get("X-Publish") === "true";

    if (!title || (isPublishing && !pdfFile)) {
      return NextResponse.json({ message: "Title and PDF Manuscript are required to publish" }, { status: 400 });
    }

    const finalCategory = category ? `Book - ${category}` : "Book";
    
    // Create Draft Book First to get ID
    const { data: bookData, error: bookInsertError } = await supabaseAdmin
      .from("books")
      .insert({
        title,
        description,
        category: finalCategory,
        author_id: authorData.id,
        price: price,
        status: "Draft",
      })
      .select("id")
      .single();

    if (bookInsertError || !bookData) {
      logger.error("Failed to create book record", { error: bookInsertError?.message, authorId: authorData.id });
      return NextResponse.json({ message: "Failed to create book record: " + (bookInsertError?.message || "Unknown error") }, { status: 500 });
    }

    const bookId = bookData.id;

    // Upload Cover
    let coverUrl = "";
    if (coverFile) {
      const coverExt = coverFile.name.split(".").pop();
      const coverPath = `${user.id}/${bookId}-cover.${coverExt}`;
      const { error: coverUploadError } = await supabaseAdmin.storage
        .from(STORAGE_CONFIG.buckets.publicCovers)
        .upload(coverPath, coverFile, { upsert: true });
        
      if (coverUploadError) {
        logger.error("Cover Upload Failed", { error: coverUploadError.message, bookId });
        return NextResponse.json({ message: "Cover Upload Failed" }, { status: 500 });
      }

      const { data: { publicUrl } } = supabaseAdmin.storage
        .from(STORAGE_CONFIG.buckets.publicCovers)
        .getPublicUrl(coverPath);
      coverUrl = publicUrl;
    }

    // Upload PDF securely using backend mapping
    let pdfPath = "";
    if (pdfFile) {
      pdfPath = `${user.id}/${bookId}/manuscript.pdf`;
      const { error: pdfUploadError } = await supabaseAdmin.storage
        .from(STORAGE_CONFIG.buckets.privateManuscripts)
        .upload(pdfPath, pdfFile, { upsert: true });

      if (pdfUploadError) {
        logger.error("Manuscript Upload Failed", { error: pdfUploadError.message, bookId });
        return NextResponse.json({ message: "Manuscript Upload Failed: " + pdfUploadError.message }, { status: 500 });
      }
    }

    // Update Book with Storage Metadata and publish
    const updatePayload: any = {
      cover_url: coverUrl,
      status: isPublishing ? "Published" : "Draft"
    };

    if (pdfFile && pdfPath) {
      updatePayload.pdf_path = pdfPath; // Legacy support
      updatePayload.storage_bucket = STORAGE_CONFIG.buckets.privateManuscripts;
      updatePayload.storage_path = pdfPath;
      updatePayload.file_size = pdfFile.size;
      updatePayload.mime_type = pdfFile.type;
      updatePayload.original_file_name = pdfFile.name;
      updatePayload.uploaded_at = new Date().toISOString();
    }

    const { error: updateError } = await supabaseAdmin
      .from("books")
      .update(updatePayload)
      .eq("id", bookId);

    if (updateError) {
      logger.error("Failed to finalize publication", { error: updateError.message, bookId });
      return NextResponse.json({ message: "Failed to finalize publication" }, { status: 500 });
    }

    return NextResponse.json({ message: "Book published successfully", bookId }, { status: 200 });
  } catch (error: any) {
    logger.error("Secure Upload API Error", { error: error.message });
    throw error;
  }
}, "/api/books/upload");

export const PUT = withObservability(async (req: Request) => {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    let { data: authorData, error: authorError } = await supabaseAdmin
      .from("authors")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (authorError || !authorData) {
      // Auto-create author profile for user
      const { data: newAuthor, error: createError } = await supabaseAdmin
        .from("authors")
        .insert({ user_id: user.id })
        .select("id")
        .single();
      
      if (createError) {
        return NextResponse.json({ message: "Authors record missing" }, { status: 403 });
      }
      authorData = newAuthor;
    }

    const formData = await req.formData();
    const id = formData.get("id") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const category = formData.get("category") as string;
    const priceStr = formData.get("price") as string;
    const price = priceStr && !isNaN(Number(priceStr)) && Number(priceStr) > 0 ? Number(priceStr) : undefined;
    const coverFile = formData.get("coverFile") as File | null;
    const pdfFile = formData.get("pdfFile") as File | null;

    if (!id) {
      return NextResponse.json({ message: "Book ID is required for update" }, { status: 400 });
    }

    const isPublishing = req.headers.get("X-Publish") === "true";

    if (!title || (isPublishing && !pdfFile)) {
      // For updates, the PDF might already exist. We should really check the DB if it exists.
      // But for now, just enforce title.
      if (!title) return NextResponse.json({ message: "Title is required" }, { status: 400 });
    }

    const updatePayload: any = {
      title,
      description,
      status: isPublishing ? "Published" : "Draft"
    };

    if (category) {
      updatePayload.category = `Book - ${category}`;
    }

    if (price !== undefined) {
      updatePayload.price = price;
    }

    // Upload Cover if provided
    if (coverFile) {
      const coverExt = coverFile.name.split(".").pop();
      const coverPath = `${user.id}/${id}-cover.${coverExt}`;
      const { error: coverUploadError } = await supabaseAdmin.storage
        .from(STORAGE_CONFIG.buckets.publicCovers)
        .upload(coverPath, coverFile, { upsert: true });
        
      if (!coverUploadError) {
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from(STORAGE_CONFIG.buckets.publicCovers)
          .getPublicUrl(coverPath);
        updatePayload.cover_url = publicUrl;
      }
    }

    // Upload PDF if provided
    if (pdfFile) {
      const pdfPath = `${user.id}/${id}/manuscript.pdf`;
      const { error: pdfUploadError } = await supabaseAdmin.storage
        .from(STORAGE_CONFIG.buckets.privateManuscripts)
        .upload(pdfPath, pdfFile, { upsert: true });

      if (pdfUploadError) {
        console.error("DEBUG pdfUploadError:", pdfUploadError);
        throw new Error("Failed to upload manuscript: " + pdfUploadError.message);
      } else {
        updatePayload.pdf_path = pdfPath;
        updatePayload.storage_bucket = STORAGE_CONFIG.buckets.privateManuscripts;
        updatePayload.storage_path = pdfPath;
        updatePayload.file_size = pdfFile.size;
        updatePayload.mime_type = pdfFile.type;
        updatePayload.original_file_name = pdfFile.name;
        updatePayload.uploaded_at = new Date().toISOString();
      }
    }

    const { error: updateError } = await supabaseAdmin
      .from("books")
      .update(updatePayload)
      .eq("id", id)
      .eq("author_id", authorData.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ message: "Book updated successfully", bookId: id }, { status: 200 });
  } catch (error: any) {
    logger.error("Book PUT API Error", { error: error.message });
    throw error;
  }
}, "/api/books/upload");
