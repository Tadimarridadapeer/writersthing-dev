import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

function getSupabaseServer() {
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paramUserId = searchParams.get("user_id");

    const supabaseServer = getSupabaseServer();
    const { data: { user: authUser } } = await supabaseServer.auth.getUser();

    const activeUserId = authUser?.id || paramUserId;
    if (!activeUserId) {
      return NextResponse.json({ items: [] });
    }

    // Query cart table
    const { data: cartData, error } = await supabaseServer
      .from("cart")
      .select("*")
      .eq("user_id", activeUserId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Cart GET table query notice:", error.message);
      return NextResponse.json({ items: [] });
    }

    if (!cartData || cartData.length === 0) {
      return NextResponse.json({ items: [] });
    }

    const bookIds = cartData.map(c => c.book_id).filter(Boolean);

    // Query details for books
    const { data: booksData } = await supabaseServer
      .from("books")
      .select("*, authors:author_id(*, users:user_id(name))")
      .in("id", bookIds);

    const { data: storiesData } = await supabaseServer
      .from("stories")
      .select("*, authors:author_id(*, users:user_id(name))")
      .in("id", bookIds);

    const booksMap = new Map((booksData || []).map((b: any) => [b.id, b]));
    const storiesMap = new Map((storiesData || []).map((s: any) => [s.id, s]));

    const formattedItems = cartData.map(item => {
      const book = booksMap.get(item.book_id);
      const story = storiesMap.get(item.book_id);
      const detail = book || story;

      return {
        id: item.book_id,
        book_id: item.book_id,
        title: detail?.title || `Item #${item.book_id}`,
        price: detail?.price ? parseFloat(detail.price) : 14.99,
        cover_url: detail?.cover_url || detail?.cover_image || "/placeholder-cover.jpg",
        author_name: detail?.authors?.users?.name || detail?.author?.name || "Author",
        quantity: item.quantity || 1
      };
    });

    return NextResponse.json({ items: formattedItems });

  } catch (err: any) {
    console.error("GET /api/cart error:", err?.message || err);
    return NextResponse.json({ items: [] });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, book_id, quantity = 1 } = body;

    if (!book_id) {
      return NextResponse.json({ error: "book_id is required" }, { status: 400 });
    }

    const supabaseServer = getSupabaseServer();
    const { data: { user: authUser } } = await supabaseServer.auth.getUser();

    const activeUserId = authUser?.id || user_id;
    if (!activeUserId) {
      return NextResponse.json({ error: "User authentication required" }, { status: 401 });
    }

    // Check existing item
    const { data: existing } = await supabaseServer
      .from("cart")
      .select("id, quantity")
      .eq("user_id", activeUserId)
      .eq("book_id", book_id)
      .maybeSingle();

    if (existing) {
      const newQty = existing.quantity + quantity;
      await supabaseServer
        .from("cart")
        .update({ quantity: newQty })
        .eq("id", existing.id);
    } else {
      await supabaseServer.from("cart").insert({
        user_id: activeUserId,
        book_id,
        quantity
      });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("POST /api/cart error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Failed to add to cart" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { user_id, book_id, quantity } = body;

    if (!book_id || quantity === undefined) {
      return NextResponse.json({ error: "book_id and quantity are required" }, { status: 400 });
    }

    const supabaseServer = getSupabaseServer();
    const { data: { user: authUser } } = await supabaseServer.auth.getUser();

    const activeUserId = authUser?.id || user_id;
    if (!activeUserId) {
      return NextResponse.json({ error: "User authentication required" }, { status: 401 });
    }

    if (quantity <= 0) {
      await supabaseServer
        .from("cart")
        .delete()
        .eq("user_id", activeUserId)
        .eq("book_id", book_id);
    } else {
      await supabaseServer
        .from("cart")
        .update({ quantity })
        .eq("user_id", activeUserId)
        .eq("book_id", book_id);
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("PUT /api/cart error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Failed to update cart" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const paramUserId = searchParams.get("user_id");
    const bookId = searchParams.get("book_id");
    const isClear = searchParams.get("clear") === "true";

    const supabaseServer = getSupabaseServer();
    const { data: { user: authUser } } = await supabaseServer.auth.getUser();

    const activeUserId = authUser?.id || paramUserId;
    if (!activeUserId) {
      return NextResponse.json({ error: "User authentication required" }, { status: 401 });
    }

    if (isClear) {
      await supabaseServer.from("cart").delete().eq("user_id", activeUserId);
    } else if (bookId) {
      await supabaseServer.from("cart").delete().eq("user_id", activeUserId).eq("book_id", bookId);
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("DELETE /api/cart error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Failed to delete cart item" }, { status: 500 });
  }
}
