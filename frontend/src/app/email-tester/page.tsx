"use client";

import React, { useState, useEffect } from "react";
import { notFound } from "next/navigation";

export default function EmailTesterPage() {
  const [isDev, setIsDev] = useState<boolean | null>(null);
  const [email, setEmail] = useState("");
  const [template, setTemplate] = useState("welcome");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [response, setResponse] = useState<any>(null);

  useEffect(() => {
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setResponse(null);

    try {
      const res = await fetch("/api/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, template }),
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        setStatus("success");
      } else {
        setStatus("error");
      }
      setResponse(data);
    } catch (err: any) {
      setStatus("error");
      setResponse({ error: err.message || "Failed to fetch API" });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-[#7C3AED] px-8 py-6 text-white text-center">
          <h1 className="text-2xl font-bold tracking-wide">Email Delivery Tester</h1>
          <p className="text-sm opacity-90 mt-2">Send real emails to verify Resend integration</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleSend} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Recipient Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Template
              </label>
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:border-transparent transition-all"
              >
                <option value="welcome">Welcome</option>
                <option value="otp">OTP Verification</option>
                <option value="forgot-password">Forgot Password</option>
                <option value="payment">Payment Success</option>
                <option value="receipt">Purchase Receipt</option>
                <option value="founder-invite">Founder Invite</option>
                <option value="approval">Admin Approval</option>
                <option value="rejected">Admin Rejected</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={status === "loading" || !email}
              className={`w-full py-4 rounded-lg text-white font-bold tracking-wide transition-all ${
                status === "loading" || !email
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-black hover:bg-gray-900 shadow-md"
              }`}
            >
              {status === "loading" ? "Sending via Resend..." : "Send Test Email"}
            </button>
          </form>

          {/* Status Display */}
          {status !== "idle" && status !== "loading" && (
            <div
              className={`mt-8 p-6 rounded-lg border ${
                status === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                {status === "success" ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Email Sent Successfully
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Failed to Send
                  </>
                )}
              </h3>
              
              {response?.error && (
                <p className="text-sm mt-2 opacity-90">{response.error}</p>
              )}
            </div>
          )}

          {/* Raw JSON Response Log */}
          {response && (
            <div className="mt-6">
              <h4 className="text-sm font-bold text-gray-700 mb-2">Raw Resend Response:</h4>
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-green-400 text-xs leading-relaxed font-mono">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
