"use client";

import { useState, useEffect, useRef } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { User, Mail, Globe, Lock, Bell, Shield, Camera, CreditCard, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { uploadAvatar } from "@/lib/avatar";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("Profile");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Auto-hide toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleAvatarClick = () => {
    if (!uploading) fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setToast(null);

    try {
      console.log("Settings Upload - Selected file:", file.name, file.size);
      const publicUrl = await uploadAvatar(file, user.id);
      
      if (publicUrl) {
        // Sync local page state
        const updatedUser = { ...user, avatar_url: publicUrl };
        setUser(updatedUser);
        
        // Sync localStorage fallback
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        setToast({ message: "Profile picture updated successfully!", type: "success" });
      }
    } catch (err: any) {
      console.error("Settings Upload - Error:", err);
      setToast({ message: err.message || "Failed to upload image.", type: "error" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FDFDFD]">
      <DashboardSidebar />
      <main className="flex-grow ml-64 p-12">
        <header className="mb-16">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-zinc-400 mb-4">Account Preferences</p>
          <h1 className="text-6xl font-heading font-black tracking-ultra-tight uppercase">Settings</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Navigation Tabs */}
          <div className="lg:col-span-3 flex flex-col gap-2">
            <SettingsTab icon={<User size={18} />} label="Profile" active={activeTab === "Profile"} onClick={() => setActiveTab("Profile")} />
            <SettingsTab icon={<CreditCard size={18} />} label="Bank Account" active={activeTab === "Bank Account"} onClick={() => setActiveTab("Bank Account")} />
            <SettingsTab icon={<Lock size={18} />} label="Security" active={activeTab === "Security"} onClick={() => setActiveTab("Security")} />
            <SettingsTab icon={<Bell size={18} />} label="Notifications" active={activeTab === "Notifications"} onClick={() => setActiveTab("Notifications")} />
          </div>

          {/* Form Content */}
          <div className="lg:col-span-9 max-w-2xl">
            <AnimatePresence mode="wait">
              {activeTab === "Profile" && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <section className="mb-12">
                    <h2 className="text-sm font-black uppercase tracking-widest mb-8 pb-4 border-b border-zinc-100">Public Profile</h2>
                    
                    <div className="flex items-center gap-8 mb-10">
                      <div className="relative group cursor-pointer" onClick={handleAvatarClick} title="Click to upload profile photo">
                        <div className="w-24 h-24 bg-zinc-100 rounded-full flex items-center justify-center text-3xl font-black border border-zinc-200 overflow-hidden relative">
                          {user?.avatar_url ? (
                            <img src={user.avatar_url} className="w-full h-full object-cover" />
                          ) : (
                            user?.name?.charAt(0) || "D"
                          )}
                          {uploading && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                              <Loader2 className="animate-spin text-white mb-1" size={16} />
                              <span className="text-[6px] font-black uppercase tracking-widest text-zinc-300">Uploading...</span>
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera size={20} className="text-white" />
                        </div>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="image/png, image/jpeg, image/jpg, image/webp" 
                          onChange={handleFileChange} 
                          disabled={uploading}
                        />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-none mb-2">Profile Picture</h3>
                        <p className="text-xs text-zinc-400 font-medium italic">PNG or JPG, max 2MB. Overwrites existing photo.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField label="Full Name" value={user?.name || "Dadapeer"} />
                      <InputField label="Email Address" value={user?.email || "test@gmail.com"} />
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-3">Professional Bio</label>
                        <textarea 
                          className="w-full bg-zinc-50 border border-zinc-100 rounded-sm p-5 text-sm font-medium outline-none focus:border-black transition-all min-h-[120px] resize-none"
                          placeholder="Tell the world about your writing journey..."
                          defaultValue="Passionate writer and digital philosopher."
                        />
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}

              {activeTab === "Bank Account" && (
                <motion.div
                  key="bank"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <section className="mb-12">
                    <h2 className="text-sm font-black uppercase tracking-widest mb-8 pb-4 border-b border-zinc-100">Monetization Details</h2>
                    <p className="text-xs text-zinc-400 italic mb-10">All earnings from your book sales will be directly transferred to this account.</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InputField label="Account Holder Name" placeholder="As per bank records" />
                      <InputField label="Bank Name" placeholder="e.g. HDFC Bank" />
                      <InputField label="Account Number" placeholder="0000 0000 0000 00" />
                      <InputField label="IFSC Code" placeholder="HDFC0001234" />
                    </div>

                    <div className="mt-12 p-8 bg-zinc-50 border border-zinc-100 rounded-sm">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-8 h-8 bg-black text-white flex items-center justify-center rounded-full">
                          <CreditCard size={16} />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest">Instant Payouts</h4>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed font-medium">Writersthing uses direct bank transfers for authors. Ensure your details are correct to avoid payment delays. Standard platform commission of 10% applies to all sales.</p>
                    </div>
                  </section>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="pt-8 flex gap-4">
              <button className="px-10 py-4 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] hover:opacity-90 transition-all shadow-xl">
                Save Changes
              </button>
              <button className="px-10 py-4 bg-zinc-100 text-zinc-400 text-[10px] font-black uppercase tracking-[0.3em] hover:text-black transition-all">
                Discard
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className={`fixed bottom-10 right-10 z-[200] px-8 py-5 shadow-2xl border flex items-center gap-4 ${
              toast.type === "success" 
                ? "bg-black border-zinc-800 text-white" 
                : "bg-red-50 border-red-100 text-red-600"
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingsTab({ icon, label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-4 px-6 py-4 rounded-sm text-xs font-black uppercase tracking-widest transition-all ${active ? "bg-black text-white shadow-lg" : "text-zinc-400 hover:text-black hover:bg-zinc-50"}`}
    >
      {icon}
      {label}
    </button>
  );
}

function InputField({ label, value, placeholder }: any) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{label}</label>
      <input 
        type="text" 
        defaultValue={value}
        placeholder={placeholder}
        className="w-full bg-zinc-50 border border-zinc-100 rounded-sm px-5 py-4 text-sm font-medium outline-none focus:border-black transition-all placeholder:text-zinc-300"
      />
    </div>
  );
}

function SocialLink({ platform, handle }: any) {
  return (
    <div className="flex items-center justify-between p-5 bg-zinc-50 border border-zinc-100 rounded-sm">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-white border border-zinc-100 flex items-center justify-center rounded-sm font-black text-[10px]">
          {platform.charAt(0)}
        </div>
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">{platform}</h4>
          <p className="text-xs font-medium text-zinc-400">{handle}</p>
        </div>
      </div>
      <button className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-black">Disconnect</button>
    </div>
  );
}
