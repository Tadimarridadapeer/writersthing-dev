"use client";

import { useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit3, 
  Eye, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import Link from "next/link";

export default function ContentPage() {
  const [activeType, setActiveType] = useState("All");

  const contents = [
    { id: 1, title: "The Digital Stoic", type: "Ebook", category: "Philosophy", status: "Published", date: "May 12, 2024", views: "12.4K", revenue: "₹45,290" },
    { id: 2, title: "Modern Scribes", type: "Article", category: "Culture", status: "Review", date: "May 10, 2024", views: "2.1K", revenue: "₹0" },
    { id: 3, title: "Algorithms of Desire", type: "Article", category: "Technology", status: "Published", date: "May 05, 2024", views: "18.9K", revenue: "₹12,400" },
    { id: 4, title: "The Ghost in the Machine", type: "Ebook", category: "Fiction", status: "Draft", date: "May 01, 2024", views: "0", revenue: "₹0" },
    { id: 5, title: "Digital Ethics 101", type: "Article", category: "Ethics", status: "Published", date: "Apr 28, 2024", views: "5.6K", revenue: "₹2,100" },
  ];

  return (
    <div className="flex min-h-screen bg-[#FDFDFD]">
      <DashboardSidebar />
      <main className="flex-grow ml-64 p-12">
        <header className="mb-16 flex justify-between items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 mb-4">Content Repository</p>
            <h1 className="text-6xl font-heading font-black tracking-ultra-tight uppercase">My Content</h1>
          </div>
          <Link 
            href="/write"
            className="flex items-center gap-3 px-8 py-4 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl"
          >
            <Plus size={16} /> New Manuscript
          </Link>
        </header>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-10">
          <div className="flex bg-zinc-100 p-1 rounded-sm w-full md:w-auto">
            {["All", "Ebooks", "Articles", "Drafts"].map((type) => (
              <button 
                key={type}
                onClick={() => setActiveType(type)}
                className={`flex-grow md:flex-initial px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeType === type ? "bg-white text-black shadow-sm" : "text-zinc-400 hover:text-black"}`}
              >
                {type}
              </button>
            ))}
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-grow md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
              <input 
                type="text" 
                placeholder="Search manuscripts..."
                className="w-full bg-white border border-zinc-100 rounded-sm py-3 pl-12 pr-4 text-xs font-medium outline-none focus:border-black transition-all"
              />
            </div>
            <button className="p-3 bg-white border border-zinc-100 rounded-sm text-zinc-400 hover:text-black hover:border-black transition-all">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white border border-zinc-100 rounded-sm overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-50 bg-zinc-50/50">
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Title & Category</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Performance</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Last Modified</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {contents.map((item) => (
                <tr key={item.id} className="group hover:bg-zinc-50/80 transition-colors">
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-16 bg-zinc-100 border border-zinc-200 rounded-sm flex items-center justify-center text-[10px] font-black uppercase text-zinc-300">
                        {item.type === "Ebook" ? "PDF" : "TXT"}
                      </div>
                      <div>
                        <h4 className="font-heading font-bold text-lg tracking-tight mb-1">{item.title}</h4>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{item.type} • {item.category}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-8">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="p-8">
                    <div className="flex gap-8">
                      <div>
                        <p className="text-xs font-black">{item.views}</p>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase">Reads</p>
                      </div>
                      <div>
                        <p className="text-xs font-black">{item.revenue}</p>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase">Revenue</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{item.date}</p>
                  </td>
                  <td className="p-8 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ActionBtn icon={<Edit3 size={16} />} label="Edit" />
                      <ActionBtn icon={<Eye size={16} />} label="View" />
                      <ActionBtn icon={<Trash2 size={16} />} label="Delete" danger />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }: any) {
  const styles: any = {
    Published: "bg-green-50 text-green-600 border-green-100",
    Review: "bg-orange-50 text-orange-600 border-orange-100",
    Draft: "bg-zinc-100 text-zinc-500 border-zinc-200",
  };

  const icons: any = {
    Published: <CheckCircle2 size={12} />,
    Review: <Clock size={12} />,
    Draft: <AlertCircle size={12} />,
  };

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-full text-[9px] font-black uppercase tracking-widest ${styles[status]}`}>
      {icons[status]}
      {status}
    </span>
  );
}

function ActionBtn({ icon, label, danger }: any) {
  return (
    <button 
      className={`p-2.5 rounded-sm border transition-all ${danger ? "hover:bg-red-50 hover:border-red-100 text-zinc-400 hover:text-red-500" : "hover:bg-white border-transparent hover:border-zinc-200 text-zinc-400 hover:text-black"}`}
      title={label}
    >
      {icon}
    </button>
  );
}
