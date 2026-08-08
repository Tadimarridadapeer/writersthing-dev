"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Search, 
  Loader2,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  Plus
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";

export default function FoundingWritersAdmin() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    accepted: 0,
    declined: 0,
    pending: 0,
    remaining: 100
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // New Invite State
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");

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
      const res = await fetch("/api/admin/founding-writers", {
        headers: { "authorization": "Bearer " + localStorage.getItem("token") }
      });
      if (res.ok) {
        const { data } = await res.json();
        setInvitations(data || []);
        
        const accepted = data.filter((a: any) => a.status === 'accepted').length;
        const declined = data.filter((a: any) => a.status === 'declined').length;
        const pending = data.filter((a: any) => a.status === 'pending').length;
        
        setStats({
          total: data.length,
          accepted,
          declined,
          pending,
          remaining: Math.max(0, 100 - (accepted + pending))
        });
      }
    } catch (err) {
      console.error("Failed to fetch founding writers data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setInviteError("Name and email are required.");
      return;
    }

    setIsInviting(true);
    try {
      const res = await fetch("/api/admin/founding-writers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authorization": "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify({ name: inviteName, email: inviteEmail })
      });

      const data = await res.json();
      if (res.ok) {
        setInviteName("");
        setInviteEmail("");
        fetchData();
      } else {
        setInviteError(data.error || "Failed to invite user");
      }
    } catch (err: any) {
      setInviteError(err.message || "An error occurred");
    } finally {
      setIsInviting(false);
    }
  };

  const handleCancelInvite = async (id: string) => {
    if (!window.confirm("Are you sure you want to cancel this invitation?")) return;
    
    try {
      const res = await fetch(`/api/admin/founding-writers?id=${id}`, {
        method: "DELETE",
        headers: { "authorization": "Bearer " + localStorage.getItem("token") }
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredInvites = invitations.filter(inv => 
    inv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.email_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inv.founder_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-zinc-300" size={32} /></div>;

  return (
    <div className="flex min-h-screen bg-[#FDFDFD]">
      <DashboardSidebar />
      
      <main className="flex-grow ml-64 p-12">
        <header className="flex justify-between items-start mb-12">
          <div className="max-w-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 mb-4">Operations</p>
            <h1 className="text-7xl font-heading font-black tracking-ultra-tight uppercase mb-6">Founding Writers</h1>
            <p className="text-zinc-500 text-xl font-medium leading-relaxed italic">
              Manage in-app invitations for the first 100 authors joining the platform.
            </p>
          </div>
        </header>

        {/* Top Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <AdminMetricCard label="Total Sent" value={stats.total} />
          <AdminMetricCard label="Accepted" value={stats.accepted} textColor="text-green-600" />
          <AdminMetricCard label="Declined" value={stats.declined} textColor="text-red-600" />
          <AdminMetricCard label="Pending" value={stats.pending} textColor="text-orange-500" />
          <AdminMetricCard label="Remaining Slots" value={stats.remaining} alert={stats.remaining < 10} />
        </div>

        {/* Invite Form */}
        <section className="bg-white border border-zinc-100 rounded-sm shadow-sm p-8 mb-12">
          <h2 className="text-sm font-black uppercase tracking-widest mb-6 border-b border-zinc-100 pb-4">Send New Invitation</h2>
          <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-grow">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Full Name</label>
              <input 
                type="text" 
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-sm focus:outline-none focus:border-black text-sm transition-colors"
                disabled={isInviting}
              />
            </div>
            <div className="flex-grow">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Email Address</label>
              <input 
                type="email" 
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-sm focus:outline-none focus:border-black text-sm transition-colors"
                disabled={isInviting}
              />
            </div>
            <div className="pt-[22px]">
              <button 
                type="submit" 
                disabled={isInviting}
                className="h-11 px-8 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors rounded-sm inline-flex items-center gap-2 disabled:opacity-50"
              >
                {isInviting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} 
                Send Invite
              </button>
            </div>
          </form>
          {inviteError && (
            <p className="mt-4 text-xs font-bold text-red-600 bg-red-50 p-3 rounded-sm border border-red-100">
              {inviteError}
            </p>
          )}
        </section>

        {/* Search & Filters */}
        <div className="flex justify-between items-center mb-6">
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

        {/* Invitations Table */}
        <section className="bg-white border border-zinc-100 rounded-sm shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center p-20"><Loader2 className="animate-spin text-zinc-300" size={32} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-50 border-b border-zinc-100">
                  <tr>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Founder #</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Name & Email</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">User Account</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Status</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Invited Date</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Accepted Date</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvites.map((inv) => (
                    <tr key={inv.id} className="border-b border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                      <td className="p-4 font-heading font-black">{inv.founder_number}</td>
                      <td className="p-4">
                        <p className="font-bold">{inv.name}</p>
                        <p className="text-zinc-500 text-xs">{inv.email_address}</p>
                      </td>
                      <td className="p-4">
                        {inv.user_id ? (
                          <span className="text-xs font-medium text-zinc-600 bg-zinc-100 px-2 py-1 rounded-sm border border-zinc-200">Linked</span>
                        ) : (
                          <span className="text-xs text-zinc-400 italic">Unregistered</span>
                        )}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={inv.status} />
                      </td>
                      <td className="p-4 text-zinc-500 text-xs">
                        {new Date(inv.invited_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-zinc-500 text-xs">
                        {inv.accepted_at ? new Date(inv.accepted_at).toLocaleDateString() : "-"}
                      </td>
                      <td className="p-4 text-right">
                        {inv.status === 'pending' && (
                          <button 
                            onClick={() => handleCancelInvite(inv.id)}
                            className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-[9px] font-black uppercase tracking-widest transition-colors rounded-sm inline-flex items-center gap-1"
                            title="Cancel Invitation"
                          >
                            <Trash2 size={12} /> Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredInvites.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-zinc-400 italic">No invitations found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
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
    pending: "bg-orange-100 text-orange-700 border border-orange-200",
    accepted: "bg-green-100 text-green-700 border border-green-200",
    declined: "bg-red-100 text-red-700 border border-red-200"
  };
  
  const icons: any = {
    pending: <Clock size={12} />,
    accepted: <CheckCircle2 size={12} />,
    declined: <XCircle size={12} />
  };

  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-sm ${styles[status] || "bg-zinc-100 text-zinc-700"}`}>
      {icons[status]} {status}
    </span>
  );
}
