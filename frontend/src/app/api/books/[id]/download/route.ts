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

async function logDownload(
  supabaseAdmin: any,
  userId: string,
  bookId: string,
  result: "SUCCESS" | "FORBIDDEN" | "NOT_FOUND" | "ERROR",
  ipAddress?: string
) {
  try {
    await supabaseAdmin.from("download_logs").insert({
      user_id: userId,
      book_id: bookId,
      result,
      ip_address: ipAddress || "unknown"
    });
  } catch (e: any) {
    logger.error("Failed to log download attempt", { error: e.message });
  }
}

export const GET = withObservability(async (
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  
  try {
    const { id: bookId } = await params;
    const supabase = getSupabase();
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Authenticate User
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    // 2. Fetch Book details
    const { data: book, error: bookError } = await supabaseAdmin
      .from("books")
      .select("id, author_id, price, status, storage_path, pdf_path")
      .eq("id", bookId)
      .single();

    if (bookError || !book) {
      logger.warn("Download rejected: Book not found", { bookId });
      await logDownload(supabaseAdmin, user.id, bookId, "NOT_FOUND", ip);
      return NextResponse.json({ message: "Book not found" }, { status: 404 });
    }

    if (book.status !== "Published") {
      // Allow author to read draft, but block others
      if (book.author_id !== user.id) {
        logger.security("Download rejected: Book is not published", { userId: user.id, bookId });
        await logDownload(supabaseAdmin, user.id, bookId, "FORBIDDEN", ip);
        return NextResponse.json({ message: "Book is not published" }, { status: 403 });
      }
    }

    // 3. Authorization Check
    let isAuthorized = false;

    // A. Is it Free?
    if (book.price === 0) {
      isAuthorized = true;
    } 
    // B. Is the user the author?
    else if (book.author_id === user.id) {
      isAuthorized = true;
    } 
    // C. Has the user purchased it? (Check Library)
    else {
      const { data: access } = await supabaseAdmin
        .from("library")
        .select("id")
        .eq("user_id", user.id)
        .eq("book_id", bookId)
        .single();
        
      if (access) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      logger.security("Download rejected: Access denied", { userId: user.id, bookId });
      await logDownload(supabaseAdmin, user.id, bookId, "FORBIDDEN", ip);
      return NextResponse.json({ message: "Access denied. Please purchase the book." }, { status: 403 });
    }

    // 4. Resolve the Path (Checking new storage_path first, fallback to legacy pdf_path)
    const filePath = book.storage_path || book.pdf_path;

    if (!filePath) {
      await logDownload(supabaseAdmin, user.id, bookId, "NOT_FOUND", ip);
      return NextResponse.json({ message: "PDF manuscript not found for this book." }, { status: 404 });
    }

    // 5. Verify the file exists in storage
    // Bypassing existence check if we want to save an API call, but let's do it for strict correctness
    // Or we can just generate signed url and let the client handle 404 from supabase.
    
    // 6. Generate Signed URL
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from(STORAGE_CONFIG.buckets.privateManuscripts)
      .createSignedUrl(filePath, STORAGE_CONFIG.security.signedUrlExpirySeconds);

    if (signError || !signedData?.signedUrl) {
      logger.error("Failed to generate secure access link", { error: signError?.message, bookId });
      await logDownload(supabaseAdmin, user.id, bookId, "ERROR", ip);
      return NextResponse.json({ message: "Failed to generate secure access link" }, { status: 500 });
    }

    // 7. Log Success
    await logDownload(supabaseAdmin, user.id, bookId, "SUCCESS", ip);

    return NextResponse.json({ url: signedData.signedUrl });
  } catch (error: any) {
    logger.error("Reader access error", { error: error.message });
    throw error;
  }
}, "/api/books/[id]/download");
