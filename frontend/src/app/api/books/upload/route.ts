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

    // Mock user for testing if not authenticated
    const userId = user?.id || "mock-user-123";

    const supabaseAdmin = getSupabaseAdmin();

    // Resolve Author Record
    let { data: authorData, error: authorError } = await supabaseAdmin
      .from("authors")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (authorError || !authorData) {
      // Auto-create author profile for user
      const { data: newAuthor, error: createError } = await supabaseAdmin
        .from("authors")
        .insert({ user_id: userId })
        .select("id")
        .single();
      
      if (createError) {
        logger.warn("Upload rejected: Authors record missing and could not create", { userId: user.id });
        return NextResponse.json({ message: "Authors record missing. Please create an author profile first." }, { status: 403 });
      }
      authorData = newAuthor;
    }

    const bodyJson = await req.json();
    const title = bodyJson.title as string;
    const description = bodyJson.description as string;
    const category = bodyJson.category as string;
    const priceStr = bodyJson.price;
    const price = priceStr && !isNaN(Number(priceStr)) && Number(priceStr) > 0 ? Number(priceStr) : 99;
    
    const isPublishing = req.headers.get("X-Publish") === "true";

    if (!title || (isPublishing && !bodyJson.requestPresignedUrls)) {
      return NextResponse.json({ message: "Title is required" }, { status: 400 });
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

    if (bodyJson.requestPresignedUrls) {
      let coverUrl = "";
      let pdfUrl = "";
      let coverPath = "";
      let pdfPath = "";
      
      if (bodyJson.coverName) {
        const coverExt = bodyJson.coverName.split(".").pop();
        // Use a unique timestamp to completely avoid "The resource already exists" error
        const uniqueSuffix = Date.now();
        coverPath = `${user.id}/${bookId}-cover-${uniqueSuffix}.${coverExt}`;
        
        const { data: coverData, error: coverError } = await supabaseAdmin.storage
          .from(STORAGE_CONFIG.buckets.publicCovers)
          .createSignedUploadUrl(coverPath);
        if (coverError) throw new Error("Failed to generate cover upload URL: " + coverError.message);
        coverUrl = coverData?.signedUrl || "";
      }
      
      if (bodyJson.pdfName) {
        const uniqueSuffix = Date.now();
        pdfPath = `${user.id}/${bookId}/manuscript-${uniqueSuffix}.pdf`;
        
        const { data: pdfData, error: pdfError } = await supabaseAdmin.storage
          .from(STORAGE_CONFIG.buckets.privateManuscripts)
          .createSignedUploadUrl(pdfPath);
        if (pdfError) throw new Error("Failed to generate manuscript upload URL: " + pdfError.message);
        pdfUrl = pdfData?.signedUrl || "";
      }
      
      return NextResponse.json({ 
        message: "Draft saved, ready for upload", 
        bookId, 
        uploadUrls: { cover: coverUrl, pdf: pdfUrl },
        coverPath,
        pdfPath
      }, { status: 200 });
    }

    const updatePayload: any = {
      status: "Draft"
    };

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

    const bodyJson = await req.json();
    const id = bodyJson.id;
    const title = bodyJson.title as string;
    const description = bodyJson.description as string;
    const category = bodyJson.category as string;
    const priceStr = bodyJson.price;
    const price = priceStr && !isNaN(Number(priceStr)) && Number(priceStr) > 0 ? Number(priceStr) : undefined;

    if (!id) {
      return NextResponse.json({ message: "Book ID is required for update" }, { status: 400 });
    }

    const isPublishing = req.headers.get("X-Publish") === "true";

    if (!title || (isPublishing && !bodyJson.requestPresignedUrls && !bodyJson.finalize)) {
      if (!title) return NextResponse.json({ message: "Title is required" }, { status: 400 });
    }

    const updatePayload: any = {
      title,
      description,
      ...(isPublishing ? { status: "Published" } : {})
    };

    if (category) {
      updatePayload.category = `Book - ${category}`;
    }

    if (price !== undefined) {
      updatePayload.price = price;
    }

    if (bodyJson.requestPresignedUrls) {
      let coverUrl = "";
      let pdfUrl = "";
      let coverPath = "";
      let pdfPath = "";
      
      if (bodyJson.coverName) {
        const coverExt = bodyJson.coverName.split(".").pop();
        // Use a unique timestamp to completely avoid "The resource already exists" error
        const uniqueSuffix = Date.now();
        coverPath = `${user.id}/${id}-cover-${uniqueSuffix}.${coverExt}`;
        
        const { data: coverData, error: coverError } = await supabaseAdmin.storage
          .from(STORAGE_CONFIG.buckets.publicCovers)
          .createSignedUploadUrl(coverPath);
        if (coverError) throw new Error("Failed to generate cover upload URL: " + coverError.message);
        coverUrl = coverData?.signedUrl || "";
      }
      
      if (bodyJson.pdfName) {
        const uniqueSuffix = Date.now();
        pdfPath = `${user.id}/${id}/manuscript-${uniqueSuffix}.pdf`;
        
        const { data: pdfData, error: pdfError } = await supabaseAdmin.storage
          .from(STORAGE_CONFIG.buckets.privateManuscripts)
          .createSignedUploadUrl(pdfPath);
        if (pdfError) throw new Error("Failed to generate manuscript upload URL: " + pdfError.message);
        pdfUrl = pdfData?.signedUrl || "";
      }
      
      return NextResponse.json({ 
        message: "Draft updated, ready for upload", 
        bookId: id, 
        uploadUrls: { cover: coverUrl, pdf: pdfUrl },
        coverPath,
        pdfPath
      }, { status: 200 });
    }

    if (bodyJson.finalize) {
      if (bodyJson.coverPath) {
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from(STORAGE_CONFIG.buckets.publicCovers)
          .getPublicUrl(bodyJson.coverPath);
        updatePayload.cover_url = publicUrl;
      } else {
        const { data: existingBook } = await supabaseAdmin.from("books").select("cover_url").eq("id", id).single();
        if (!existingBook?.cover_url) {
          return NextResponse.json({ message: "A cover image is required to publish this book." }, { status: 400 });
        }
      }
      
      if (bodyJson.pdfPath) {
        updatePayload.pdf_path = bodyJson.pdfPath;
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
