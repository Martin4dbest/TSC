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
  const [superAdmins, setSuperAdmins] = useState<any[]>([]);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "superadmin") {
      router.push("/dashboard");
    }
  }, [router]);

  const totalUsers = users.length;
  const totalAdmins = admins.length;
  const totalSuperAdmins = superAdmins.length;

  const fetchAllUsers = async () => {
    try {
      setLoadingUsers(true);

      const token = localStorage.getItem("token");
      if (!token) {
        alert("Session expired");
        return;
      }

      const res = await fetch(`${BASE_URL}/api/v1/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!Array.isArray(data)) {
        alert("Invalid server response");
        return;
      }

      const normalUsers = data.filter((u) => u.role === "user");
      const adminUsers = data.filter((u) => u.role === "admin");
      const superAdminUsers = data.filter((u) => u.role === "superadmin");

      setUsers(normalUsers);
      setAdmins(adminUsers);
      setSuperAdmins(superAdminUsers);

      setShowUsersModal(true);
    } catch (err) {
      console.log(err);
      alert("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired");
      router.push("/");
      return;
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
        alert(data.detail || "Failed to create admin");
        return;
      }

      alert("Admin created successfully");

      setForm({
        name: "",
        email: "",
        phone: "",
        password: "",
      });
    } catch (err) {
      console.log(err);
      alert("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex">

      {/* MODAL */}
      {showUsersModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-5xl bg-[#07101d] rounded-xl border border-slate-800">

            <div className="flex justify-between items-center p-4 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold">Users Registry</h2>
                <p className="text-[10px] text-slate-400">
                  Users: {totalUsers} | Admins: {totalAdmins} | SuperAdmins: {totalSuperAdmins}
                </p>
              </div>

              <button onClick={() => setShowUsersModal(false)}>
                <X />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 max-h-[70vh] overflow-y-auto">

              {/* USERS */}
              <div className="border border-slate-800 rounded-lg p-3">
                <h3 className="text-green-400 font-bold mb-2">
                  Users ({users.length})
                </h3>

                {users.map((u, i) => (
                  <div key={i} className="p-2 border-b border-slate-800">
                    <p>{u.full_name || u.email}</p>
                    <p className="text-xs text-slate-400">{u.phone}</p>
                  </div>
                ))}
              </div>

              {/* ADMINS */}
              <div className="border border-slate-800 rounded-lg p-3">
                <h3 className="text-cyan-400 font-bold mb-2">
                  Admins ({admins.length})
                </h3>

                {admins.map((a, i) => (
                  <div key={i} className="p-2 border-b border-slate-800">
                    <p>{a.full_name || a.email}</p>
                    <p className="text-xs text-slate-400">{a.phone}</p>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-60 bg-[#0b111e] border-r border-slate-800 p-4 hidden md:flex flex-col justify-between">
        <div>
          <h1 className="font-bold text-cyan-400">TSC CONTROL</h1>

          <div className="mt-6 space-y-3">
            <button onClick={() => router.push("/dashboard")}>
              Dashboard
            </button>

            <button onClick={fetchAllUsers}>
              View Users ({totalUsers + totalAdmins + totalSuperAdmins})
            </button>
          </div>
        </div>

        <button onClick={logout} className="text-red-400">
          Logout
        </button>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-6">

        <h2 className="text-lg font-bold mb-4">
          Super Admin Panel
        </h2>

        <div className="bg-[#0b111e] p-4 rounded-xl border border-slate-800">

          <form onSubmit={createAdmin} className="space-y-3">

            <input
              className="w-full p-2 bg-black border border-slate-700"
              placeholder="Full Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              className="w-full p-2 bg-black border border-slate-700"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <input
              className="w-full p-2 bg-black border border-slate-700"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />

            <div className="relative">
              <input
                className="w-full p-2 bg-black border border-slate-700"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-cyan-500 text-black px-4 py-2 rounded"
            >
              {isSubmitting ? "Creating..." : "Create Admin"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}