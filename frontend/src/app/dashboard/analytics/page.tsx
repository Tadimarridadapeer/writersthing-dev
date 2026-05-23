"use client";

import { useState, useEffect } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { TrendingUp, Users, Eye, Clock, Download, Share2, Award, ArrowUpRight } from "lucide-react";

export default function AnalyticsPage() {
  const [user, setUser] = useState<{ name: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-[#FDFDFD]">
      <DashboardSidebar />
      <main className="flex-grow ml-64 p-12">
        <header className="mb-16 flex justify-between items-end">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 mb-4">Performance Intelligence</p>
            <h1 className="text-6xl font-heading font-black tracking-ultra-tight uppercase">Analytics</h1>
          </div>
          <div className="flex bg-zinc-100 p-1 rounded-sm">
            <button className="px-6 py-2 text-[10px] font-black uppercase tracking-widest bg-white text-black shadow-sm">Last 30 Days</button>
            <button className="px-6 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black transition-all">Last Year</button>
          </div>
        </header>

        {/* Overview Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <AnalyticsCard label="Profile Views" value="48.2K" change="+24%" icon={<Eye size={20} />} />
          <AnalyticsCard label="Active Readers" value="12.4K" change="+12%" icon={<Users size={20} />} />
          <AnalyticsCard label="Avg. Reading Time" value="6:42" change="+8%" icon={<Clock size={20} />} />
          <AnalyticsCard label="Conversion Rate" value="3.8%" change="-2%" negative icon={<TrendingUp size={20} />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Main Chart Area */}
          <div className="lg:col-span-8 bg-white border border-zinc-100 p-10 rounded-sm shadow-sm">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-sm font-black uppercase tracking-widest">Reader Engagement Flow</h2>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-black rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-widest">New</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-zinc-200 rounded-full" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Returning</span>
                </div>
              </div>
            </div>
            
            {/* Professional Wave Chart Mockup */}
            <div className="h-64 flex items-end gap-1 px-4 mb-8">
              {[30, 45, 35, 60, 55, 80, 75, 90, 85, 100, 95, 110, 105, 120].map((h, i) => (
                <div key={i} className="flex-grow flex flex-col gap-1 items-center group cursor-pointer">
                  <div 
                    className="w-full bg-black/5 hover:bg-black transition-all duration-500 rounded-t-sm" 
                    style={{ height: `${h}%` }}
                  />
                  <div className="w-full bg-zinc-100 h-1 rounded-full group-hover:bg-black transition-colors" />
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-zinc-300">
              <span>May 01</span>
              <span>May 07</span>
              <span>May 14</span>
              <span>May 21</span>
              <span>May 28</span>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <div className="bg-black text-white p-10 rounded-sm shadow-xl flex-grow">
              <Award className="text-zinc-500 mb-6" size={32} />
              <h3 className="text-2xl font-heading font-black uppercase tracking-tight mb-2">Elite Creator</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-8">You are in the top 2% of writers this month.</p>
              <div className="w-full bg-zinc-800 h-1 rounded-full overflow-hidden">
                <div className="bg-white h-full w-[85%]" />
              </div>
              <p className="text-[9px] font-bold mt-4 uppercase tracking-widest">85% to Next Milestone</p>
            </div>
            
            <div className="bg-zinc-50 border border-zinc-100 p-10 rounded-sm">
              <h3 className="text-sm font-black uppercase tracking-widest mb-6">Top Traffic Sources</h3>
              <div className="space-y-4">
                <SourceRow label="Direct Network" value="45%" color="bg-black" />
                <SourceRow label="Social Media" value="30%" color="bg-zinc-400" />
                <SourceRow label="Referral" value="25%" color="bg-zinc-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Geographic & Device Stats */}
        <section>
          <h2 className="text-sm font-black uppercase tracking-widest mb-10 pb-4 border-b border-zinc-100">Regional Impact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <RegionStat city="Bangalore" density="High" growth="+15%" />
            <RegionStat city="Mumbai" density="Medium" growth="+8%" />
            <RegionStat city="New Delhi" density="Medium" growth="+12%" />
            <RegionStat city="Hyderabad" density="Low" growth="+5%" />
          </div>
        </section>
      </main>
    </div>
  );
}

function AnalyticsCard({ label, value, change, icon, negative }: any) {
  return (
    <div className="bg-white p-8 border border-zinc-100 rounded-sm shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-zinc-50 rounded-sm text-zinc-400">{icon}</div>
        <div className={`flex items-center gap-1 text-[10px] font-black ${negative ? "text-red-500" : "text-green-500"}`}>
          {change}
          <ArrowUpRight size={12} className={negative ? "rotate-90" : ""} />
        </div>
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">{label}</p>
      <p className="text-4xl font-heading font-black tracking-tighter">{value}</p>
    </div>
  );
}

function SourceRow({ label, value, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div className="w-full bg-white h-1.5 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: value }} />
      </div>
    </div>
  );
}

function RegionStat({ city, density, growth }: any) {
  return (
    <div className="flex flex-col">
      <h4 className="text-xl font-heading font-black uppercase tracking-tight mb-1">{city}</h4>
      <div className="flex items-center gap-3">
        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">{density} Density</span>
        <div className="w-1 h-1 bg-zinc-200 rounded-full" />
        <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">{growth}</span>
      </div>
    </div>
  );
}
