"use client";

import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  BookOpen, 
  Eye, 
  ShieldAlert, 
  ShieldCheck,
  MoreVertical,
  ArrowUpRight
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useState } from "react";

export default function AdminContentPage() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const [contents, setContents] = useState([
    { id: "1", title: "The Art of Prompt", author: "Tadimarri Dadapeer", type: "Book", status: "Active", sales: 1450, reports: 0 },
    { id: "2", title: "Quantum Dreams", author: "Elena Vance", type: "Book", status: "Active", sales: 820, reports: 2 },
    { id: "3", title: "The Dark Net", author: "Marcus Thorne", type: "Book", status: "Flagged", sales: 12, reports: 15 },
    { id: "4", title: "Neo-Stoicism", author: "John Doe", type: "Article", status: "Active", sales: 0, reports: 0 },
  ]);

  const handleToggleStatus = (id: string) => {
    setContents(contents.map(item => 
      item.id === id 
        ? { ...item, status: item.status === 'Active' ? 'Flagged' : 'Active' }
        : item
    ));
  };

  const filteredContents = contents.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#FDFDFD]">
      <DashboardSidebar />
      
      <main className="flex-grow ml-64 p-12">
        <header className="mb-16">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 mb-4">Content Moderation</p>
          <h1 className="text-7xl font-heading font-black tracking-ultra-tight uppercase mb-6">Library Control</h1>
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-zinc-500 text-xl font-medium leading-relaxed italic">
              Review published manuscripts, articles, and monitor reports.
            </p>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
              <input 
                type="text" 
                placeholder="Search by title or author..." 
                className="w-full bg-white border border-zinc-100 py-4 pl-14 pr-8 rounded-sm text-[10px] font-black uppercase tracking-widest outline-none focus:border-black transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </header>

        <div className="bg-white border border-zinc-100 rounded-sm overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-50 bg-zinc-50/50">
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Content</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Sales</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Reports</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredContents.map((item) => (
                <tr key={item.id} className="group hover:bg-zinc-50 transition-colors">
                  <td className="p-8">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-16 bg-zinc-100 border border-zinc-200 rounded-sm flex items-center justify-center">
                        <BookOpen size={16} className="text-zinc-400" />
                      </div>
                      <div>
                        <h4 className="font-heading font-bold text-lg mb-1">{item.title}</h4>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{item.author} • {item.type}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${item.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{item.status}</span>
                    </div>
                  </td>
                  <td className="p-8 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    {item.sales.toLocaleString()} Units
                  </td>
                  <td className="p-8">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${item.reports > 10 ? 'bg-red-100 text-red-600' : 'bg-zinc-100 text-zinc-400'}`}>
                      {item.reports} Reports
                    </span>
                  </td>
                  <td className="p-8 text-right">
                    <div className="flex justify-end gap-3">
                      <button className="p-2 hover:bg-white rounded-sm border border-transparent hover:border-zinc-100 transition-all text-zinc-400 hover:text-black">
                        <Eye size={16} />
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(item.id)}
                        className="p-2 hover:bg-white rounded-sm border border-transparent hover:border-zinc-100 transition-all text-zinc-400 hover:text-red-500"
                        title={item.status === 'Active' ? 'Flag Content' : 'Approve Content'}
                      >
                        {item.status === 'Active' ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
                      </button>
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
