"use client";

import BackButton from "@/components/BackButton";
import Breadcrumbs from "@/components/Breadcrumbs";

export default function PrivacyPage() {
  return (
    <div className="bg-white min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6 mb-12">
        <Breadcrumbs />
        <div className="mt-6">
          <BackButton />
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-5xl md:text-6xl font-heading font-black tracking-tighter uppercase mb-4">Privacy Policy</h1>
        <p className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-12">Last Updated: August 15, 2026</p>
        
        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">1. Introduction</h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              At Writersthing, we respect your privacy and are committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our platform.
            </p>
            <p className="text-zinc-600 leading-relaxed mb-4">
              By accessing or using Writersthing, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">2. Information We Collect</h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              We may collect the following types of information:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-600">
              <li><strong>Personal Data:</strong> Email address, name, profile information, and payment details when you create an account, publish content, or make purchases.</li>
              <li><strong>Usage Data:</strong> Information about your interactions with the platform, including reading history, engagement metrics, IP addresses, browser types, and device information.</li>
              <li><strong>Content Data:</strong> The manuscripts, stories, and blogs you draft, upload, and publish on our platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">3. How We Use Your Information</h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              We use the collected information for various purposes, including to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-600">
              <li>Provide, maintain, and improve our platform and services.</li>
              <li>Process transactions and send related information, including confirmations and receipts.</li>
              <li>Provide deep analysis and engagement metrics to creators.</li>
              <li>Communicate with you, including sending newsletters, updates, and support messages.</li>
              <li>Monitor the usage of the platform to detect, prevent, and address technical issues or fraudulent activity.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">4. Data Sharing and Disclosure</h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              We do not sell your personal information. We may share your information in the following situations:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-zinc-600">
              <li><strong>With Service Providers:</strong> We employ third-party companies (e.g., payment processors, hosting services) to facilitate our platform, and they have access to your data only to perform these tasks on our behalf.</li>
              <li><strong>For Legal Reasons:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">5. Data Security</h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              The security of your data is important to us. We implement commercially acceptable security measures to protect your personal information and uploaded content. However, please remember that no method of transmission over the Internet or electronic storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">6. Your Data Rights</h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              Depending on your location, you may have rights regarding your personal data, including the right to access, update, or delete the information we have on you. You can manage most of your data directly through your account settings or by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">7. Changes to This Privacy Policy</h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date at the top.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 uppercase tracking-tight">8. Contact Us</h2>
            <p className="text-zinc-600 leading-relaxed mb-4">
              If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@writersthing.com" className="text-black font-bold hover:underline">privacy@writersthing.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
