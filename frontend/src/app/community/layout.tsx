import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Community | Writer's Thing",
  description: "Connect with thousands of writers on our platform.",
  alternates: {
    canonical: 'https://www.writersthing.com/community',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
