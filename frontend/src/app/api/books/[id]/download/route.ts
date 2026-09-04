import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { STORAGE_CONFIG } from "@/config/storage";
import { logger } from "@/lib/logger";
import { withObservability } from "@/lib/api-logger";

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string
  );
}

function getSupabase(req: Request) {
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
      global: {
        headers: {
          Authorization: req.headers.get("Authorization") || "",
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
    const supabase = getSupabase(req);
    const supabaseAdmin = getSupabaseAdmin();
    
    console.log("Download requested for bookId:", bookId);

    // 1. Authenticate User
    let user;
    const token = req.headers.get("Authorization")?.split("Bearer ")[1]?.trim();
    
    if (token) {
      const { data } = await supabaseAdmin.auth.getUser(token);
      user = data?.user;
    }
    
    if (!user) {
      const { data } = await supabase.auth.getUser();
      user = data?.user;
    }

    const xUserId = req.headers.get("x-user-id")?.trim();
    const candidateUserIds: string[] = [];
    if (user?.id) candidateUserIds.push(user.id);
    if (xUserId && !candidateUserIds.includes(xUserId)) candidateUserIds.push(xUserId);

    if (candidateUserIds.length === 0) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    if (!user && candidateUserIds.length > 0) {
      user = { id: candidateUserIds[0] } as any;
    }

    // 2. Fetch Book details
    const { data: book, error: bookError } = await supabaseAdmin
      .from("books")
      .select("id, author_id, price, status, pdf_path, authors:author_id(user_id)")
      .eq("id", bookId)
      .single();

    if (bookError || !book) {
      console.error("DEBUG: bookError:", bookError);
      logger.warn("Download rejected: Book not found", { bookId });
      await logDownload(supabaseAdmin, candidateUserIds[0], bookId, "NOT_FOUND", ip);
      return NextResponse.json({ message: "Book not found", debug_error: bookError, debug_id: bookId }, { status: 404 });
    }

    // Check if the user is the author
    let isBookOwner = false;
    for (const uid of candidateUserIds) {
      const { data: authorData } = await supabaseAdmin
        .from("authors")
        .select("id")
        .eq("user_id", uid)
        .maybeSingle();
      if (authorData && book.author_id === authorData.id) {
        isBookOwner = true;
        break;
      }
      if (book.author_id === uid) {
        isBookOwner = true;
        break;
      }
    }

    if (book.status !== "Published") {
      // Allow author to read draft, but block others
      if (!isBookOwner) {
        logger.security("Download rejected: Book is not published", { userId: candidateUserIds[0], bookId });
        await logDownload(supabaseAdmin, candidateUserIds[0], bookId, "FORBIDDEN", ip);
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
    else if (isBookOwner) {
      isAuthorized = true;
    } 
    // C. Has the user purchased it? (Check Library first, then Purchases for any candidate ID)
    else {
      for (const uid of candidateUserIds) {
        const { data: access } = await supabaseAdmin
          .from("library")
          .select("book_id")
          .eq("user_id", uid)
          .eq("book_id", bookId)
          .limit(1)
          .maybeSingle();
          
        if (access) {
          isAuthorized = true;
          break;
        }

        const { data: purchase } = await supabaseAdmin
          .from("purchases")
          .select("book_id")
          .eq("buyer_id", uid)
          .eq("book_id", bookId)
          .eq("status", "COMPLETED")
          .limit(1)
          .maybeSingle();
          
        if (purchase) {
          isAuthorized = true;
          break;
        }
      }
    }

    if (!isAuthorized) {
      const primaryId = candidateUserIds[0];
      logger.security("Download rejected: Access denied", { userId: primaryId, bookId });
      await logDownload(supabaseAdmin, primaryId, bookId, "FORBIDDEN", ip);
      
      return NextResponse.json(
        { 
          message: "Access denied. Please purchase the book.", 
          debug_error: {
            user_id: primaryId, 
            candidate_ids: candidateUserIds,
            book_id: bookId,
            isBookOwner,
            book_author_id: book?.author_id,
            book_authors: book?.authors
          },
          debug_id: bookId
        }, 
        { 
          status: 403,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          }
        }
      );
    }

    // 4. Resolve the Path (fallback to legacy pdf_path)
    const filePath = book.pdf_path;

    if (!filePath) {
      await logDownload(supabaseAdmin, user.id, bookId, "NOT_FOUND", ip);
      return NextResponse.json({ message: "PDF manuscript not found for this book." }, { status: 404 });
    }

    // 5. Verify the file exists in storage
    // Bypassing existence check if we want to save an API call, but let's do it for strict correctness
    // Or we can just generate signed url and let the client handle 404 from supabase.
    
    // 5.5 Validate PDF Path exists
    if (!filePath) {
      logger.error("Book has no manuscript attached", { bookId });
      return NextResponse.json({ message: "This book does not have a manuscript file attached." }, { status: 404 });
    }

    // 6. Generate Signed URL
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from(STORAGE_CONFIG.buckets.privateManuscripts)
      .createSignedUrl(filePath, STORAGE_CONFIG.security.signedUrlExpirySeconds);

    if (signError || !signedData?.signedUrl) {
      logger.error("Failed to generate secure access link", { error: signError?.message, bookId });
      await logDownload(supabaseAdmin, user.id, bookId, "ERROR", ip);
      return NextResponse.json({ message: "Failed to generate secure access link", debug_error: signError, debug_id: bookId }, { status: 500 });
    }

    // 7. Log Success
    await logDownload(supabaseAdmin, user.id, bookId, "SUCCESS", ip);

    return NextResponse.json({ url: signedData.signedUrl });
  } catch (error: any) {
    logger.error("Reader access error", { error: error.message });
    throw error;
  }
}, "/api/books/[id]/download");
