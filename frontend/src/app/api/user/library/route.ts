import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [libRes, purRes] = await Promise.all([
      supabaseAdmin.from("library").select("*, books(*, authors:author_id(*, users!authors_user_id_fkey(name)))").eq("user_id", userId),
      supabaseAdmin.from("purchases").select("*, books(*, authors:author_id(*, users!authors_user_id_fkey(name)))").eq("buyer_id", userId).eq("status", "COMPLETED")
    ]);

    const combinedBooks = new Map<string, any>();
    
    if (libRes.data) {
      libRes.data.filter((l: any) => l.books).forEach((l: any) => {
        combinedBooks.set(l.book_id, {
          ...l.books,
          purchase_date: l.created_at
        });
      });
    }
    
    if (purRes.data) {
      purRes.data.filter((p: any) => p.books).forEach((p: any) => {
        if (!combinedBooks.has(p.book_id)) {
          combinedBooks.set(p.book_id, {
            ...p.books,
            purchase_date: p.purchased_at || p.created_at
          });
        }
      });
    }

    return NextResponse.json({
      success: true,
      books: Array.from(combinedBooks.values())
    });

  } catch (error: any) {
    console.error("Library fetch error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
