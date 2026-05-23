import type { Metadata } from "next";
import { Inter, Outfit, Playfair_Display, Questrial } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navbar from "@/components/Navbar";
import LoadingScreen from "@/components/LoadingScreen";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const questrial = Questrial({
  variable: "--font-questrial",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Writersthing - Unknown Writers Become Known",
  description: "A premium platform for authors and readers to connect, share, and grow.",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full"
      suppressHydrationWarning
    >
      <body 
        className={`${inter.variable} ${outfit.variable} ${playfair.variable} ${questrial.variable} min-h-full flex flex-col bg-white dark:bg-black text-black dark:text-white antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <LoadingScreen />
          <Navbar />
          <main className="flex-grow pt-24">{children}</main>
        </AuthProvider>
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
                  <li><Link href="/stories" className="hover:text-black dark:hover:text-white transition-colors">Stories</Link></li>
                  <li><Link href="/marketplace" className="hover:text-black dark:hover:text-white transition-colors">Marketplace</Link></li>
                  <li><Link href="/authors" className="hover:text-black dark:hover:text-white transition-colors">Authors</Link></li>
                  <li><Link href="/library" className="hover:text-black dark:hover:text-white transition-colors">Library</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white mb-6">Company</h4>
                <ul className="flex flex-col gap-4 text-sm font-medium text-zinc-500">
                  <li><Link href="/about" className="hover:text-black dark:hover:text-white transition-colors">About Us</Link></li>
                  <li><Link href="/contact" className="hover:text-black dark:hover:text-white transition-colors">Contact</Link></li>
                  <li><Link href="/careers" className="hover:text-black dark:hover:text-white transition-colors">Careers</Link></li>
                  <li><Link href="/press" className="hover:text-black dark:hover:text-white transition-colors">Press</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-zinc-900 dark:text-white mb-6">Connect</h4>
                <ul className="flex flex-col gap-4 text-sm font-medium text-zinc-500">
                  <li><Link href="https://twitter.com" className="hover:text-black dark:hover:text-white transition-colors">Twitter / X</Link></li>
                  <li><Link href="https://instagram.com" className="hover:text-black dark:hover:text-white transition-colors">Instagram</Link></li>
                  <li><Link href="https://linkedin.com" className="hover:text-black dark:hover:text-white transition-colors">LinkedIn</Link></li>
                  <li><Link href="https://discord.com" className="hover:text-black dark:hover:text-white transition-colors">Discord</Link></li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-zinc-100 dark:border-zinc-900 gap-6">
              <p className="text-zinc-500 text-xs font-medium italic">© 2026 Writersthing. Built for the unknown.</p>
              <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                <Link href="/terms" className="hover:text-black dark:hover:text-white transition-colors">Terms of Service</Link>
                <Link href="/privacy" className="hover:text-black dark:hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/cookies" className="hover:text-black dark:hover:text-white transition-colors">Cookie Policy</Link>
              </div>
            </div>
          </div>
        </footer>
        <Script
          id="razorpay-checkout-js"
          src="https://checkout.razorpay.com/v1/checkout.js"
        />
      </body>
    </html>
  );
}

function Link({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return <a href={href} className={className}>{children}</a>;
}


