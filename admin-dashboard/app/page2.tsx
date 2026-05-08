"use client";

import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Map, 
  Users, 
  Bell, 
  BarChart3, 
  History, 
  Settings, 
  Sun, 
  Moon, 
  ShieldCheck,
  ArrowUpRight,
  Wallet,
  CreditCard,
  Zap,
  ShieldAlert,
  Lock
} from "lucide-react";

export default function Dashboard() {
  const [role, setRole] = useState<"admin" | "superadmin">("admin");
  const [darkMode, setDarkMode] = useState(true);
  const [status, setStatus] = useState("Checking systems...");

  useEffect(() => {
    fetch("http://127.0.0.1:8000/")
      .then((res) => res.json())
      .then((data) => setStatus(data.message))
      .catch(() => setStatus("Offline"));
  }, []);

  const themeClass = darkMode ? "dark bg-[#09090b] text-zinc-100" : "bg-gray-50 text-gray-900";

  return (
    <div className={`${themeClass} min-h-screen flex transition-colors duration-200 font-sans`}>
      
      {/* SIDEBAR - Structured based on your Services folder */}
      <aside className={`w-64 border-r p-5 hidden md:flex flex-col ${darkMode ? "bg-[#0c0c0e] border-zinc-800" : "bg-white border-gray-200"}`}>
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
            <ShieldCheck size={14} className="text-white" />
          </div>
          <h1 className="text-sm font-bold tracking-tight uppercase">TSC Control</h1>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          <SectionLabel label="Operational" />
          <NavItem icon={<LayoutDashboard size={16} />} label="Overview" active darkMode={darkMode} />
          <NavItem icon={<Map size={16} />} label="Tracking Service" darkMode={darkMode} />
          <NavItem icon={<ShieldAlert size={16} />} label="Emergency Service" darkMode={darkMode} />
          <NavItem icon={<Users size={16} />} label="User Management" darkMode={darkMode} />

          <div className="pt-4">
            <SectionLabel label="Financial" />
            <NavItem icon={<Wallet size={16} />} label="Wallet Service" darkMode={darkMode} />
            <NavItem icon={<CreditCard size={16} />} label="Payment Gateway" darkMode={darkMode} />
          </div>

          <div className="pt-4">
            <SectionLabel label="System Authority" />
            <NavItem icon={<BarChart3 size={16} />} label="Analytics" darkMode={darkMode} />
            <NavItem icon={<History size={16} />} label="Audit Logs" darkMode={darkMode} />
            {role === "superadmin" && <NavItem icon={<Lock size={16} />} label="Admin Service" darkMode={darkMode} />}
            <NavItem icon={<Settings size={16} />} label="Settings" darkMode={darkMode} />
          </div>
        </nav>

        <div className="mt-auto pt-5 border-t border-zinc-800 space-y-2">
           <button
            onClick={() => setDarkMode(!darkMode)}
            className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-[11px] font-medium transition-colors ${
              darkMode ? "hover:bg-zinc-800 text-zinc-400" : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            {darkMode ? "Switch to Light" : "Switch to Dark"}
          </button>
          
          <button
            onClick={() => setRole(role === "admin" ? "superadmin" : "admin")}
            className={`w-full text-[10px] py-2 rounded-md font-bold uppercase tracking-tighter transition-all ${
                role === "superadmin" ? "bg-red-600 text-white" : "bg-blue-600 text-white"
            }`}
          >
            Mode: {role}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className={`h-14 border-b flex items-center justify-between px-8 ${darkMode ? "bg-[#09090b]/80 border-zinc-800 backdrop-blur-md" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full ${status === "Offline" ? "bg-red-500" : "bg-emerald-500 animate-pulse"}`} />
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{status}</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">{role}</span>
                <span className="text-[11px] font-medium">Auth Service Active</span>
            </div>
            <div className="w-8 h-8 rounded bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold">
              {role[0].toUpperCase()}
            </div>
          </div>
        </header>

        <div className="p-8 overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-xl font-bold tracking-tight">
              {role === "superadmin" ? "System Core Engine" : "Operational Command"}
            </h2>
            <p className={`text-xs mt-1 ${darkMode ? "text-zinc-500" : "text-gray-500"}`}>
              Factoring data from <strong>{role === "superadmin" ? "admin_service.py" : "user_service.py"}</strong>
            </p>
          </div>

          {/* STATS GRID - Derived from your Models (trip.py, user.py, wallet.py, alert.py) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Trips" value="1,402" growth="+12%" darkMode={darkMode} />
            <StatCard label="Active Users" value="8,291" growth="+5%" darkMode={darkMode} />
            <StatCard label="Wallet Volume" value="₦2.4M" darkMode={darkMode} />
            <StatCard label="System Alerts" value="02" danger darkMode={darkMode} />
          </div>

          {/* ACTIONS GRID - Derived from your Services folder */}
          <div className="grid md:grid-cols-3 gap-6">
            <ActionCard
              title="Tracking Service"
              desc="Execute live tracking logic via tracking_service.py."
              icon={<Map size={18} className="text-blue-500" />}
              darkMode={darkMode}
            />
            <ActionCard
              title="Emergency Service"
              desc="Deploy emergency response protocols and handle alert.py triggers."
              icon={<ShieldAlert size={18} className="text-red-500" />}
              danger
              darkMode={darkMode}
            />
            <ActionCard
              title="Payment Service"
              desc="Process transactions and audit wallet_service.py logs."
              icon={<CreditCard size={18} className="text-emerald-500" />}
              darkMode={darkMode}
            />
          </div>

          {/* SUPER ADMIN RESTRICTED AREA - admin_service.py */}
          {role === "superadmin" && (
            <div className={`mt-10 rounded-xl border transition-all relative overflow-hidden ${
              darkMode ? "bg-red-950/10 border-red-900/30" : "bg-red-50 border-red-100"
            } p-8`}>
              <div className="flex items-center gap-3 mb-4">
                <Zap size={20} className="text-red-500 fill-red-500" />
                <div>
                    <h3 className="text-sm font-bold uppercase tracking-tighter text-red-500">Root Authority (admin_service.py)</h3>
                    <p className="text-[11px] text-zinc-500">Bypassing standard auth_service.py protocols.</p>
                </div>
              </div>
              
              <div className="flex gap-4 mt-6">
                <button className="text-[11px] bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-bold transition-colors">
                  SYSTEM OVERRIDE
                </button>
                <button className={`text-[11px] px-6 py-2 rounded border font-bold transition-colors ${
                  darkMode ? "border-zinc-800 hover:bg-zinc-800 text-zinc-400" : "border-red-200 hover:bg-red-100 text-red-700"
                }`}>
                  DB TRUNCATE
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* SUB-COMPONENTS */

function SectionLabel({ label }: { label: string }) {
  return <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.2em] mt-6 mb-3 px-3">{label}</p>;
}

function NavItem({ icon, label, active = false, darkMode }: any) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer text-[12px] font-medium transition-all ${
      active 
        ? "bg-blue-600 text-white" 
        : (darkMode ? "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-100" : "text-gray-500 hover:bg-gray-100 hover:text-black")
    }`}>
      {icon}
      {label}
    </div>
  );
}

function StatCard({ label, value, growth, danger, darkMode }: any) {
  return (
    <div className={`p-5 rounded-lg border ${darkMode ? "bg-[#0c0c0e] border-zinc-800" : "bg-white border-gray-200 shadow-sm"}`}>
      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-baseline justify-between">
        <h3 className={`text-2xl font-bold tracking-tighter ${danger ? "text-red-500" : "text-white"}`}>{value}</h3>
        {growth && <span className="text-[10px] text-emerald-500 font-mono">{growth}</span>}
      </div>
    </div>
  );
}

function ActionCard({ title, desc, icon, danger, darkMode }: any) {
  const cardStyles = darkMode 
    ? (danger ? "border-red-900/30 bg-[#0c0c0e] hover:border-red-500/50" : "border-zinc-800 bg-[#0c0c0e] hover:border-zinc-600") 
    : (danger ? "border-red-200 bg-white" : "border-gray-200 bg-white hover:border-blue-300 shadow-sm");

  return (
    <div className={`p-6 rounded-xl border transition-all group cursor-pointer ${cardStyles}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-lg ${darkMode ? "bg-zinc-950" : "bg-gray-50"}`}>
            {icon}
        </div>
        <ArrowUpRight size={14} className="text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <h3 className="text-sm font-bold mb-1">{title}</h3>
      <p className={`text-[11px] leading-relaxed mb-6 h-8 ${darkMode ? "text-zinc-500" : "text-gray-500"}`}>{desc}</p>
      <button className={`w-full py-2 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${
        danger ? "bg-red-600 hover:bg-red-700 text-white" : (darkMode ? "bg-zinc-800 hover:bg-zinc-700 text-white" : "bg-black hover:bg-zinc-800 text-white")
      }`}>
        Initialize Service
      </button>
    </div>
  );
}