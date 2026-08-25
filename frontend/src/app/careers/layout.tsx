import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Careers | Writer's Thing",
  description: "Join our team and help build the future of publishing.",
  alternates: {
    canonical: 'https://www.writersthing.com/careers',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
