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

  const totalUsers = users.length;
  const totalAdmins = admins.length;
  const totalSuperAdmins = admins.filter(
    (a) => a.role === "superadmin"
  ).length;

  const fetchAllUsers = async () => {
    try {
      setLoadingUsers(true);

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Session expired");
        return;
      }

      const [usersRes, adminsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/v1/users`, {
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
      const adminsData = await adminsRes.json();

      setUsers(Array.isArray(usersData) ? usersData : []);
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
    <div className="min-h-screen bg-[#030712] text-slate-100 antialiased font-sans text-[11px] flex relative">

      {/* USERS MODAL */}
      {showUsersModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-[#07101d] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">

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

                  <p className="text-[10px] text-slate-400 mt-1">
                    Users: {totalUsers} | Admins: {totalAdmins} | Super Admins: {totalSuperAdmins}
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 p-5 max-h-[75vh] overflow-y-auto">

              {/* USERS */}
              <div className="bg-[#0b111e] rounded-xl border border-slate-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-[#38ef7d]" />
                    <h3 className="font-extrabold tracking-wider uppercase text-[#38ef7d]">
                      Registered Users
                    </h3>
                  </div>

                  <span className="text-[10px] px-2 py-1 rounded-full bg-[#38ef7d]/10 text-[#38ef7d] border border-[#38ef7d]/20 font-bold">
                    {users.length}
                  </span>
                </div>

                <div className="divide-y divide-slate-800">
                  {users.length === 0 ? (
                    <div className="p-6 text-center text-slate-500">
                      No registered users found
                    </div>
                  ) : (
                    users.map((user: any, index: number) => {
                      const computedName =
                        user.full_name ||
                        `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                        user.username ||
                        user.name ||
                        "Unknown User";

                      const computedPhone =
                        user.phone || user.phone_number || user.mobile || "No phone";

                      const computedEmail = user.email || "No email";

                      return (
                        <div key={index} className="p-4 hover:bg-slate-800/20 transition-all">
                          <div className="flex items-start gap-3">
                            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-black uppercase">
                              {computedName.charAt(0) || "U"}
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-white text-[12px]">
                                  {computedName}
                                </h4>

                                <span className="text-[8px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 uppercase font-bold">
                                  User
                                </span>
                              </div>

                              <div className="mt-2 space-y-1.5">
                                <div className="flex items-center gap-2 text-slate-400">
                                  <Mail size={11} />
                                  <span>{computedEmail}</span>
                                </div>

                                <div className="flex items-center gap-2 text-slate-400">
                                  <Phone size={11} />
                                  <span>{computedPhone}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
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
                      <div key={index} className="p-4 hover:bg-slate-800/20 transition-all">
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
      <aside className="w-56 bg-[#090d16] border-r border-slate-800/80 p-4 flex flex-col justify-between hidden md:flex shrink-0">
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
              <span>Main Dashboard</span>
            </div>

            <div className="flex items-center gap-2.5 px-2.5 py-2 rounded bg-gradient-to-r from-[#00f2fe]/10 to-transparent text-[#00f2fe] font-bold border-l-2 border-[#00f2fe]">
              <Lock size={13} />
              <span>Admin Provisioning</span>
            </div>

            <div
              onClick={fetchAllUsers}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded text-slate-400 hover:bg-cyan-500/10 hover:text-cyan-300 cursor-pointer transition-all mt-3"
            >
              <Users size={13} />
              <span>View Users</span>
            </div>

            <div className="mt-3 text-[10px] text-slate-500 px-2">
              Users: {totalUsers} <br />
              Admins: {totalAdmins} <br />
              Super Admins: {totalSuperAdmins}
            </div>
          </nav>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center gap-2 p-2 rounded text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 font-semibold transition-all"
        >
          <LogOut size={12} />
          Terminate Session
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6 lg:p-8 max-w-4xl mx-auto w-full">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <Activity size={14} className="text-[#38ef7d]" />
            <h1 className="text-xs font-bold text-slate-200">
              TSC Super Admin Portal
            </h1>
          </div>

          <span className="text-[9px] font-extrabold px-2 py-1 rounded-full bg-[#38ef7d]/10 text-[#38ef7d]">
            {systemState}
          </span>
        </div>

        <div className="p-6 rounded-xl border border-slate-800 bg-[#0b111e]/60">
          <form onSubmit={createAdmin} className="space-y-4">
            <input
              placeholder="Full Name"
              className="w-full p-2 bg-[#040811] border border-slate-800 rounded"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              placeholder="Email"
              className="w-full p-2 bg-[#040811] border border-slate-800 rounded"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <input
              placeholder="Phone"
              className="w-full p-2 bg-[#040811] border border-slate-800 rounded"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="w-full p-2 bg-[#040811] border border-slate-800 rounded"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={fetchAllUsers}
                className="px-4 py-2 bg-slate-800 rounded"
              >
                View Users
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-cyan-500 text-black font-bold rounded"
              >
                {isSubmitting ? "Loading..." : "Create Admin"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}