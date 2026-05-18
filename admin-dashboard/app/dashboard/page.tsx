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
  Eye,
  EyeOff,
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
     FETCH DATA (FIXED ADMIN & USER COUNT)
  ========================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch admin count first
        let currentAdminCount = 0;
        try {
          const adminRes = await fetch(`${BASE_URL}/api/v1/admin/count`);
          const adminData = await adminRes.json();
          // Checks both common backend response patterns (total_admins or admin_count)
          currentAdminCount = adminData.total_admins ?? adminData.admin_count ?? 0;
          setAdminCount(currentAdminCount);
        } catch (err) {
          console.log("ADMIN COUNT ERROR:", err);
        }

        // 2. Fetch general stats
        const res = await fetch(`${BASE_URL}/api/v1/emergency/stats`);
        if (!res.ok) {
          console.log("STATS ERROR:", await res.text());
          return;
        }
        const data = await res.json();

        // 3. Subtract admins from total users to show ONLY true users
        const totalUsers = data.users ?? 0;
        const onlyUsersNumber = totalUsers - currentAdminCount;

        setStats({
          users: onlyUsersNumber < 0 ? 0 : onlyUsersNumber,
          alerts: data.alerts ?? 0,
          activeAlerts: data.activeAlerts ?? 0,
          wallet: data.wallet ?? 0,
        });
      } catch (err) {
        console.log("FETCH ERROR:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setAdminCount((prev) => prev + 1);
      setStats((prev) => ({ ...prev, users: prev.users - 1 }));

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
     INTERNATIONAL PREMIUM THEMING
  ========================= */
  const theme = darkMode
    ? "bg-[#030712] text-slate-100 antialiased"
    : "bg-[#f8fafc] text-slate-900 antialiased";

  const sidebar = darkMode
    ? "bg-[#0b0f19] border-slate-900 shadow-xl"
    : "bg-white border-slate-200/80 shadow-sm";

  const cardStyle = darkMode
    ? "bg-[#0f172a] border-slate-800/80 hover:border-blue-500/30 shadow-md"
    : "bg-white border-slate-200 hover:border-blue-500/30 shadow-sm";

  return (
    <div className={`${theme} min-h-screen flex font-sans text-[11px]`}>

      {/* SIDEBAR */}
      <aside className={`w-56 fixed h-screen p-4 border-r flex flex-col justify-between transition-all duration-200 z-10 ${sidebar}`}>
        <div>
          <div className="flex items-center gap-2.5 px-1.5 py-2.5 mb-5 border-b border-slate-800/40">
            <ShieldCheck size={15} className="text-blue-500" />
            <h1 className="font-bold tracking-wider text-[11px] text-slate-200">TSC CONTROL</h1>
          </div>

          <nav className="space-y-0.5">
            <Nav icon={<LayoutDashboard size={13} />} label="Overview" color="text-blue-400" route="/dashboard" active />
            <Nav icon={<Map size={13} />} label="Tracking" color="text-emerald-400" route="/dashboard/tracking" />
            <Nav icon={<ShieldAlert size={13} />} label="Emergency" color="text-rose-400" route="/dashboard/emergency" />
            <Nav icon={<Users size={13} />} label="Users" color="text-violet-400" route="/dashboard/users" />

            <p className="text-[9px] font-bold text-slate-500 px-2 pt-4 pb-1 uppercase tracking-widest">Finance</p>
            <Nav icon={<Wallet size={13} />} label="Wallet" color="text-amber-400" route="/dashboard/wallet" />
            <Nav icon={<CreditCard size={13} />} label="Payments" color="text-fuchsia-400" route="/dashboard/payments" />

            <p className="text-[9px] font-bold text-slate-500 px-2 pt-4 pb-1 uppercase tracking-widest">System</p>
            <Nav icon={<BarChart3 size={13} />} label="Analytics" color="text-cyan-400" route="/dashboard/analytics" />
            <Nav icon={<History size={13} />} label="Logs" color="text-orange-400" route="/dashboard/logs" />

            {role === "superadmin" && (
              <>
                <p className="text-[9px] font-bold text-rose-400 px-2 pt-4 pb-1 uppercase tracking-widest">Management</p>
                <Nav icon={<Lock size={13} />} label="Admin" color="text-rose-500" route="/dashboard/admin" />
                <Nav icon={<ServerCog size={13} />} label="Security" color="text-emerald-400" route="/dashboard/security" />
              </>
            )}

            <div className="pt-2">
              <Nav icon={<Settings size={13} />} label="Settings" color="text-slate-400" route="/dashboard/settings" />
            </div>
          </nav>
        </div>

        {/* BOTTOM OPTION PANEL */}
        <div className="space-y-1 pt-3 border-t border-slate-800/50">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center gap-2 p-2 rounded hover:bg-slate-800/30 text-[11px] font-medium transition-colors text-slate-400 hover:text-slate-200"
          >
            {darkMode ? <Sun size={12} className="text-amber-400" /> : <Moon size={12} className="text-indigo-600" />}
            Theme
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 p-2 rounded text-rose-400 hover:bg-rose-500/10 text-[11px] font-medium transition-colors"
          >
            <LogOut size={12} />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT SURFACE */}
      <main className="ml-56 flex-1 p-6 lg:p-8 transition-all duration-200">

        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800/30">
          <h1 className="text-xs font-semibold flex items-center gap-2 text-slate-200">
            <Activity size={14} className="text-blue-500" />
            {role === "superadmin" ? "System Core Engine" : "Operations Dashboard"}
          </h1>

          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wider uppercase">{status}</span>
        </div>

        {/* STATS MATRIX */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Stat label="Users" value={loading ? "..." : stats.users} cardStyle={cardStyle} />
          <Stat label="Alerts" value={loading ? "..." : stats.alerts} cardStyle={cardStyle} danger />
          <Stat label="Active Emergencies" value={loading ? "..." : stats.activeAlerts} cardStyle={cardStyle} />
          <Stat label="Wallet" value={`₦${stats.wallet.toLocaleString()}`} cardStyle={cardStyle} />
        </div>

        {/* ACTION CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card title="Live Tracking" desc="GPS + Movement Engine" cardStyle={cardStyle} />
          <Card title="Emergency System" desc="SOS + Response Network" cardStyle={cardStyle} />
          <Card title="Payments" desc="Wallet + Transactions" cardStyle={cardStyle} />
        </div>

        {/* SUPER ADMIN COMPONENT WORKSPACE */}
        {role === "superadmin" && (
          <div className="mt-6 p-5 rounded-lg border border-rose-500/20 bg-rose-500/[0.02]">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-rose-400 mb-4">Super Admin Panel</h2>

            

            <form onSubmit={createAdmin} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input required className="p-2 bg-[#060b13] border border-slate-800 rounded text-xs focus:outline-none focus:border-slate-700 text-slate-300 transition-colors placeholder:text-slate-600" placeholder="Name"
                  value={adminName} onChange={(e) => setAdminName(e.target.value)} />

                <input required type="email" className="p-2 bg-[#060b13] border border-slate-800 rounded text-xs focus:outline-none focus:border-slate-700 text-slate-300 transition-colors placeholder:text-slate-600" placeholder="Email"
                  value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />

                <input required className="p-2 bg-[#060b13] border border-slate-800 rounded text-xs focus:outline-none focus:border-slate-700 text-slate-300 transition-colors placeholder:text-slate-600" placeholder="Phone"
                  value={adminPhone} onChange={(e) => setAdminPhone(e.target.value)} />

                <div className="relative">
                  <input
                    required
                    className="p-2 bg-[#060b13] border border-slate-800 rounded text-xs focus:outline-none focus:border-slate-700 w-full pr-10 text-slate-300 transition-colors placeholder:text-slate-600"
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-400"
                  >
                    {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-1.5 rounded text-[11px] transition-colors shadow-md shadow-blue-900/10"
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}

/* ================= COMPONENT LABELS ================= */
function Nav({ icon, label, route, color, active }: any) {
  const router = useRouter();
  return (
    <div 
      onClick={() => router.push(route)} 
      className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded cursor-pointer transition-all ${
        active 
          ? "bg-blue-600/10 text-blue-400 font-semibold" 
          : "text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
      }`}
    >
      <div className={active ? "text-blue-400" : color}>{icon}</div>
      <span className="tracking-wide">{label}</span>
    </div>
  );
}

function Stat({ label, value, danger, cardStyle }: any) {
  return (
    <div className={`p-3.5 rounded-lg border transition-all duration-200 ${cardStyle}`}>
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">{label}</p>
      <h2 className={`text-sm font-bold tabular-nums ${danger ? "text-rose-400" : "text-slate-100"}`}>{value}</h2>
    </div>
  );
}

function Card({ title, desc, cardStyle }: any) {
  return (
    <div className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${cardStyle}`}>
      <h3 className="font-semibold text-slate-200 mb-0.5 text-[11px] tracking-wide">{title}</h3>
      <p className="text-[10px] text-slate-500 leading-normal">{desc}</p>
    </div>
  );
}