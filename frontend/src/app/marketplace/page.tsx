"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Search, Filter, BookOpen, Clock, Star, Loader2, ArrowRight, X, Globe, ChevronDown, Feather } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";

import { supabase } from "@/lib/supabase";

function MarketplaceContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "All Genres";
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [activeLanguage, setActiveLanguage] = useState("English");
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from("books")
        .select("*")
        .eq("status", "Published")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBooks(data || []);
    } catch (err: any) {
      console.error("Fetch error:", err);
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (book: any) => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      alert("Please login to purchase books.");
      window.location.href = "/login?redirect=/marketplace";
      return;
    }

    const user = JSON.parse(storedUser);
    setPurchasing(book.id);

    try {
      // 1. Create Order in Backend
      const res = await fetch("/api/pay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookId: book.id,
          amount: book.price || 99,
          userId: user.id
        }),
      });

      const order = await res.json();

      // 2. Initialize Razorpay (Mocking the window.Razorpay part for now)
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Writersthing",
        description: `Purchase: ${book.title}`,
        order_id: order.id,
        handler: async function (response: any) {
          // 3. Verify Payment
          const verifyRes = await fetch("/api/pay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            }),
          });

          if (verifyRes.ok) {
            setShowSuccess(true);
          } else {
            alert("Payment verification failed.");
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#000000",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Purchase error:", err);
      alert("Payment failed to initialize.");
    } finally {
      setPurchasing(null);
    }
  };

  const categories = ["All Genres", "Love", "Comedy", "Education", "Mystery", "Fiction", "Non-Fiction", "History", "Sci-Fi", "Thriller", "Biography", "Poetry"];
  const languages = ["English", "Hindi", "Telugu", "Tamil", "Marathi", "Bengali", "Kannada", "Malayalam", "Urdu", "Gujarati", "Punjabi", "Odia", "Assamese", "Maithili", "Sanskrit", "Konkani"];

  const filteredBooks = books.filter(book => {
    const bookGenre = (book.genre || book.category || "").toLowerCase();
    const categoryMatch = activeCategory === "All Genres" || bookGenre === activeCategory.toLowerCase();
    const languageMatch = (book.language || "").toLowerCase() === activeLanguage.toLowerCase();
    return categoryMatch && languageMatch;
  });

  return (
    <div className="bg-white min-h-screen relative overflow-x-hidden">
      <AnimatePresence>
        {isFilterSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]" 
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white z-[210] shadow-2xl p-12 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-16">
                <h2 className="text-2xl font-heading font-black uppercase tracking-tighter">Advanced Filters</h2>
                <button onClick={() => setIsFilterSidebarOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-all">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-12">
                <FilterSection title="Genres">
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map(c => (
                      <button 
                        key={c}
                        onClick={() => setActiveCategory(c)}
                        className={`py-3 px-4 text-[9px] font-black uppercase tracking-widest rounded-sm border transition-all ${activeCategory === c ? "bg-black text-white border-black" : "bg-zinc-50 text-zinc-400 border-zinc-100 hover:border-zinc-300"}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </FilterSection>

                <FilterSection title="Indian Languages">
                  <div className="grid grid-cols-2 gap-3">
                    {languages.map(l => (
                      <button 
                        key={l}
                        onClick={() => setActiveLanguage(l)}
                        className={`py-3 px-4 text-[9px] font-black uppercase tracking-widest rounded-sm border transition-all ${activeLanguage === l ? "bg-black text-white border-black" : "bg-zinc-50 text-zinc-400 border-zinc-100 hover:border-zinc-300"}`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </FilterSection>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-[500] flex items-center justify-center p-8 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white p-20 text-center max-w-xl w-full rounded-sm shadow-2xl"
            >
              <div className="w-24 h-24 bg-green-500 flex items-center justify-center mx-auto mb-12 rounded-full text-white">
                <Star size={48} />
              </div>
              <h2 className="text-5xl font-heading font-black uppercase tracking-tight mb-6">Payment Success</h2>
              <p className="text-zinc-500 font-medium italic text-xl mb-6">Funds have been directly transferred to the Author's bank account.</p>
              <p className="text-zinc-400 text-sm mb-12">The manuscript has been added to your Library.</p>
              <button 
                onClick={() => (window.location.href = "/dashboard/library")}
                className="px-12 py-5 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-2xl"
              >
                Go to Library
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="unified-axis py-32">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12 mb-24">
          <div className="max-w-2xl">
            <div className="flex items-center gap-4 mb-6 md:mb-8">
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400">The Library</span>
              <div className="h-px w-12 bg-zinc-200" />
            </div>
            <h1 className="text-h1 tracking-ultra-tight uppercase mb-6 md:mb-8">Marketplace</h1>
            <p className="text-zinc-500 font-medium text-lg md:text-xl leading-relaxed italic">
              Independent voices, decentralized stories. All digital manuscripts are flat-priced at <span className="text-black font-bold border-b-2 border-black pb-1">₹99</span>.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-4">
            <div className="relative flex-grow lg:w-96">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
              <input 
                type="text" 
                placeholder="Search books..." 
                className="w-full bg-zinc-50 border border-zinc-100 rounded-sm py-5 pl-16 pr-8 outline-none focus:border-black transition-all font-bold text-sm uppercase tracking-widest placeholder:text-zinc-300"
              />
            </div>
            <Link 
              href="/write?type=book"
              className="px-10 py-5 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl rounded-sm flex items-center justify-center gap-3"
            >
              <Feather size={14} /> Publish Yours
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="py-40 flex flex-col items-center gap-6">
            <Loader2 className="animate-spin text-zinc-200" size={48} />
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-300">Synchronizing Archive...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
            {filteredBooks.map((book) => (
              <MarketBookCard 
                key={book.id}
                id={book.id}
                title={book.title} 
                author={book.author?.name || "Unknown"} 
                genre={book.category} 
                image={book.cover_url || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=800"} 
                language={book.language}
                price={book.price}
                onPurchase={() => handlePurchase(book)}
                isPurchasing={purchasing === book.id}
              />
            ))}
            
            {filteredBooks.length === 0 && (
              <div className="col-span-full py-40 text-center bg-zinc-50 border border-zinc-100 rounded-sm">
                <p className="text-zinc-400 font-medium italic text-xl mb-4">No manuscripts found for your selection.</p>
                <button 
                  onClick={() => {
                    setActiveCategory("All Genres");
                    setActiveLanguage("English");
                  }}
                  className="text-[10px] font-black uppercase tracking-widest border-b border-black pb-1 hover:opacity-60 transition-all"
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MarketBookCard({ id, title, author, genre, image, language, price, onPurchase, isPurchasing }: any) {
  return (
    <Link href={`/book/${id}`}>
      <motion.div 
        whileHover={{ y: -10 }}
        className="group cursor-pointer"
      >
        <div className="aspect-[3/4.5] bg-zinc-100 overflow-hidden relative shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] transition-all duration-700">
          <img src={image} alt={title} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-transform duration-1000 group-hover:scale-105" />
          <div className="absolute top-6 right-6 z-10">
            <span className="bg-black/80 backdrop-blur-sm text-white px-4 py-2 text-[8px] font-black uppercase tracking-widest rounded-full">{language}</span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-8 group-hover:translate-y-0 transition-all duration-500">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onPurchase();
              }}
              disabled={isPurchasing}
              className="w-full bg-white text-black py-4 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-zinc-100 transition-colors flex items-center justify-center gap-3"
            >
              {isPurchasing ? <Loader2 size={14} className="animate-spin" /> : null}
              {isPurchasing ? "Processing..." : `Purchase for ₹${price || 99}`}
            </button>
          </div>
        </div>
        
        <div className="mt-8">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mb-2">{genre}</p>
          <h3 className="text-2xl font-heading font-black tracking-tight uppercase leading-none mb-2">{title}</h3>
          <p className="text-sm font-medium text-zinc-400 italic">by {author}</p>
        </div>
      </motion.div>
    </Link>
  );
}

function FilterSection({ title, children }: any) {
  return (
    <div>
      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 mb-6">{title}</h3>
      {children}
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <MarketplaceContent />
    </Suspense>
  );
}



