"use client";

import React, { useState, useEffect } from "react";
import { notFound } from "next/navigation";

const TEMPLATES = [
  { id: "welcome", name: "Welcome" },
  { id: "otp", name: "OTP" },
  { id: "forgot-password", name: "Forgot Password" },
  { id: "payment-success", name: "Payment Success" },
  { id: "receipt", name: "Receipt" },
  { id: "founder-invite", name: "Founder Invite" },
  { id: "admin-approval", name: "Approval" },
  { id: "admin-rejected", name: "Rejected" },
  { id: "recommended-books", name: "Recommended Books (Dynamic)" },
];

export default function EmailPreviewPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>("welcome");
  const [isDev, setIsDev] = useState<boolean | null>(null);

  useEffect(() => {
    // Basic client-side check. In Next.js, process.env.NODE_ENV is embedded at build time.
    if (process.env.NODE_ENV !== "development") {
      setIsDev(false);
    } else {
      setIsDev(true);
    }
  }, []);

  if (isDev === false) {
    return notFound();
  }

  if (isDev === null) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="flex h-screen flex-col md:flex-row bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm z-10 overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Email Preview</h1>
          <p className="text-sm text-gray-500 mt-1">Development Only</p>
        </div>
        <div className="p-4 space-y-2">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-150 text-sm font-medium ${
                selectedTemplate === template.id
                  ? "bg-[#7C3AED] text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm z-10">
          <h2 className="text-lg font-semibold text-gray-800 capitalize">
            {TEMPLATES.find(t => t.id === selectedTemplate)?.name} Template
          </h2>
          <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
            /preview/{selectedTemplate}
          </div>
        </div>
        
        {/* Iframe Container */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="w-full h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col">
            <iframe
              src={`/preview/${selectedTemplate}`}
              className="w-full h-full border-0"
              title="Email Preview"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
