"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Search,
  UserCircle,
  Phone,
  Mail,
  Shield,
  Loader2,
  AlertTriangle,
} from "lucide-react";

const BASE_URL = "https://tsc-backend-nefz.onrender.com";

type User = {
  full_name?: string;
  email?: string;
  phone?: string;
  role?: string;
  is_active?: boolean;
};

export default function UsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [error, setError] = useState<string>("");

  // FETCH USERS
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        if (!token) {
          setError("Authentication expired. Please login again.");
          setLoading(false);
          return;
        }

        const res = await fetch(`${BASE_URL}/api/v1/users/users/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || "Failed to fetch users");
        }

        const data = await res.json();

        console.log("RAW USERS RESPONSE:", data);

        const allUsers: User[] = Array.isArray(data)
          ? data
          : data.users || data.data || [];

        setUsers(allUsers);
        setFiltered(allUsers);
      } catch (err: any) {
        console.log("USER FETCH ERROR:", err);
        setError(err.message || "Unable to load users");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // SEARCH FILTER
  useEffect(() => {
    const q = search.toLowerCase();

    const result = users.filter((u) => {
      return (
        u.full_name?.toLowerCase()?.includes(q) ||
        u.email?.toLowerCase()?.includes(q) ||
        u.phone?.toLowerCase()?.includes(q)
      );
    });

    setFiltered(result);
  }, [search, users]);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-6">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-blue-400" />
          <h1 className="text-sm font-bold tracking-wide">
            Registered Users
          </h1>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="text-[11px] px-3 py-1 rounded bg-slate-800 hover:bg-slate-700"
        >
          Back
        </button>
      </div>

      {/* SEARCH */}
      <div className="mb-5 flex items-center gap-2 bg-[#0f172a] p-2 rounded border border-slate-800">
        <Search size={14} className="text-slate-400" />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users by name, email or phone..."
          className="bg-transparent outline-none text-xs w-full"
        />
      </div>

      {/* ERROR STATE */}
      {error && (
        <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded mb-4 text-xs">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      {/* CONTENT */}
      {loading ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="animate-spin" size={14} />
          Loading users...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-slate-500 text-sm">
          No users found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {filtered.map((user, i) => (
            <div
              key={i}
              className="p-4 rounded-lg border border-slate-800 bg-[#0b1220] hover:border-blue-500/30 transition"
            >

              {/* NAME */}
              <div className="flex items-center gap-2 mb-2">
                <UserCircle size={16} className="text-blue-400" />
                <h2 className="text-xs font-semibold">
                  {user.full_name || "Unknown User"}
                </h2>
              </div>

              {/* EMAIL */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
                <Mail size={12} />
                {user.email || "No email"}
              </div>

              {/* PHONE */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1">
                <Phone size={12} />
                {user.phone || "No phone"}
              </div>

              {/* ROLE */}
              <div className="flex items-center gap-2 text-[11px] mt-2">
                <Shield size={12} className="text-emerald-400" />
                <span className="text-emerald-400">
                  {user.role || "user"}
                </span>
              </div>

              {/* STATUS */}
              <div className="mt-2 text-[10px] text-slate-500">
                Status: {user.is_active ? "Active" : "Inactive"}
              </div>

            </div>
          ))}

        </div>
      )}
    </div>
  );
}