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

  // REAL backend stats (NO FAKE DATA)
  const [stats, setStats] = useState({
    trips: 0,
    users: 0,
    wallet: 0,
    alerts: 0,
  });

  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPhone, setAdminPhone] = useState("");

  /* ROLE */
  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    if (savedRole === "superadmin" || savedRole === "admin") {
      setRole(savedRole);
    }
  }, []);

  /* BACKEND STATUS */
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/");
        const data = await res.json();
        setStatus(data.message || "Online");
      } catch {
        setStatus("Offline");
      }
    };

    checkBackend();
  }, []);

  /* REAL STATS FETCH (READY FOR BACKEND ENDPOINT) */
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/api/v1/stats");

        if (!res.ok) return;

        const data = await res.json();

        setStats({
          trips: data.trips || 0,
          users: data.users || 0,
          wallet: data.wallet || 0,
          alerts: data.alerts || 0,
        });
      } catch {
        // silent fail (dashboard still works)
      }
    };

    fetchStats();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/");
  };

  const createAdmin = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: adminName,
          email: adminEmail,
          password: adminPassword,
          phone: adminPhone,
          role: "admin",
        }),
      });

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
    } catch {
      alert("Server error");
    }
  };

  const theme = darkMode
    ? "bg-[#0b0c10] text-white"
    : "bg-[#f5f7fb] text-gray-900";

  const sidebarTheme = darkMode
    ? "bg-[#0f1117] border-zinc-800"
    : "bg-white border-gray-200 shadow-md";

  return (
    <div className={`${theme} min-h-screen flex transition-all`}>

      {/* SIDEBAR */}
      <aside className={`w-64 h-screen fixed border-r p-5 ${sidebarTheme}`}>

        <h1 className="text-sm font-bold flex items-center gap-2 mb-8">
          <ShieldCheck size={16} />
          TSC CONTROL
        </h1>

        <nav className="space-y-2 text-sm">

          <NavItem icon={<LayoutDashboard size={16} />} label="Overview" route="/dashboard" />
          <NavItem icon={<Map size={16} />} label="Tracking" route="/dashboard/tracking" />
          <NavItem icon={<ShieldAlert size={16} />} label="Emergency" route="/dashboard/emergency" />
          <NavItem icon={<Users size={16} />} label="Users" route="/dashboard/users" />

          <p className="text-xs text-gray-500 mt-4">Financial</p>
          <NavItem icon={<Wallet size={16} />} label="Wallet" route="/dashboard/wallet" />
          <NavItem icon={<CreditCard size={16} />} label="Payments" route="/dashboard/payments" />

          <p className="text-xs text-gray-500 mt-4">System</p>
          <NavItem icon={<BarChart3 size={16} />} label="Analytics" route="/dashboard/analytics" />
          <NavItem icon={<History size={16} />} label="Logs" route="/dashboard/logs" />

          {role === "superadmin" && (
            <>
              <NavItem icon={<Lock size={16} />} label="Admin" route="/dashboard/admin" />
              <NavItem icon={<ServerCog size={16} />} label="Security" route="/dashboard/security" />
            </>
          )}

          <NavItem icon={<Settings size={16} />} label="Settings" route="/dashboard/settings" />
        </nav>

        {/* BOTTOM */}
        <div className="absolute bottom-5 w-52 space-y-2">

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full text-xs flex items-center gap-2 p-2 rounded bg-zinc-800/30 hover:bg-zinc-700/40"
          >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            Toggle Theme
          </button>

          <button
            onClick={handleLogout}
            className="w-full text-xs flex items-center gap-2 p-2 text-red-400 hover:bg-red-500/10 rounded"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="ml-64 flex-1 p-6">

        {/* HEADER */}
        <div className="flex justify-between mb-6 border-b border-zinc-800 pb-3">
          <h1 className="font-bold text-lg">
            {role === "superadmin"
              ? "System Core Engine"
              : "Operational Dashboard"}
          </h1>

          <span className="text-green-500 text-xs">{status}</span>
        </div>

        {/* REAL STATS */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">

          <Stat label="Trips" value={stats.trips} />
          <Stat label="Users" value={stats.users} />
          <Stat label="Wallet" value={`₦${stats.wallet}`} />
          <Stat label="Alerts" value={stats.alerts} danger />

        </div>

        {/* ACTION CARDS */}
        <div className="grid md:grid-cols-3 gap-4">
          <Action title="Tracking" desc="GPS system" />
          <Action title="Emergency" desc="SOS system" />
          <Action title="Payments" desc="Wallet engine" />
        </div>

        {/* ADMIN PANEL */}
        {role === "superadmin" && (
          <div className="mt-10 p-6 border border-red-500/30 rounded bg-red-500/5">

            <h2 className="text-red-400 mb-4">Root Admin Control</h2>

            <div className="grid md:grid-cols-2 gap-3">

              <input className="p-3 bg-zinc-900 rounded" placeholder="Name"
                value={adminName} onChange={(e) => setAdminName(e.target.value)} />

              <input className="p-3 bg-zinc-900 rounded" placeholder="Email"
                value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />

              <input className="p-3 bg-zinc-900 rounded" placeholder="Phone"
                value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} />

              <input className="p-3 bg-zinc-900 rounded" placeholder="Password"
                type="password"
                value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />

            </div>

            <button
              onClick={createAdmin}
              className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
            >
              Create Admin
            </button>
          </div>
        )}

      </main>
    </div>
  );
}

/* NAV */
function NavItem({ icon, label, route }: any) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(route)}
      className="flex items-center gap-2 p-2 rounded hover:bg-zinc-800 cursor-pointer"
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}

/* STAT */
function Stat({ label, value, danger }: any) {
  return (
    <div className="bg-zinc-900 p-4 rounded border border-zinc-800">
      <p className="text-xs text-gray-400">{label}</p>
      <h2 className={`text-lg font-bold ${danger ? "text-red-400" : ""}`}>
        {value}
      </h2>
    </div>
  );
}

/* ACTION */
function Action({ title, desc }: any) {
  return (
    <div className="bg-zinc-900 p-4 rounded border border-zinc-800 hover:border-zinc-700 transition">
      <h3 className="font-bold">{title}</h3>
      <p className="text-xs text-gray-400">{desc}</p>
    </div>
  );
}