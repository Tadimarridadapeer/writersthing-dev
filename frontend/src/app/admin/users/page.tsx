"use client";

import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  User, 
  Mail, 
  Shield, 
  Edit3, 
  Trash2,
  CheckCircle2,
  XCircle
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useState } from "react";

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const users = [
    { id: "1", name: "Tadimarri Dadapeer", email: "test@gmail.com", role: "Author", status: "Active", joined: "May 1, 2026" },
    { id: "2", name: "Elena Vance", email: "elena@vance.com", role: "Author", status: "Active", joined: "May 2, 2026" },
    { id: "3", name: "John Doe", email: "john@doe.com", role: "Reader", status: "Inactive", joined: "May 10, 2026" },
    { id: "4", name: "Sarah Smith", email: "sarah@smith.com", role: "Reader", status: "Active", joined: "May 12, 2026" },
  ];

  return (
    <div className="flex min-h-screen bg-[#FDFDFD]">
      <DashboardSidebar />
      
      <main className="flex-grow ml-64 p-12">
        <header className="mb-16">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 mb-4">Administration</p>
          <h1 className="text-7xl font-heading font-black tracking-ultra-tight uppercase mb-6">User Directory</h1>
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-zinc-500 text-xl font-medium leading-relaxed italic">
              Manage all users, roles, and account statuses.
            </p>
            <div className="relative w-full md:w-96">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300" size={18} />
              <input 
                type="text" 
                placeholder="Search by name or email..." 
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
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">User</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Role</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Joined</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {users.map((user) => (
                <tr key={user.id} className="group hover:bg-zinc-50 transition-colors">
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-xs font-black">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-heading font-bold text-lg mb-1">{user.name}</h4>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${user.role === 'Author' ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-zinc-300'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{user.status}</span>
                    </div>
                  </td>
                  <td className="p-8 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    {user.joined}
                  </td>
                  <td className="p-8 text-right">
                    <div className="flex justify-end gap-3">
                      <button className="p-2 hover:bg-white rounded-sm border border-transparent hover:border-zinc-100 transition-all text-zinc-400 hover:text-black">
                        <Edit3 size={16} />
                      </button>
                      <button className="p-2 hover:bg-white rounded-sm border border-transparent hover:border-zinc-100 transition-all text-zinc-400 hover:text-red-500">
                        <Trash2 size={16} />
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
