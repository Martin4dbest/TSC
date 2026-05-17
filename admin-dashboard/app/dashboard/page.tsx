"use client";

import React, { useEffect, useState } from "react";
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
  Activity,
} from "lucide-react";

const BASE_URL = "http://10.66.220.196:8000";

export default function Dashboard() {
  const router = useRouter();

  const [role, setRole] = useState<"admin" | "superadmin">("admin");
  const [darkMode, setDarkMode] = useState(true);
  const [status, setStatus] = useState("Checking systems...");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    users: 0,
    alerts: 0,
    activeAlerts: 0,
    wallet: 0,
  });

  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPhone, setAdminPhone] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [adminCount, setAdminCount] = useState(0);

  /* =========================
     ROLE
  ========================= */
  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    if (savedRole === "superadmin" || savedRole === "admin") {
      setRole(savedRole);
    }
  }, []);

  /* =========================
     BACKEND STATUS
  ========================= */
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${BASE_URL}/`);
        const data = await res.json();
        setStatus(data.message || "Online");
      } catch {
        setStatus("Offline");
      }
    };

    check();
  }, []);

  /* =========================
     FETCH STATS (FIXED)
  ========================= */
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${BASE_URL}/api/v1/emergency/stats`);

        if (!res.ok) {
          const err = await res.text();
          console.log("STATS ERROR:", err);
          return;
        }

        const data = await res.json();

        setStats({
          users: data.users ?? 0,
          alerts: data.alerts ?? 0,
          activeAlerts: data.activeAlerts ?? 0, // ✅ FIXED KEY
          wallet: data.wallet ?? 0,
        });
      } catch (err) {
        console.log("FETCH ERROR:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  /* =========================
     FETCH ADMIN COUNT
  ========================= */
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/v1/admin/count`);
        const data = await res.json();
        setAdminCount(data.total_admins ?? 0);
      } catch (err) {
        console.log("ADMIN COUNT ERROR:", err);
      }
    };

    fetchAdmins();
  }, []);

  /* =========================
     LOGOUT
  ========================= */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/");
  };

  /* =========================
     CREATE ADMIN
  ========================= */
  const createAdmin = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Session expired. Please login again.");
        router.push("/");
        return;
      }

      const res = await fetch(`${BASE_URL}/api/v1/admin/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: adminName,
          email: adminEmail,
          password: adminPassword,
          phone: adminPhone,
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
    } catch (error) {
      console.log(error);
      alert("Server error");
    }
  };

  /* =========================
     UI THEME
  ========================= */
  const theme = darkMode
    ? "bg-[#07090f] text-white"
    : "bg-[#f5f7fb] text-gray-900";

  const sidebar = darkMode
    ? "bg-[#0c0f17] border-zinc-800"
    : "bg-white border-gray-200";

  return (
    <div className={`${theme} min-h-screen flex`}>

      {/* SIDEBAR */}
      <aside className={`w-64 fixed h-screen p-5 border-r ${sidebar}`}>

        <div className="flex items-center gap-2 mb-8">
          <ShieldCheck size={18} />
          <h1 className="font-bold">TSC CONTROL</h1>
        </div>

        <nav className="space-y-2 text-sm">
          <Nav icon={<LayoutDashboard size={16} />} label="Overview" color="text-blue-400" route="/dashboard" />
          <Nav icon={<Map size={16} />} label="Tracking" color="text-green-400" route="/dashboard/tracking" />
          <Nav icon={<ShieldAlert size={16} />} label="Emergency" color="text-red-400" route="/dashboard/emergency" />
          <Nav icon={<Users size={16} />} label="Users" color="text-purple-400" route="/dashboard/users" />

          <p className="text-xs text-gray-500 mt-4">Finance</p>
          <Nav icon={<Wallet size={16} />} label="Wallet" color="text-yellow-400" route="/dashboard/wallet" />
          <Nav icon={<CreditCard size={16} />} label="Payments" color="text-pink-400" route="/dashboard/payments" />

          <p className="text-xs text-gray-500 mt-4">System</p>
          <Nav icon={<BarChart3 size={16} />} label="Analytics" color="text-cyan-400" route="/dashboard/analytics" />
          <Nav icon={<History size={16} />} label="Logs" color="text-orange-400" route="/dashboard/logs" />

          {role === "superadmin" && (
            <>
              <Nav icon={<Lock size={16} />} label="Admin" color="text-red-500" route="/dashboard/admin" />
              <Nav icon={<ServerCog size={16} />} label="Security" color="text-emerald-400" route="/dashboard/security" />
            </>
          )}

          <Nav icon={<Settings size={16} />} label="Settings" color="text-gray-400" route="/dashboard/settings" />
        </nav>

        {/* BOTTOM */}
        <div className="absolute bottom-5 w-52 space-y-2">

          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center gap-2 p-2 rounded bg-zinc-800/30 hover:bg-zinc-700/40 text-xs"
          >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            Theme
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 p-2 rounded text-red-400 hover:bg-red-500/10 text-xs"
          >
            <LogOut size={14} />
            Logout
          </button>

        </div>
      </aside>

      {/* MAIN */}
      <main className="ml-64 flex-1 p-6">

        <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Activity size={18} />
            {role === "superadmin" ? "System Core Engine" : "Operations Dashboard"}
          </h1>

          <span className="text-xs text-green-400">{status}</span>
        </div>

        {/* STATS */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Stat label="Users" value={loading ? "..." : stats.users} />
          <Stat label="Alerts" value={loading ? "..." : stats.alerts} danger />
          <Stat label="Active Emergencies" value={loading ? "..." : stats.activeAlerts} />
          <Stat label="Wallet" value={`₦${stats.wallet}`} />
        </div>

        {/* CARDS */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card title="Live Tracking" desc="GPS + Movement Engine" />
          <Card title="Emergency System" desc="SOS + Response Network" />
          <Card title="Payments" desc="Wallet + Transactions" />
        </div>

        {/* SUPER ADMIN */}
        {role === "superadmin" && (
          <div className="mt-10 p-6 border border-red-500/30 bg-red-500/5 rounded">

            <h2 className="text-red-400 mb-2">Super Admin Panel</h2>

            <div className="mb-4 flex justify-between bg-zinc-800 p-3 rounded">
              <span>Total Admins</span>
              <span className="text-green-400 font-bold">{adminCount}</span>
            </div>

            <div className="grid md:grid-cols-2 gap-3">

              <input className="p-3 bg-zinc-900 rounded" placeholder="Name"
                value={adminName} onChange={(e) => setAdminName(e.target.value)} />

              <input className="p-3 bg-zinc-900 rounded" placeholder="Email"
                value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />

              <input className="p-3 bg-zinc-900 rounded" placeholder="Phone"
                value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} />

              <div className="relative">
                <input
                  className="p-3 bg-zinc-900 rounded w-full pr-10"
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>

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

/* ================= NAV ================= */
function Nav({ icon, label, route, color }: any) {
  const router = useRouter();
  return (
    <div onClick={() => router.push(route)} className={`flex items-center gap-2 p-2 rounded hover:bg-zinc-800 cursor-pointer ${color}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}

/* ================= STAT ================= */
function Stat({ label, value, danger }: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded">
      <p className="text-xs text-gray-400">{label}</p>
      <h2 className={`text-lg font-bold ${danger ? "text-red-400" : ""}`}>{value}</h2>
    </div>
  );
}

/* ================= CARD ================= */
function Card({ title, desc }: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-xs text-gray-400">{desc}</p>
    </div>
  );
}