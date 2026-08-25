import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Contact | Writer's Thing",
  description: "Get in touch with our team.",
  alternates: {
    canonical: 'https://www.writersthing.com/contact',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
