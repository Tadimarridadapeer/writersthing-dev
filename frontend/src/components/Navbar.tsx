"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Bell, User, Search, Menu, X, ShoppingBag, Feather } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const shouldHide = pathname?.startsWith("/dashboard") || 
                     pathname?.startsWith("/read") || 
                     pathname?.startsWith("/home") || 
                     pathname === "/write" ||
                     pathname === "/login" ||
                     pathname === "/signup";

  const navLinks = user
    ? [
        { name: "Books", href: "/marketplace" },
        { name: "Articles", href: "/articles" },
        { name: "Blogs", href: "/blogs" },
      ]
    : [
        { name: "Explore", href: "/marketplace" },
        { name: "Books", href: "/marketplace?type=Book" },
        { name: "Articles", href: "/articles" },
        { name: "Blogs", href: "/blogs" },
        { name: "About", href: "/about" },
        { name: "Categories", href: "/#categories" },
      ];

  return (
    <AnimatePresence>
      {!shouldHide && (
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
            isScrolled 
              ? "bg-white/90 backdrop-blur-xl border-b border-zinc-100 h-16" 
              : "bg-transparent h-24"
          }`}
        >
          <div className="unified-axis h-full flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 md:gap-3 group">
              <img src="/logo.png" alt="Writersthing Logo" className="w-8 h-8 md:w-12 md:w-12 object-contain transition-transform group-hover:scale-105" />
              <span className="font-heading font-black text-lg md:text-2xl uppercase tracking-tighter italic leading-none">Writersthing</span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-8 xl:gap-12 absolute left-1/2 -translate-x-1/2">
              {navLinks.map((link) => (
                <Link 
                  key={link.name} 
                  href={link.href}
                  className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 hover:text-black transition-colors relative group"
                >
                  {link.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-px bg-black transition-all group-hover:w-full" />
                </Link>
              ))}
            </div>
 
            {/* Right Actions */}
            <div className="flex items-center gap-4 md:gap-8">
              {!user ? (
                <>
                  <Link
                    href="/write"
                    className="hidden md:flex items-center gap-3 px-6 md:px-8 py-3 border border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all rounded-sm"
                  >
                    <Feather size={14} /> Write
                  </Link>
                  
                  <Link
                    href="/signup"
                    className="hidden lg:block px-8 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl rounded-sm"
                  >
                    Get Started
                  </Link>
                </>
              ) : (
                <div className="flex items-center gap-6">
                  {/* Unique Branded Dashboard Button */}
                  <Link
                    href="/dashboard"
                    className="px-5 py-2.5 bg-zinc-950 hover:bg-black text-white text-[10px] font-black uppercase tracking-[0.25em] transition-all rounded-sm shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.15)] hover:scale-105 active:scale-95 border border-black"
                  >
                    Dashboard
                  </Link>

                  <Link
                    href="/profile"
                    className="p-2 border border-zinc-150 rounded-full hover:bg-zinc-50 transition-all flex items-center gap-3 pr-5"
                  >
                    {user.user_metadata?.avatar_url || user.avatar_url ? (
                      <img 
                        src={user.user_metadata.avatar_url || user.avatar_url} 
                        className="w-[18px] h-[18px] rounded-full object-cover border border-zinc-100" 
                        alt="Avatar"
                      />
                    ) : (
                      <User size={18} />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {(user.user_metadata?.name || user.email)?.split('@')[0].split(' ')[0]}
                    </span>
                  </Link>
                </div>
              )}
              
              {/* Mobile Toggle */}
              <button
                className="lg:hidden p-2 text-zinc-500 hover:text-black"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 bg-white border-b border-zinc-100 p-12 flex flex-col gap-8 lg:hidden shadow-2xl"
              >
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-black"
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="pt-8 border-t border-zinc-50 flex flex-col gap-4">
                  {user && (
                    <Link
                      href="/dashboard"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full py-4 text-center bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-sm"
                    >
                      Dashboard
                    </Link>
                  )}
                  <Link
                    href="/write"
                    className="w-full py-4 text-center border border-black text-[10px] font-black uppercase tracking-widest"
                  >
                    Write
                  </Link>
                  {!user && (
                    <Link
                      href="/signup"
                      className="w-full py-4 text-center bg-black text-white text-[10px] font-black uppercase tracking-widest"
                    >
                      Get Started
                    </Link>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
