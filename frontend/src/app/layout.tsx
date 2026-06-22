import type { Metadata } from "next";
import { Inter, Outfit, Playfair_Display, Questrial } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";
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
          <ClientLayout>{children}</ClientLayout>
        </AuthProvider>
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


