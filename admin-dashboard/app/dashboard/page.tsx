"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  Users,
  BarChart3,
  History,
  Settings,
  Sun,
  Moon,
  ShieldCheck,
  Wallet,
  CreditCard,
  ShieldAlert,
  Lock,
  LogOut,
  ServerCog,
} from "lucide-react";

export default function Dashboard() {
  const router = useRouter();

  const [role, setRole] = useState<"admin" | "superadmin">("admin");
  const [darkMode, setDarkMode] = useState(true);
  const [status, setStatus] = useState("Checking systems...");

  /* ADMIN STATES */
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPhone, setAdminPhone] = useState("");

  /* LOAD ROLE */
  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    if (savedRole === "superadmin" || savedRole === "admin") {
      setRole(savedRole);
    }
  }, []);

  /* BACKEND STATUS */
  useEffect(() => {
    fetch("http://127.0.0.1:8000/")
      .then((res) => res.json())
      .then((data) => setStatus(data.message))
      .catch(() => setStatus("Offline"));
  }, []);

  /* LOGOUT */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/");
  };

  /* CREATE ADMIN */
  const createAdmin = async () => {
    try {
      const res = await fetch(
        "http://127.0.0.1:8000/api/v1/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: adminName,
            email: adminEmail,
            password: adminPassword,
            phone: adminPhone,
            role: "admin",
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || "Failed to create admin");
        return;
      }

      alert("Admin created successfully");

      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      setAdminPhone("");
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const themeClass = darkMode
    ? "bg-[#09090b] text-zinc-100"
    : "bg-gray-50 text-gray-900";

  return (
    <div className={`${themeClass} min-h-screen flex font-sans`}>

      {/* SIDEBAR */}
      <aside
        className={`w-64 border-r p-5 hidden md:flex flex-col ${
          darkMode ? "bg-[#0c0c0e] border-zinc-800" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
            <ShieldCheck size={14} className="text-white" />
          </div>
          <h1 className="text-sm font-bold uppercase">TSC Control</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <SectionLabel label="Operational" darkMode={darkMode} />

          <NavItem icon={<LayoutDashboard size={16} />} label="Overview" active darkMode={darkMode} />
          <NavItem icon={<Map size={16} />} label="Tracking Service" darkMode={darkMode} />
          <NavItem icon={<ShieldAlert size={16} />} label="Emergency Service" darkMode={darkMode} />
          <NavItem icon={<Users size={16} />} label="User Management" darkMode={darkMode} />

          <SectionLabel label="Financial" darkMode={darkMode} />
          <NavItem icon={<Wallet size={16} />} label="Wallet Service" darkMode={darkMode} />
          <NavItem icon={<CreditCard size={16} />} label="Payment Gateway" darkMode={darkMode} />

          <SectionLabel label="System Authority" darkMode={darkMode} />
          <NavItem icon={<BarChart3 size={16} />} label="Analytics" darkMode={darkMode} />
          <NavItem icon={<History size={16} />} label="Audit Logs" darkMode={darkMode} />

          {role === "superadmin" && (
            <>
              <NavItem icon={<Lock size={16} />} label="Admin Service" darkMode={darkMode} />
              <NavItem icon={<ServerCog size={16} />} label="Security Center" darkMode={darkMode} />
            </>
          )}

          <NavItem icon={<Settings size={16} />} label="Settings" darkMode={darkMode} />
        </nav>

        {/* FOOTER */}
        <div className="mt-auto space-y-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full flex items-center gap-2 text-xs px-3 py-2 rounded ${
              darkMode ? "hover:bg-zinc-800" : "hover:bg-gray-100"
            }`}
          >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            Toggle Theme
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-xs px-3 py-2 rounded text-red-500 hover:bg-red-500/10"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6">

        {/* HEADER */}
        <div className="flex justify-between mb-6">
          <h1 className="text-xl font-bold">
            {role === "superadmin" ? "System Core Engine" : "Operational Dashboard"}
          </h1>
          <span className="text-xs text-green-500">{status}</span>
        </div>

        {/* METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Trips" value="1,402" sub="+12.5% growth" darkMode={darkMode} />
          <StatCard label="Active Users" value="8,291" sub="+4.2% growth" darkMode={darkMode} />
          <StatCard label="Wallet Volume" value="₦2.4M" sub="+0.8% movement" darkMode={darkMode} />
          <StatCard label="Emergency Alerts" value="02" sub="Critical incidents" danger darkMode={darkMode} />
        </div>

        {/* ACTIONS */}
        <div className="grid md:grid-cols-3 gap-6">
          <ActionCard title="Tracking Engine" desc="Real-time GPS trip monitoring system" icon={<Map size={18} className="text-blue-500" />} darkMode={darkMode} />
          <ActionCard title="Emergency Response" desc="SOS alert & incident dispatch system" icon={<ShieldAlert size={18} className="text-red-500" />} darkMode={darkMode} />
          <ActionCard title="Payment System" desc="Wallet, recharge & transaction engine" icon={<CreditCard size={18} className="text-emerald-500" />} darkMode={darkMode} />
        </div>

        {/* SECURITY CENTER */}
        {role === "superadmin" && (
          <div className={`mt-8 p-6 border rounded-xl ${darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white border-gray-200"}`}>
            <h2 className="text-sm font-bold mb-4">Security Center</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard label="Failed Logins" value="03" sub="Last 24 hours" danger darkMode={darkMode} />
              <StatCard label="System Integrity" value="99.9%" sub="Healthy" darkMode={darkMode} />
              <StatCard label="Active Admins" value="04" sub="Online" darkMode={darkMode} />
            </div>
          </div>
        )}

        {/* SUPER ADMIN PANEL (REFINED) */}
        {role === "superadmin" && (
          <div className={`mt-10 p-6 border rounded-xl ${
            darkMode ? "bg-red-950/10 border-red-900/30" : "bg-red-50 border-red-200"
          }`}>

            <h2 className="text-sm font-bold text-red-500 mb-4">
              Root Admin Control
            </h2>

            {/* REDUCED CLEAN FORM */}
            <div className="grid md:grid-cols-2 gap-3">
              <input placeholder="Full Name" value={adminName} onChange={(e) => setAdminName(e.target.value)} className="p-3 rounded bg-zinc-900 text-white" />
              <input placeholder="Email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="p-3 rounded bg-zinc-900 text-white" />
              <input placeholder="Phone" value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} className="p-3 rounded bg-zinc-900 text-white" />
              <input type="password" placeholder="Password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="p-3 rounded bg-zinc-900 text-white" />
            </div>

            <button
              onClick={createAdmin}
              className="mt-4 bg-blue-600 px-6 py-2 rounded text-white text-sm"
            >
              Create Admin
            </button>
          </div>
        )}

      </main>
    </div>
  );
}

/* COMPONENTS */
function SectionLabel({ label, darkMode }: any) {
  return <p className={`text-[10px] mt-4 ${darkMode ? "text-zinc-500" : "text-gray-500"}`}>{label}</p>;
}

function NavItem({ icon, label, active, darkMode }: any) {
  return (
    <div className={`flex items-center gap-2 p-2 rounded ${
      active ? "bg-blue-600 text-white" : darkMode ? "text-zinc-400" : "text-gray-700"
    }`}>
      {icon}
      {label}
    </div>
  );
}

function StatCard({ label, value, sub, danger, darkMode }: any) {
  return (
    <div className={`p-4 border rounded ${darkMode ? "bg-zinc-900 border-zinc-800" : "bg-white"}`}>
      <p className="text-xs text-zinc-400">{label}</p>
      <h2 className={`text-lg font-bold ${danger ? "text-red-500" : ""}`}>{value}</h2>
      <p className="text-[10px] text-zinc-500">{sub}</p>
    </div>
  );
}

function ActionCard({ title, desc, icon }: any) {
  return (
    <div className="p-5 border rounded bg-zinc-900">
      <div className="mb-3">{icon}</div>
      <h3 className="font-bold text-sm">{title}</h3>
      <p className="text-xs text-zinc-500">{desc}</p>
    </div>
  );
}