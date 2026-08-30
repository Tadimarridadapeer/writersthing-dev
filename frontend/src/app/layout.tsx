import type { Metadata } from "next";
import { Inter, Outfit, Playfair_Display, Questrial, Bodoni_Moda, Libre_Baskerville, EB_Garamond } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { GoogleTagManager } from "@next/third-parties/google";
import ClientLayout from "@/components/ClientLayout";
import LoadingScreen from "@/components/LoadingScreen";
import { AuthProvider } from "@/context/AuthContext";
import { FoundingWritersProvider } from "@/context/FoundingWritersContext";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import FounderInvitationModal from "@/components/ui/FounderInvitationModal";
import MaintenanceProvider from "@/components/MaintenanceProvider";

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

const bodoniModa = Bodoni_Moda({
  variable: "--font-bodoni-moda",
  subsets: ["latin"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
});

export const viewport: import("next").Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.writersthing.com"),
  title: "Writer's Thing - A Home for Writers & Storytellers",
  description: "Writer's Thing is a publishing platform for writers, storytellers, and authors to write, publish, discover, and share great stories.",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Writer's Thing - A Home for Writers & Storytellers",
    description: "Writer's Thing is a publishing platform for writers, storytellers, and authors to write, publish, discover, and share great stories.",
    url: 'https://www.writersthing.com',
    siteName: "Writer's Thing",
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Writer's Thing - A Home for Writers & Storytellers",
    description: "Writer's Thing is a publishing platform for writers, storytellers, and authors to write, publish, discover, and share great stories.",
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Writer\'s Thing',
      url: 'https://www.writersthing.com',
      publisher: {
        '@id': 'https://www.writersthing.com/#organization'
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': 'https://www.writersthing.com/#organization',
      name: 'Writer\'s Thing',
      url: 'https://www.writersthing.com'
    }
  ];

  return (
    <html
      lang="en"
      className="h-full"
      suppressHydrationWarning
    >
      <GoogleTagManager gtmId="GTM-T8V938H8" />
      <body 
        className={`${inter.variable} ${outfit.variable} ${playfair.variable} ${questrial.variable} ${bodoniModa.variable} ${libreBaskerville.variable} ${ebGaramond.variable} min-h-full flex flex-col bg-white dark:bg-black text-black dark:text-white antialiased`}
        suppressHydrationWarning
      >
        <Script
          id="json-ld-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <MaintenanceProvider>
          <FoundingWritersProvider>
            <AuthProvider>
              <LoadingScreen />
              <FounderInvitationModal />
              <ClientLayout>{children}</ClientLayout>
            </AuthProvider>
          </FoundingWritersProvider>
          <Script
            id="razorpay-checkout-js"
            src="https://checkout.razorpay.com/v1/checkout.js"
          />
          {process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true' && <Analytics />}
          {process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true' && <SpeedInsights />}
        </MaintenanceProvider>
      </body>
    </html>
  );
}

function Link({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return <a href={href} className={className}>{children}</a>;
}


