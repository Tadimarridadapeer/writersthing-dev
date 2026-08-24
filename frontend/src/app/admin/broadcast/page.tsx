"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Megaphone, Send, CheckCircle2, AlertCircle } from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";

export default function AdminBroadcastPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.replace("/login?redirect=/admin/broadcast");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    if (parsedUser.role !== "Admin") {
      router.replace("/profile");
    }
  }, [router]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);
    setStatus(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ message: message.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send broadcast");
      }

      setStatus({ type: "success", text: "Successfully broadcasted message to all users!" });
      setMessage("");
    } catch (err: any) {
      console.error(err);
      setStatus({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setIsSending(false);
    }
  };

  if (!user || user.role !== "Admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex">
      <DashboardSidebar />
      <main className="flex-1 p-8 md:p-12 overflow-y-auto">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-2">
            <Megaphone size={28} className="text-zinc-900" />
            <h1 className="text-3xl font-serif font-bold text-zinc-900 tracking-tight">Broadcast Message</h1>
          </div>
          <p className="text-sm text-zinc-500 mb-8">
            Send a direct notification to all registered users on Writer's Thing.
          </p>

          <form onSubmit={handleBroadcast} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            {status && (
              <div className={"flex items-center gap-2 p-4 rounded-lg mb-6 text-sm font-medium " + (
                status.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
              )}>
                {status.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                {status.text}
              </div>
            )}

            <div className="mb-6">
              <label htmlFor="message" className="block text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">
                Message Content
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Important announcement..."
                rows={5}
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg focus:bg-white focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all text-sm resize-y"
                required
              />
              <p className="text-xs text-zinc-400 mt-2">
                This message will appear in the notification dropdown for every user.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSending || !message.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white text-xs font-black uppercase tracking-widest rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                "Sending..."
              ) : (
                <>
                  <Send size={16} /> Send Broadcast
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
