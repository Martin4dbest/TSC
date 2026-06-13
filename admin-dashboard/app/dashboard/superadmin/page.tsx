"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  UserPlus,
  LogOut,
  Eye,
  EyeOff,
  Lock,
  LayoutDashboard,
  Server,
  ShieldCheck,
  Activity,
  Users,
  X,
  Mail,
  Phone,
  BadgeCheck,
} from "lucide-react";

const BASE_URL = "https://tsc-backend-nefz.onrender.com";

export default function SuperAdminDashboard() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [systemState] = useState("Operational");

  const [showUsersModal, setShowUsersModal] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [users, setUsers] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);

  useEffect(() => {
    const role = localStorage.getItem("role");

    if (role !== "superadmin") {
      router.push("/dashboard");
    }
  }, [router]);

    const fetchAllUsers = async () => {
    try {
      setLoadingUsers(true);

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Session expired");
        return;
      }

      const [usersRes, adminsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/v1/users/users/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),

        fetch(`${BASE_URL}/api/v1/admin`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      const usersData = await usersRes.json();
      console.log("USERS DATA:", usersData);

      const adminsData = await adminsRes.json();

      const allUsers = Array.isArray(usersData)
        ? usersData
        : usersData.users || usersData.data || [];

      setUsers(
        allUsers.filter(
          (user: any) =>
            user.role?.toLowerCase() === "user"
        )
      );
            setAdmins(Array.isArray(adminsData) ? adminsData : []);

      setShowUsersModal(true);
    } catch (err) {
      console.log(err);
      alert("Failed to load system users");
    } finally {
      setLoadingUsers(false);
    }
  };

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
          Authorization: `Bearer ${token}`,
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

      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
      });
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
    <div className="min-h-screen bg-[#030712] text-slate-100 antialiased font-sans text-[11px] flex flex-col md:flex-row relative">

      {/* USERS MODAL */}
      {showUsersModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="w-full max-w-5xl max-h-[95vh] bg-[#07101d] border border-slate-800 rounded-2xl shadow-2xl flex flex-col">

            {/* HEADER */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#0b111e]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                  <Users size={18} className="text-cyan-400" />
                </div>

                <div>
                  <h2 className="text-sm font-black tracking-wider text-white uppercase">
                    Registered Users & Admins
                  </h2>

                  <p className="text-[10px] text-slate-500 mt-1">
                    Live system identity registry
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowUsersModal(false)}
                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-500/30 flex items-center justify-center transition-all"
              >
                <X size={16} className="text-slate-300" />
              </button>
            </div>

            {/* CONTENT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-3 md:p-5 overflow-y-auto max-h-[calc(90vh-80px)]">

              {/* USERS */}
              <div className="bg-[#0b111e] rounded-xl border border-slate-800 overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-[#38ef7d]" />
                    <h3 className="font-extrabold tracking-wider uppercase text-[#38ef7d]">
                      📱 Registered Mobile App Users
                    </h3>
                  </div>

                  <span className="text-[10px] px-2 py-1 rounded-full bg-[#38ef7d]/10 text-[#38ef7d] border border-[#38ef7d]/20 font-bold">
                    {users.length}
                  </span>
                </div>

                <div className="divide-y divide-slate-800 overflow-y-auto">
                  {users.length === 0 ? (
                    <div className="p-6 text-center text-slate-500">
                      No registered users found
                    </div>
                  ) : (
                    users.map((user: any, index: number) => (
                      <div
                        key={index}
                        className="p-4 hover:bg-slate-800/20 transition-all"
                      >
                        <div className="flex items-start gap-3">

                          <div className="w-11 h-11 rounded-xl bg-[#38ef7d]/10 border border-[#38ef7d]/20 flex items-center justify-center text-[#38ef7d] font-black uppercase">
                            {user.full_name?.charAt(0) || "U"}
                          </div>

                          <div className="flex-1">

                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-[12px]">
                                {user.full_name || "Unknown User"}
                              </h4>

                              <span className="text-[8px] px-2 py-0.5 rounded-full bg-[#38ef7d]/10 text-[#38ef7d] border border-[#38ef7d]/20 uppercase font-bold">
                                User
                              </span>
                            </div>

                            <div className="mt-2 space-y-1.5">

                              <div className="flex items-center gap-2 text-slate-400">
                                <Mail size={11} />
                                <span>{user.email || "No email"}</span>
                              </div>

                              <div className="flex items-center gap-2 text-slate-400">
                                <Phone size={11} />
                                <span>{user.phone || "No phone"}</span>
                              </div>

                            </div>
                          </div>

                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* ADMINS */}
              <div className="bg-[#0b111e] rounded-xl border border-slate-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-cyan-400" />
                    <h3 className="font-extrabold tracking-wider uppercase text-cyan-400">
                      System Admins
                    </h3>
                  </div>

                  <span className="text-[10px] px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                    {admins.length}
                  </span>
                </div>

                <div className="divide-y divide-slate-800">
                  {admins.length === 0 ? (
                    <div className="p-6 text-center text-slate-500">
                      No administrators found
                    </div>
                  ) : (
                    admins.map((admin: any, index: number) => (
                      <div
                        key={index}
                        className="p-4 hover:bg-slate-800/20 transition-all"
                      >
                        <div className="flex items-start gap-3">

                          <div className="w-11 h-11 rounded-xl bg-[#00f2fe]/10 border border-[#00f2fe]/20 flex items-center justify-center text-[#00f2fe] font-black uppercase">
                            {admin.full_name?.charAt(0) || "A"}
                          </div>

                          <div className="flex-1">

                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-[12px]">
                                {admin.full_name || "Unknown Admin"}
                              </h4>

                              <span className="text-[8px] px-2 py-0.5 rounded-full bg-[#00f2fe]/10 text-[#00f2fe] border border-[#00f2fe]/20 uppercase font-bold flex items-center gap-1">
                                <BadgeCheck size={8} />
                                Admin
                              </span>
                            </div>

                            <div className="mt-2 space-y-1.5">

                              <div className="flex items-center gap-2 text-slate-400">
                                <Mail size={11} />
                                <span>{admin.email || "No email"}</span>
                              </div>

                              <div className="flex items-center gap-2 text-slate-400">
                                <Phone size={11} />
                                <span>{admin.phone || "No phone"}</span>
                              </div>

                            </div>
                          </div>

                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-full md:w-56 bg-[#090d16] border-b md:border-b-0 md:border-r border-slate-800/80 p-4 flex flex-col justify-between shrink-0">
        <div>

          <div className="flex items-center gap-2.5 px-1.5 py-3 mb-6 border-b border-slate-800/60">
            <ShieldCheck size={16} className="text-[#00f2fe]" />

            <div>
              <h1 className="font-black tracking-widest text-[11px] text-white">
                TSC CONTROL
              </h1>

              <p className="text-[8px] text-[#00f2fe] font-bold tracking-wider uppercase">
                Super Admin
              </p>
            </div>
          </div>

          <nav className="space-y-1">

            <div
              className="flex items-center gap-2.5 px-2.5 py-2 rounded text-slate-400 hover:bg-slate-800/30 hover:text-slate-200 cursor-pointer transition-all"
              onClick={() => router.push("/dashboard")}
            >
              <LayoutDashboard size={13} />
              <span className="font-medium tracking-wide">
                Main Dashboard
              </span>
            </div>

            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded bg-gradient-to-r from-[#00f2fe]/10 to-transparent text-[#00f2fe] font-bold border-l-2 border-[#00f2fe]">
              <Lock size={13} className="text-[#00f2fe]" />
              <span className="tracking-wide">
                Admin Provisioning
              </span>
            </div>

            <div
              onClick={fetchAllUsers}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-300 cursor-pointer transition-all mt-3 border border-transparent hover:border-cyan-500/20"
            >
              <Users size={13} />
              <span className="font-medium tracking-wide">
                View Users
              </span>
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

      {/* MAIN */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col justify-between w-full">

        <div>

          {/* HEADER */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-0 justify-between md:items-center mb-8 pb-4 border-b border-slate-800/60">

            <div className="flex items-center gap-2.5">
              <Activity size={14} className="text-[#38ef7d]" />

              <h1 className="text-xs font-bold tracking-wide text-slate-200 flex items-center gap-2">
                System Core Engine
                <span className="text-slate-600">|</span>
                <span className="text-[#00f2fe]">
                  TSC Super Admin Portal
                </span>
              </h1>
            </div>

            <span className="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#38ef7d]/10 text-[#38ef7d] border border-[#38ef7d]/20 tracking-widest uppercase flex items-center gap-1.5 shadow-sm shadow-[#38ef7d]/5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38ef7d] inline-block animate-pulse" />
              {systemState}
            </span>

          </div>

          {/* CARD */}
          <div className="p-6 rounded-xl border border-slate-800 bg-[#0b111e]/60 backdrop-blur-md shadow-2xl relative overflow-hidden group">

            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#00f2fe] via-[#38ef7d] to-[#00f2fe]" />

            <div className="flex flex-col md:flex-row gap-3 md:gap-0 md:items-center justify-between mb-5 bg-[#040811]/90 p-3 rounded-lg border border-slate-800/80">

              <div className="flex items-center gap-2">

                <div className="p-1.5 bg-[#00f2fe]/10 rounded border border-[#00f2fe]/20">
                  <UserPlus size={13} className="text-[#00f2fe]" />
                </div>

                <div>
                  <h2 className="font-extrabold uppercase tracking-wider text-white">
                    Provision System Operator
                  </h2>

                  <p className="text-[9px] text-slate-500 mt-0.5 tracking-wide">
                    Deploys new root credential sets directly into backend nodes
                  </p>
                </div>

              </div>

              <ShieldAlert size={14} className="text-[#ff007f] animate-pulse" />

            </div>

            <form onSubmit={createAdmin} className="space-y-4">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Full Name
                  </label>

                  <input
                    required
                    className="w-full p-2.5 bg-[#040811] border border-slate-800 rounded text-slate-200 font-mono text-[11px] focus:outline-none focus:border-[#00f2fe]"
                    placeholder="Enter full name"
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Email Address
                  </label>

                  <input
                    required
                    type="email"
                    className="w-full p-2.5 bg-[#040811] border border-slate-800 rounded text-slate-200 font-mono text-[11px] focus:outline-none focus:border-[#00f2fe]"
                    placeholder="operator@tsc.system"
                    value={form.email}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        email: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Mobile Line
                  </label>

                  <input
                    required
                    className="w-full p-2.5 bg-[#040811] border border-slate-800 rounded text-slate-200 font-mono text-[11px] focus:outline-none focus:border-[#00f2fe]"
                    placeholder="+234..."
                    value={form.phone}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Access Passphrase
                  </label>

                  <div className="relative">

                    <input
                      required
                      type={showPassword ? "text" : "password"}
                      className="w-full p-2.5 bg-[#040811] border border-slate-800 rounded text-slate-200 font-mono text-[11px] focus:outline-none focus:border-[#00f2fe] pr-10"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          password: e.target.value,
                        })
                      }
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(!showPassword)
                      }
                      className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? (
                        <EyeOff size={12} />
                      ) : (
                        <Eye size={12} />
                      )}
                    </button>

                  </div>
                </div>

              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center pt-4 border-t border-slate-800/80">

                <button
                  type="button"
                  onClick={fetchAllUsers}
                  disabled={loadingUsers}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-[10px] font-bold tracking-wider uppercase flex items-center gap-2 transition-all"
                >
                  <Users size={12} />
                  {loadingUsers ? "Loading..." : "View Users"}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-[#00f2fe] to-[#4facfe] hover:from-[#00e2ee] hover:to-[#3f9bfe] text-slate-950 font-black px-5 py-2 rounded text-[10px] tracking-widest uppercase transition-all shadow-lg shadow-[#00f2fe]/10 disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Writing Cluster Parameters..."
                    : "Authorize Administrative Deployment"}
                </button>

              </div>

            </form>
          </div>
        </div>

        <footer className="mt-8 flex items-center gap-2 justify-center text-slate-600 text-[9px] font-mono tracking-wider">
          <Server size={10} />
          SECURE CHANNEL PIPELINE AUTHENTICATED // TLS 1.3
        </footer>

      </main>
    </div>
  );
}