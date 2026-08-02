"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Bell, User, Search, Menu, X, ShoppingBag, Feather, Home, Bookmark, FileText, BarChart2, Users, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import NotificationsDropdown from "./NotificationsDropdown";
import { OptimizedImage } from "@/components/OptimizedImage";
import AvatarWithBadge from "./AvatarWithBadge";

import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setUserRole(null);
      return;
    }
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserRole(parsed.role || "Author");
      } catch (e) {
        console.error(e);
      }
    }
  }, [user]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const shouldHide = pathname?.startsWith("/read") || 
                     pathname?.startsWith("/editor") ||
                     pathname === "/login" ||
                     pathname === "/signup";

  const navLinks = user
    ? [
        { name: "About", href: "/about" },
        { name: "For Writers", href: "/for-writers" },
      ]
    : [
        { name: "About", href: "/about" },
        { name: "For Writers", href: "/for-writers" },
      ];

  return (
    <AnimatePresence>
      {!shouldHide && (
        <>
          <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: isMobileMenuOpen ? 0 : 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${isMobileMenuOpen ? 'pointer-events-none' : ''} ${
              isScrolled 
                ? "bg-white/70 backdrop-blur-xl border-b border-zinc-100/80 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] h-16" 
                : "bg-white/30 backdrop-blur-sm border-b border-zinc-100/30 h-16"
            }`}
          >
            <div className="unified-axis h-full flex items-center justify-between">
              {/* Logo and Menu Toggle */}
              <div className="flex items-center gap-3">
                <button
                  className="lg:hidden p-2 -ml-2 text-zinc-500 hover:text-black"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  <Menu size={24} />
                </button>
                <Link href={user ? "/marketplace" : "/"} className="flex items-center group">
                  <span className="text-2xl md:text-3xl font-[family-name:var(--font-bodoni-moda)] tracking-tight text-black group-hover:opacity-80 transition-opacity">
                    Writer's Thing
                  </span>
                </Link>
              </div>

              {/* Desktop Menu */}
              <div className="hidden lg:flex items-center gap-8 xl:gap-12 absolute left-1/2 -translate-x-1/2">
                {navLinks.map((link) => (
                  <Link 
                    key={link.name} 
                    href={link.href}
                    className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-black transition-colors duration-300 relative group"
                  >
                    {link.name}
                    <span className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-black transition-all duration-300 group-hover:w-full" />
                  </Link>
                ))}
              </div>
 
              {/* Right Actions */}
              <div className="flex items-center gap-4 md:gap-8">
                {!user ? (
                  <>

                    <Link
                      href="/signup"
                      className="hidden md:block px-6 lg:px-8 py-2.5 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-sm rounded-none"
                    >
                      Get Started
                    </Link>
                  </>
                ) : (
                  <div className="flex items-center gap-3 md:gap-6">
                    <NotificationsDropdown />
                    
                    {userRole && (userRole === "Author" || userRole === "Admin") && (
                      <Link
                        href="/editor"
                        className="hidden md:flex items-center gap-1.5 px-4 py-2 border border-black font-bold text-[10px] uppercase tracking-widest hover:bg-black hover:text-white transition-all text-black bg-white"
                      >
                        <Plus size={12} /> Write
                      </Link>
                    )}
                    
                    <Link
                      href="/profile"
                      className="group p-1.5 border border-black bg-white hover:bg-black transition-all duration-300 flex items-center gap-2.5 sm:pr-4"
                    >
                      <AvatarWithBadge 
                        userId={user.id}
                        avatarUrl={user.user_metadata?.avatar_url || user.avatar_url}
                        name={(user.user_metadata?.name || user.email) as string}
                        className="w-[22px] h-[22px] rounded-full"
                      />
                      <span className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-black group-hover:text-white transition-colors">
                        {(user.user_metadata?.name || user.email)?.split('@')[0].split(' ')[0]}
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.nav>

          {/* Mobile Menu Drawer Overlay */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="fixed inset-0 bg-black/40 z-50 lg:hidden"
                />
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "tween", duration: 0.3 }}
                  className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[60] shadow-2xl flex flex-col overflow-y-auto lg:hidden"
                >
                  <div className="p-6 border-b border-zinc-100 flex items-center gap-4">
                    <button onClick={() => setIsMobileMenuOpen(false)} className="text-zinc-500 hover:text-black">
                      <Menu size={24} />
                    </button>
                    <Link href={user ? "/marketplace" : "/"} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center">
                      <img src="/logo.png" alt="Writersthing Logo" className="h-10 w-auto max-w-[200px] object-contain" style={{ filter: 'grayscale(100%)' }} />
                    </Link>
                  </div>
                  
                  <div className="flex flex-col py-4">
                    <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 px-6 py-3 hover:bg-zinc-50 text-zinc-600 hover:text-black">
                      <Home size={20} strokeWidth={1.5} />
                      <span className="text-sm font-medium">Home</span>
                    </Link>
                    <Link href="/marketplace" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 px-6 py-3 hover:bg-zinc-50 text-zinc-600 hover:text-black">
                      <Bookmark size={20} strokeWidth={1.5} />
                      <span className="text-sm font-medium">Marketplace</span>
                    </Link>
                    <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 px-6 py-3 hover:bg-zinc-50 text-zinc-600 hover:text-black">
                      <User size={20} strokeWidth={1.5} />
                      <span className="text-sm font-medium">Profile</span>
                    </Link>
                    
                    {userRole && (userRole === "Author" || userRole === "Admin") && (
                      <>
                        <Link href="/editor" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-4 px-6 py-3 hover:bg-zinc-50 text-zinc-600 hover:text-black">
                          <Feather size={20} strokeWidth={1.5} />
                          <span className="text-sm font-medium">Write</span>
                        </Link>
                      </>
                    )}
                  </div>


                  {!user && (
                    <div className="mt-auto p-6 flex flex-col gap-4 border-t border-zinc-100">
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-3 text-center border border-black text-xs font-black uppercase tracking-widest rounded-none">Log In</Link>
                      <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-3 text-center bg-black text-white text-xs font-black uppercase tracking-widest rounded-none hover:bg-zinc-800 transition-colors">Get Started</Link>
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}
