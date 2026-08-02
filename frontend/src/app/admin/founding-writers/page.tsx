"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Eye, 
  Loader2,
  Mail,
  MapPin,
  Clock,
  ArrowLeft
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { supabase } from "@/lib/supabase";
import ApplicationModal from "./ApplicationModal";

export default function FoundingWritersAdmin() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    remaining: 100
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      router.push("/login?redirect=/admin/founding-writers");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);
    if (parsedUser.role !== "Admin") {
      router.push("/profile");
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      // Get the program details
      const { data: program } = await supabase
        .from("programs")
        .select("*")
        .eq("name", "Founding Writers")
        .single();

      if (program) {
        // Fetch all applications for this program
        const { data: apps, error } = await supabase
          .from("program_applications")
          .select("*")
          .eq("program_id", program.id)
          .order("created_at", { ascending: false });

        if (!error && apps) {
          setApplications(apps);
          
          const approved = apps.filter((a: any) => a.status === 'Approved').length;
          const rejected = apps.filter((a: any) => a.status === 'Rejected').length;
          const pending = apps.filter((a: any) => a.status === 'Pending').length;
          
          setStats({
            total: apps.length,
            approved,
            rejected,
            pending,
            remaining: Math.max(0, (program.max_capacity || 100) - program.current_count)
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch founding writers data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (appId: string) => {
    // Call our API endpoint for approval
    try {
      const res = await fetch(`/api/admin/applications/${appId}/approve`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert(data.error || "Failed to approve application");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during approval");
    }
  };

  const handleReject = async (appId: string) => {
    try {
      const res = await fetch(`/api/admin/applications/${appId}/reject`, { method: "POST" });
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert("Failed to reject application");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openApplication = (app: any) => {
    setSelectedApp(app);
    setIsModalOpen(true);
  };

  const filteredApps = applications.filter(app => 
    app.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-zinc-300" size={32} /></div>;

  return (
    <div className="flex min-h-screen bg-[#FDFDFD]">
      <DashboardSidebar />
      
      <main className="flex-grow ml-64 p-12">
        <header className="flex justify-between items-start mb-16">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 mb-4">Program Management</p>
            <h1 className="text-7xl font-heading font-black tracking-ultra-tight uppercase mb-6">Founding Writers</h1>
            <p className="text-zinc-500 text-xl font-medium leading-relaxed italic">
              Review and manage the first 100 authors joining the platform.
            </p>
          </div>
        </header>

        {/* Top Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <AdminMetricCard label="Applications" value={stats.total} />
          <AdminMetricCard label="Approved" value={stats.approved} textColor="text-green-600" />
          <AdminMetricCard label="Rejected" value={stats.rejected} textColor="text-red-600" />
          <AdminMetricCard label="Pending" value={stats.pending} textColor="text-yellow-600" />
          <AdminMetricCard label="Remaining Slots" value={stats.remaining} alert={stats.remaining < 10} />
        </div>

        {/* Search & Filters */}
        <div className="flex justify-between items-center mb-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by name, email, or status..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-zinc-200 rounded-sm focus:outline-none focus:border-black text-sm"
            />
          </div>
        </div>

        {/* Applications Table */}
        <section className="bg-white border border-zinc-100 rounded-sm shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center p-20"><Loader2 className="animate-spin text-zinc-300" size={32} /></div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 border-b border-zinc-100">
                <tr>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Applicant</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Location</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Experience</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Status</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app) => (
                  <tr key={app.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold">{app.full_name}</p>
                      <p className="text-zinc-500 text-xs">{app.email}</p>
                    </td>
                    <td className="p-4 text-zinc-600">{app.city}, {app.country}</td>
                    <td className="p-4 text-zinc-600">{app.experience}</td>
                    <td className="p-4">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => openApplication(app)}
                        className="px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors rounded-sm inline-flex items-center gap-2"
                      >
                        <Eye size={14} /> Review
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredApps.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-zinc-400 italic">No applications found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      </main>

      {/* Application Details Modal */}
      {isModalOpen && selectedApp && (
        <ApplicationModal 
          app={selectedApp} 
          onClose={() => setIsModalOpen(false)} 
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
}

function AdminMetricCard({ label, value, textColor = "text-black", alert = false }: any) {
  return (
    <div className={`p-6 border rounded-sm shadow-sm transition-all ${alert ? "border-red-200 bg-red-50" : "bg-white border-zinc-100"}`}>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${alert ? "text-red-500" : "text-zinc-400"}`}>{label}</p>
      <span className={`text-4xl font-heading font-black tracking-tighter ${textColor}`}>{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    Pending: "bg-yellow-100 text-yellow-700",
    Approved: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700"
  };
  return (
    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${styles[status] || "bg-zinc-100 text-zinc-700"}`}>
      {status}
    </span>
  );
}
