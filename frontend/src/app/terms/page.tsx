"use client";

import BackButton from "@/components/BackButton";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function TermsPage() {
  return (
    <div className="bg-white min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <Breadcrumbs />
        <div className="mt-6">
          <BackButton />
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-5xl md:text-6xl font-heading font-black tracking-tighter uppercase mb-4">Terms of Use</h1>
        <p className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-12">Last Updated: August 15, 2026</p>
        
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">1. Introduction</h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              Welcome to Writer's Thing. These Terms of Use govern your access to and use of our platform, website, and services. By accessing or using Writer's Thing, you agree to be bound by these Terms and all applicable laws and regulations.
            </p>
            <p className="text-zinc-600 leading-relaxed mb-4">
              If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">2. Intellectual Property Rights</h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              <strong>For Creators:</strong> You retain 100% ownership and copyright of any original content, manuscripts, stories, or blogs you publish on Writer's Thing. By publishing on our platform, you grant us a non-exclusive, worldwide, royalty-free license to display, distribute, and promote your content strictly within the context of operating and marketing the platform.
            </p>
            <p className="text-zinc-600 leading-relaxed mb-4">
              <strong>For Writer's Thing:</strong> The platform itself, including its original design, features, functionality, and branding, are owned by Writer's Thing and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">3. User Conduct</h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              You agree not to use the platform to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-600">
              <li>Publish plagiarized, infringing, or stolen content.</li>
              <li>Distribute malicious code or attempt to compromise the platform's security.</li>
              <li>Engage in harassment, hate speech, or targeted abuse of other users or creators.</li>
              <li>Manipulate analytics, reading counts, or marketplace transactions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">4. Marketplace and Payments</h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              Creators may sell their work on Writer's Thing. We operate on a direct creator-to-reader revenue model, retaining a minimal commission on sales to cover transaction processing and platform maintenance. 
            </p>
            <p className="text-zinc-600 leading-relaxed mb-4">
              All purchases are final unless required otherwise by law. Creators are responsible for ensuring they have the legal right to monetize the content they upload.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">5. Termination</h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              We reserve the right to terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms. Upon termination, your right to use the platform will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">6. Changes to Terms</h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">7. Contact Us</h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              If you have any questions about these Terms, please contact us at <a href="mailto:hello@writersthing.com" className="text-black font-bold hover:underline">hello@writersthing.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
