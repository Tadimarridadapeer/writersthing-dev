"use client";

import { motion } from "framer-motion";
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  MoreVertical,
  ArrowUpRight,
  DollarSign
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBooks: 0,
    totalRevenue: 0,
    pendingBooks: 0,
  });
  const [reviewBooks, setReviewBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const recentReports = [
    { id: "1", title: "The Dark Net", reason: "Inappropriate Content", status: "Pending", reportedBy: "User A" },
    { id: "2", title: "Quantum Dreams", reason: "Copyright Infringement", status: "Resolved", reportedBy: "User B" },
  ];

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login?redirect=/admin");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    if (parsedUser.role !== "Admin") {
      router.push("/profile");
    }
    fetchGlobalData();
  }, [router]);


  const fetchGlobalData = async () => {
    try {
      // 1. Fetch Stats
      const { count: userCount } = await supabase.from("users").select("*", { count: "exact", head: true });
      const { count: bookCount } = await supabase.from("books").select("*", { count: "exact", head: true });
      const { data: orders } = await supabase.from("orders").select("amount").eq("status", "Success");
      
      const totalRevenue = orders?.reduce((acc, order) => acc + Number(order.amount), 0) || 0;

      // 2. Fetch Books for Review
      const { data: pending, count: pendingCount } = await supabase
        .from("books")
        .select("*, authors:author_id(name)")
        .eq("status", "Review");

      setStats({
        totalUsers: userCount || 0,
        totalBooks: bookCount || 0,
        totalRevenue,
        pendingBooks: pendingCount || 0,
      });

      setReviewBooks(pending || []);
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (bookId: string) => {
    const { error } = await supabase
      .from("books")
      .update({ status: "Published" })
      .eq("id", bookId);
    
    if (!error) fetchGlobalData();
  };

  const handleReject = async (bookId: string) => {
    const { error } = await supabase
      .from("books")
      .update({ status: "Draft" })
      .eq("id", bookId);
    
    if (!error) fetchGlobalData();
  };

  if (!user) return <div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-[#FDFDFD]">
      <DashboardSidebar />
      
      <main className="flex-grow ml-64 p-12">
        <header className="flex justify-between items-start mb-16">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 mb-4">System Administration</p>
            <h1 className="text-7xl font-heading font-black tracking-ultra-tight uppercase mb-6">Central Control</h1>
            <p className="text-zinc-500 text-xl font-medium leading-relaxed italic">
              Platform Overview • Moderation, User Management, and Global Analytics.
            </p>
          </div>
          
          <div className="flex gap-12">
            <div className="text-right">
              <p className="text-5xl font-heading font-black tracking-tighter">{(stats.totalUsers / 1000).toFixed(1)}K</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Users</p>
            </div>
            <div className="text-right">
              <p className="text-5xl font-heading font-black tracking-tighter">₹{(stats.totalRevenue / 1000000).toFixed(1)}M</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Sales</p>
            </div>
          </div>
        </header>

        {/* Top Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <AdminMetricCard label="Total Users" value={stats.totalUsers.toLocaleString()} change="+12%" icon={<Users size={18} />} />
          <AdminMetricCard label="Published Books" value={stats.totalBooks.toLocaleString()} change="+5%" icon={<BookOpen size={18} />} />
          <AdminMetricCard label="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} change="+24%" icon={<DollarSign size={18} />} />
          <AdminMetricCard label="Pending Review" value={stats.pendingBooks.toString()} alert icon={<ShieldCheck size={18} />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* User Approvals */}
          <section className="bg-white border border-zinc-100 rounded-sm shadow-sm p-10">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-sm font-black uppercase tracking-widest">Manuscript Approvals</h2>
              <span className="text-[10px] font-black bg-black text-white px-3 py-1 rounded-full uppercase tracking-widest">{stats.pendingBooks} Pending</span>
            </div>
            <div className="space-y-6">
              {reviewBooks.length > 0 ? reviewBooks.map((book) => (
                <div key={book.id} className="flex items-center justify-between p-6 bg-zinc-50 border border-zinc-100 rounded-sm group hover:border-black transition-all">
                  <div>
                    <h3 className="font-heading font-bold text-lg mb-1">{book.title}</h3>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">by {book.authors?.name || "Unknown Author"} • {book.category}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleApprove(book.id)}
                      className="p-3 bg-white border border-zinc-200 text-green-600 hover:bg-green-500 hover:text-white transition-all rounded-sm shadow-sm"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleReject(book.id)}
                      className="p-3 bg-white border border-zinc-200 text-red-600 hover:bg-red-500 hover:text-white transition-all rounded-sm shadow-sm"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                </div>
              )) : (
                <p className="text-center py-10 text-zinc-300 text-[10px] font-black uppercase tracking-widest italic">All manuscripts have been moderated.</p>
              )}
            </div>
          </section>

          {/* Reports / Moderation */}
          <section className="bg-white border border-zinc-100 rounded-sm shadow-sm p-10">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-sm font-black uppercase tracking-widest">Content Moderation</h2>
              <AlertCircle size={18} className="text-zinc-300" />
            </div>
            <div className="space-y-6">
              {recentReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-6 bg-zinc-50 border border-zinc-100 rounded-sm group hover:border-black transition-all">
                  <div>
                    <h3 className="font-heading font-bold text-lg mb-1">{report.title}</h3>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Report: {report.reason}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${report.status === "Pending" ? "bg-red-100 text-red-600" : "bg-zinc-100 text-zinc-400"}`}>
                      {report.status}
                    </span>
                    <p className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest mt-2">By {report.reportedBy}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Global Sales Graph Mockup */}
        <section className="bg-white border border-zinc-100 rounded-sm shadow-sm p-10 mb-16">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest mb-2">Network Growth</h2>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest italic">New users and acquisitions per day</p>
            </div>
            <button className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 hover:opacity-60 transition-all border-b border-black pb-1">
              Export CSV <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="flex items-end justify-between h-64 gap-3 px-4">
            {[30, 45, 35, 60, 90, 100, 80, 65, 75, 85, 95, 110, 120, 105, 90].map((height, i) => (
              <div key={i} className="flex-grow flex flex-col items-center group">
                <div 
                  className={`w-full transition-all duration-700 ${i === 12 ? "bg-black" : "bg-zinc-100 group-hover:bg-zinc-200"}`}
                  style={{ height: `${height}%` }}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Footer info */}
        <footer className="pt-8 border-t border-zinc-100 flex justify-between items-center text-zinc-400">
          <p className="text-[10px] font-black uppercase tracking-widest italic">© 2026 Writersthing Control Center</p>
          <div className="flex gap-8">
            <span className="text-[10px] font-black uppercase tracking-widest hover:text-black cursor-pointer">Security Logs</span>
            <span className="text-[10px] font-black uppercase tracking-widest hover:text-black cursor-pointer">API Status</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function AdminMetricCard({ label, value, change, icon, alert }: any) {
  return (
    <div className={`p-8 border rounded-sm shadow-sm transition-all ${alert ? "bg-black text-white border-black" : "bg-white text-black border-zinc-100"}`}>
      <div className="flex justify-between items-center mb-6">
        <p className={`text-[10px] font-black uppercase tracking-widest ${alert ? "text-zinc-500" : "text-zinc-400"}`}>{label}</p>
        <div className={alert ? "text-white" : "text-zinc-200"}>{icon}</div>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-4xl font-heading font-black tracking-tighter">{value}</span>
        {change && <span className="text-[10px] font-black text-green-500">{change}</span>}
      </div>
    </div>
  );
}
