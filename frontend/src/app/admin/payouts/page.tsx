"use client";

import { motion } from "framer-motion";
import { 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  User,
  CreditCard,
  Search
} from "lucide-react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useState } from "react";

export default function AdminPayoutsPage() {
  const payouts = [
    { id: "1", author: "Tadimarri Dadapeer", amount: "₹12,450", status: "Pending", requested: "2 days ago", bank: "HDFC Bank •••• 4242" },
    { id: "2", author: "Elena Vance", amount: "₹8,100", status: "Processed", requested: "5 days ago", bank: "ICICI Bank •••• 9876" },
    { id: "3", author: "Marcus Thorne", amount: "₹15,900", status: "Pending", requested: "1 day ago", bank: "SBI Bank •••• 1122" },
  ];

  return (
    <div className="flex min-h-screen bg-[#FDFDFD]">
      <DashboardSidebar />
      
      <main className="flex-grow ml-64 p-12">
        <header className="mb-16">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 mb-4">Financials</p>
          <h1 className="text-7xl font-heading font-black tracking-ultra-tight uppercase mb-6">Payouts</h1>
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-zinc-500 text-xl font-medium leading-relaxed italic">
              Manage author earnings and royalty distribution.
            </p>
            <div className="flex gap-4">
               <div className="text-right px-8 py-4 bg-zinc-50 border border-zinc-100 rounded-sm">
                  <p className="text-3xl font-heading font-black tracking-tighter">₹28,350</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Total Pending</p>
               </div>
            </div>
          </div>
        </header>

        <div className="bg-white border border-zinc-100 rounded-sm overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-zinc-50 bg-zinc-50/50">
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Author & Bank</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Amount</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-400">Requested</th>
                <th className="p-8 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {payouts.map((payout) => (
                <tr key={payout.id} className="group hover:bg-zinc-50 transition-colors">
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-100 rounded-sm flex items-center justify-center">
                        <User size={18} className="text-zinc-400" />
                      </div>
                      <div>
                        <h4 className="font-heading font-bold text-lg mb-1">{payout.author}</h4>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{payout.bank}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8">
                    <span className="text-xl font-heading font-black tracking-tight">{payout.amount}</span>
                  </td>
                  <td className="p-8">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${payout.status === 'Processed' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{payout.status}</span>
                    </div>
                  </td>
                  <td className="p-8 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    {payout.requested}
                  </td>
                  <td className="p-8 text-right">
                    <button className={`px-6 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all ${payout.status === 'Pending' ? 'bg-black text-white hover:scale-105 shadow-lg' : 'bg-zinc-100 text-zinc-300 cursor-not-allowed'}`}>
                      {payout.status === 'Pending' ? 'Process Payout' : 'Processed'}
                    </button>
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
