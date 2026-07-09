"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  BarChart3, 
  BookCopy, 
  Library, 
  Settings,
  Plus,
  LogOut
} from "lucide-react";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/login");
  };

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const userRole = user?.role || "Reader";

  const authorMenu = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/dashboard" },
    { name: "Analytics", icon: <BarChart3 size={20} />, href: "/dashboard/analytics" },
    { name: "My Publications", icon: <BookCopy size={20} />, href: "/dashboard/content" },
    { name: "Settings", icon: <Settings size={20} />, href: "/dashboard/settings" },
  ];

  const readerMenu = [
    { name: "Dashboard", icon: <LayoutDashboard size={20} />, href: "/dashboard" },
    { name: "My Publications", icon: <BookCopy size={20} />, href: "/dashboard/content" },
    { name: "My Library", icon: <Library size={20} />, href: "/dashboard/library" },
    { name: "Marketplace", icon: <Library size={20} />, href: "/marketplace" },
    { name: "Settings", icon: <Settings size={20} />, href: "/dashboard/settings" },
  ];

  const adminMenu = [
    { name: "Overview", icon: <LayoutDashboard size={20} />, href: "/admin" },
    { name: "Users", icon: <BarChart3 size={20} />, href: "/admin/users" },
    { name: "Content", icon: <BookCopy size={20} />, href: "/admin/content" },
    { name: "Payouts", icon: <Library size={20} />, href: "/admin/payouts" },
    { name: "Settings", icon: <Settings size={20} />, href: "/dashboard/settings" },
  ];

  const menuItems = userRole === "Admin" ? adminMenu : (userRole === "Author" ? authorMenu : readerMenu);

  const userInitial = user?.name?.charAt(0) || "A";

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 bg-white border-r border-zinc-100 flex flex-col p-6 z-50">
      <div className="flex flex-col gap-1 mb-12">
        <span className="text-3xl font-[family-name:var(--font-bodoni-moda)] tracking-tight text-black">
          Writer's Thing
        </span>
        <div>
          <h1 className="text-sm font-black uppercase tracking-tighter leading-none mt-2">Writer Studio</h1>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Creator Pro</p>
        </div>
      </div>

      <nav className="flex-grow space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-sm text-sm font-bold transition-all ${
                isActive 
                  ? "bg-black text-white shadow-lg" 
                  : "text-zinc-400 hover:text-black hover:bg-zinc-50"
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-8 border-t border-zinc-100 flex flex-col gap-6">
        {userRole === "Author" && (
          <Link 
            href="/write"
            className="w-full bg-black text-white py-4 rounded-sm font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl"
          >
            <Plus size={16} /> Create New Post
          </Link>
        )}
        
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black text-white flex items-center justify-center rounded-full text-xs font-black overflow-hidden border border-zinc-100">
              {user?.avatar_url || user?.user_metadata?.avatar_url ? (
                <img 
                  src={user.avatar_url || user?.user_metadata?.avatar_url} 
                  className="w-full h-full object-cover" 
                  alt="Avatar"
                />
              ) : (
                userInitial
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">
                {user?.name || "Anonymous"}
              </span>
              <button 
                onClick={handleLogout}
                className="text-[9px] font-bold text-zinc-400 hover:text-black uppercase tracking-widest text-left transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="text-zinc-400 hover:text-black transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
