"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface CartItem {
  id: string;
  book_id?: string;
  title: string;
  price: number;
  cover_url?: string;
  author_name?: string;
  quantity: number;
}

const CART_KEY = "writersthing_cart";

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Read cart from localStorage & sync from API/Supabase on mount
  useEffect(() => {
    loadCart();

    const handleStorageChange = () => {
      loadCart();
    };

    window.addEventListener("writersthing-cart-updated", handleStorageChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("writersthing-cart-updated", handleStorageChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const loadCart = async () => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      let localItems: CartItem[] = stored ? JSON.parse(stored) : [];

      const storedUser = localStorage.getItem("user");
      const userObj = storedUser ? JSON.parse(storedUser) : null;

      if (userObj?.id) {
        // Attempt backend sync
        try {
          const res = await fetch(`/api/cart?user_id=${userObj.id}`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.items) && data.items.length > 0) {
              localItems = data.items;
              localStorage.setItem(CART_KEY, JSON.stringify(localItems));
            }
          }
        } catch (apiErr) {
          console.warn("Backend cart sync error:", apiErr);
        }
      }

      setCart(localItems);
    } catch (err) {
      console.error("Load cart error:", err);
    } finally {
      setLoading(false);
    }
  };

  const dispatchUpdate = (updatedCart: CartItem[]) => {
    setCart(updatedCart);
    localStorage.setItem(CART_KEY, JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("writersthing-cart-updated"));
  };

  const addToCart = async (item: {
    id: string;
    title: string;
    price?: number | string;
    cover_url?: string;
    author_name?: string;
    quantity?: number;
  }) => {
    const rawPrice = typeof item.price === "string" ? parseFloat(item.price.replace(/[^0-9.]/g, "")) : (item.price || 0);
    const parsedPrice = isNaN(rawPrice) ? 14.99 : rawPrice;
    const addQty = item.quantity || 1;

    setCart(prev => {
      const existingIdx = prev.findIndex(i => (i.id === item.id || i.book_id === item.id));
      let updated: CartItem[];

      if (existingIdx > -1) {
        updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + addQty
        };
      } else {
        const newItem: CartItem = {
          id: item.id,
          book_id: item.id,
          title: item.title,
          price: parsedPrice,
          cover_url: item.cover_url || "/placeholder-cover.jpg",
          author_name: item.author_name || "Author",
          quantity: addQty
        };
        updated = [newItem, ...prev];
      }

      dispatchUpdate(updated);
      return updated;
    });

    // Sync to backend if logged in
    const storedUser = localStorage.getItem("user");
    const userObj = storedUser ? JSON.parse(storedUser) : null;
    if (userObj?.id) {
      try {
        await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userObj.id,
            book_id: item.id,
            quantity: addQty
          })
        });
      } catch (err) {
        console.warn("API add to cart error:", err);
      }
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }

    setCart(prev => {
      const updated = prev.map(item =>
        (item.id === id || item.book_id === id) ? { ...item, quantity } : item
      );
      dispatchUpdate(updated);
      return updated;
    });

    const storedUser = localStorage.getItem("user");
    const userObj = storedUser ? JSON.parse(storedUser) : null;
    if (userObj?.id) {
      try {
        await fetch("/api/cart", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userObj.id,
            book_id: id,
            quantity
          })
        });
      } catch (err) {
        console.warn("API update cart error:", err);
      }
    }
  };

  const removeFromCart = async (id: string) => {
    setCart(prev => {
      const updated = prev.filter(item => item.id !== id && item.book_id !== id);
      dispatchUpdate(updated);
      return updated;
    });

    const storedUser = localStorage.getItem("user");
    const userObj = storedUser ? JSON.parse(storedUser) : null;
    if (userObj?.id) {
      try {
        await fetch(`/api/cart?user_id=${userObj.id}&book_id=${id}`, {
          method: "DELETE"
        });
      } catch (err) {
        console.warn("API delete cart item error:", err);
      }
    }
  };

  const clearCart = async () => {
    dispatchUpdate([]);
    const storedUser = localStorage.getItem("user");
    const userObj = storedUser ? JSON.parse(storedUser) : null;
    if (userObj?.id) {
      try {
        await fetch(`/api/cart?user_id=${userObj.id}&clear=true`, {
          method: "DELETE"
        });
      } catch (err) {
        console.warn("API clear cart error:", err);
      }
    }
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return {
    cart,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartCount,
    cartSubtotal
  };
}
