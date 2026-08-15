"use client";

import { useState } from "react";

export default function TestEmailPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResponse(null);
    setError(null);

    try {
      const res = await fetch("/api/test-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setResponse(data);

      if (!res.ok || !data.success) {
        setError(data.error || "An unknown error occurred.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Email Delivery Tester
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Send a real Welcome Email to verify the integration.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleTestEmail}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-black focus:border-black sm:text-sm"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || !email}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Sending..." : "Send Test Email"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-4 rounded-md bg-red-50 border border-red-200">
            <h3 className="text-sm font-medium text-red-800">Error Sending Email</h3>
            <div className="mt-2 text-sm text-red-700 break-words">
              {error}
            </div>
          </div>
        )}

        {response && response.success && (
          <div className="mt-4 p-4 rounded-md bg-green-50 border border-green-200">
            <h3 className="text-sm font-medium text-green-800">Success!</h3>
            <div className="mt-2 text-sm text-green-700">
              The test email was dispatched successfully. Check your inbox.
            </div>
          </div>
        )}

        {response && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Raw JSON Response:</h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto text-xs font-mono shadow-inner">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
