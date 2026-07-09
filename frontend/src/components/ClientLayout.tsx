"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/onboarding";
  const showFooter = pathname === "/";

  if (isAuthPage) {
    return (
      <main className="flex-grow pt-0 h-screen overflow-hidden bg-white">{children}</main>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-grow pt-16">{children}</main>
      {showFooter && <Footer />}
    </>
  );
}
