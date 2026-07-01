"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const showFooter = pathname !== "/login" && pathname !== "/signup";

  if (isAuthPage) {
    return (
      <main className="flex-grow pt-0 h-screen overflow-hidden bg-white">{children}</main>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-grow pt-24">{children}</main>
      {showFooter && (
        <footer className="border-t border-zinc-100 dark:border-zinc-900 pt-24 pb-12 mt-20">
        <div className="unified-axis">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-16 md:gap-8 mb-20">
            <div className="col-span-1 md:col-span-1">
              <span className="font-heading font-black text-2xl uppercase tracking-tighter italic block mb-6">Writersthing</span>
              <p className="text-zinc-500 text-sm font-medium max-w-xs leading-relaxed">
                The ultimate destination for the next generation of storytellers. Turning unknown writers into icons.
              </p>
            </div>
            
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white mb-6">Platform</h4>
              <ul className="flex flex-col gap-4 text-sm font-medium text-zinc-500">
                <li><a href="/stories" className="hover:text-black dark:hover:text-white transition-colors">Stories</a></li>
                <li><a href="/marketplace" className="hover:text-black dark:hover:text-white transition-colors">Marketplace</a></li>
                <li><a href="/authors" className="hover:text-black dark:hover:text-white transition-colors">Authors</a></li>
                <li><a href="/library" className="hover:text-black dark:hover:text-white transition-colors">Library</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white mb-6">Company</h4>
              <ul className="flex flex-col gap-4 text-sm font-medium text-zinc-500">
                <li><a href="/about" className="hover:text-black dark:hover:text-white transition-colors">About Us</a></li>
                <li><a href="/contact" className="hover:text-black dark:hover:text-white transition-colors">Contact</a></li>
                <li><a href="/careers" className="hover:text-black dark:hover:text-white transition-colors">Careers</a></li>
                <li><a href="/press" className="hover:text-black dark:hover:text-white transition-colors">Press</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white mb-6">Connect</h4>
              <ul className="flex flex-col gap-4 text-sm font-medium text-zinc-500">
                <li><a href="https://twitter.com" className="hover:text-black dark:hover:text-white transition-colors" target="_blank" rel="noreferrer">Twitter / X</a></li>
                <li><a href="https://instagram.com" className="hover:text-black dark:hover:text-white transition-colors" target="_blank" rel="noreferrer">Instagram</a></li>
                <li><a href="https://linkedin.com" className="hover:text-black dark:hover:text-white transition-colors" target="_blank" rel="noreferrer">LinkedIn</a></li>
                <li><a href="https://discord.com" className="hover:text-black dark:hover:text-white transition-colors" target="_blank" rel="noreferrer">Discord</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-zinc-100 dark:border-zinc-900 gap-6">
            <p className="text-zinc-500 text-xs font-medium italic">© 2026 Writersthing. Built for the unknown.</p>
            <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">
              <a href="/terms" className="hover:text-black dark:hover:text-white transition-colors">Terms of Service</a>
              <a href="/privacy" className="hover:text-black dark:hover:text-white transition-colors">Privacy Policy</a>
              <a href="/cookies" className="hover:text-black dark:hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
      )}
    </>
  );
}
