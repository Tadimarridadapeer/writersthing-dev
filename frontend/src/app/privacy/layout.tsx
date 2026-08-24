import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Privacy Policy | Writer's Thing",
  description: "Privacy Policy for Writer's Thing. Learn how we collect, use, and protect your data.",
  alternates: {
    canonical: 'https://www.writersthing.com/privacy',
  },
  openGraph: {
    title: "Privacy Policy | Writer's Thing",
    description: "Privacy Policy for Writer's Thing. Learn how we collect, use, and protect your data.",
    url: 'https://www.writersthing.com/privacy',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
