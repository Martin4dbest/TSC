"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ShieldAlert, UserPlus, LogOut, Eye, EyeOff, Lock, 
  LayoutDashboard, Server, ShieldCheck, Activity 
} from "lucide-react";

const BASE_URL = "https://tsc-backend-nefz.onrender.com";

export default function SuperAdminDashboard() {
  const router = useRouter();
  
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [systemState, setSystemState] = useState("Operational");

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "superadmin") {
      router.push("/dashboard");
    }
  }, [router]);

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please re-authenticate.");
      return router.push("/");
    }

    try {
      setIsSubmitting(true);
      
      const res = await fetch(`${BASE_URL}/api/v1/admin/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          full_name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone,
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        alert(data.detail || "Failed to create administrator account");
        return;
      }

      alert("Administrative account successfully provisioned");
      setForm({ name: "", email: "", phone: "", password: "" });
    } catch (err) {
      console.error("PROVISION_ERROR:", err);
      alert("Network connection exception encountered");
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 antialiased font-sans text-[11px] flex">
      
      {/* SIDEBAR NAVIGATION SYSTEM */}
      <aside className="w-56 bg-[#090d16] border-r border-slate-800/80 p-4 flex flex-col justify-between hidden md:flex shrink-0">
        <div>
          <div className="flex items-center gap-2.5 px-1.5 py-3 mb-6 border-b border-slate-800/60">
            <ShieldCheck size={16} className="text-[#00f2fe]" />
            <div>
              <h1 className="font-black tracking-widest text-[11px] text-white">TSC CONTROL</h1>
              <p className="text-[8px] text-[#00f2fe] font-bold tracking-wider uppercase">Super Admin</p>
            </div>
          </div>

          <nav className="space-y-1">
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded text-slate-400 hover:bg-slate-800/30 hover:text-slate-200 cursor-pointer transition-all" onClick={() => router.push("/dashboard")}>
              <LayoutDashboard size={13} />
              <span className="font-medium tracking-wide">Main Dashboard</span>
            </div>
            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded bg-gradient-to-r from-[#00f2fe]/10 to-transparent text-[#00f2fe] font-bold border-l-2 border-[#00f2fe]">
              <Lock size={13} className="text-[#00f2fe]" />
              <span className="tracking-wide">Admin Provisioning</span>
            </div>
          </nav>
        </div>

        <button 
          onClick={logout}
          className="w-full flex items-center gap-2 p-2 rounded text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 font-semibold transition-all border border-rose-500/5 hover:border-rose-500/20"
        >
          <LogOut size={12} />
          Terminate Session
        </button>
      </aside>

      {/* CORE VIEWPORT INTERFACE */}
      <main className="flex-1 p-6 lg:p-8 flex flex-col justify-between max-w-4xl mx-auto w-full">
        
        <div>
          {/* HEADER ROW BAR */}
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800/60">
            <div className="flex items-center gap-2.5">
              <Activity size={14} className="text-[#38ef7d]" />
              <h1 className="text-xs font-bold tracking-wide text-slate-200 flex items-center gap-2">
                System Core Engine <span className="text-slate-600">|</span> <span className="text-[#00f2fe]">TSC Super Admin Portal</span>
              </h1>
            </div>
            <span className="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#38ef7d]/10 text-[#38ef7d] border border-[#38ef7d]/20 tracking-widest uppercase flex items-center gap-1.5 shadow-sm shadow-[#38ef7d]/5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38ef7d] inline-block animate-pulse" />
              {systemState}
            </span>
          </div>

          {/* ISOLATED ACCESS CARD CONTROLLER */}
          <div className="p-6 rounded-xl border border-slate-800 bg-[#0b111e]/60 backdrop-blur-md shadow-2xl relative overflow-hidden group">
            
            {/* Visual background ambient line to highlight workspace depth */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00f2fe] via-[#38ef7d] to-[#00f2fe]" />

            <div className="flex items-center justify-between mb-5 bg-[#040811]/90 p-3 rounded-lg border border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#00f2fe]/10 rounded border border-[#00f2fe]/20">
                  <UserPlus size={13} className="text-[#00f2fe]" />
                </div>
                <div>
                  <h2 className="font-extrabold uppercase tracking-wider text-white">Provision System Operator</h2>
                  <p className="text-[9px] text-slate-500 mt-0.5 tracking-wide">Deploys new root credential sets directly into backend nodes</p>
                </div>
              </div>
              <ShieldAlert size={14} className="text-[#ff007f] animate-pulse" />
            </div>

            <form onSubmit={createAdmin} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
                  <input 
                    required 
                    className="w-full p-2.5 bg-[#040811] border border-slate-800 rounded text-slate-200 font-mono text-[11px] focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe]/20 transition-all placeholder:text-slate-700" 
                    placeholder="Enter full name" 
                    value={form.name} 
                    onChange={e => setForm({ ...form, name: e.target.value })} 
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                  <input 
                    required 
                    type="email" 
                    className="w-full p-2.5 bg-[#040811] border border-slate-800 rounded text-slate-200 font-mono text-[11px] focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe]/20 transition-all placeholder:text-slate-700" 
                    placeholder="operator@tsc.system" 
                    value={form.email} 
                    onChange={e => setForm({ ...form, email: e.target.value })} 
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Mobile Line</label>
                  <input 
                    required 
                    className="w-full p-2.5 bg-[#040811] border border-slate-800 rounded text-slate-200 font-mono text-[11px] focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe]/20 transition-all placeholder:text-slate-700" 
                    placeholder="+234..." 
                    value={form.phone} 
                    onChange={e => setForm({ ...form, phone: e.target.value })} 
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Access Passphrase</label>
                  <div className="relative">
                    <input 
                      required 
                      type={showPassword ? "text" : "password"} 
                      className="w-full p-2.5 bg-[#040811] border border-slate-800 rounded text-slate-200 font-mono text-[11px] focus:outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe]/20 pr-10 transition-all placeholder:text-slate-700" 
                      placeholder="••••••••" 
                      value={form.password} 
                      onChange={e => setForm({ ...form, password: e.target.value })} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>
                </div>

              </div>

              <div className="flex justify-end pt-2 border-t border-slate-800/80 mt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#00f2fe] to-[#4facfe] hover:from-[#00e2ee] hover:to-[#3f9bfe] text-slate-950 font-black px-5 py-2 rounded text-[10px] tracking-widest uppercase transition-all shadow-lg shadow-[#00f2fe]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Writing Cluster Parameters..." : "Authorize Administrative Deployment"}
                </button>
              </div>

            </form>
          </div>
        </div>

        {/* COMPLIANCE UNDERLAY LABEL */}
        <footer className="mt-8 flex items-center gap-2 justify-center text-slate-600 text-[9px] font-mono tracking-wider">
          <Server size={10} />
          SECURE CHANNEL PIPELINE AUTHENTICATED // TLS 1.3
        </footer>

      </main>
    </div>
  );
}