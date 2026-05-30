"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Map,
  Loader2,
  AlertTriangle,
  Navigation,
  User,
  Phone,
  Mail,
} from "lucide-react";

const BASE_URL = "https://tsc-backend-nefz.onrender.com";

type TrackingUser = {
  full_name?: string;
  email?: string;
  phone?: string;
  role?: string;

  // location fields (adjust based on your backend)
  latitude?: number;
  longitude?: number;
  live_location?: boolean;

  // reports
  emergency_reports?: any[];
};

export default function TrackingPage() {
  const router = useRouter();

  const [users, setUsers] = useState<TrackingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTrackingUsers = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("token");

        const res = await fetch(`${BASE_URL}/api/v1/users/users/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        const allUsers: TrackingUser[] = Array.isArray(data)
          ? data
          : data.users || data.data || [];

        // ✅ FILTER ONLY USERS WITH TRACKING DATA
        const activeTrackers = allUsers.filter((u) => {
          const hasLocation =
            (u.latitude && u.longitude) ||
            u.live_location === true;

          const hasReports =
            Array.isArray(u.emergency_reports) &&
            u.emergency_reports.length > 0;

          return hasLocation || hasReports;
        });

        setUsers(activeTrackers);
      } catch (err: any) {
        console.log(err);
        setError("Failed to load tracking data");
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingUsers();
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-6">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Map size={18} className="text-emerald-400" />
          <h1 className="text-sm font-bold tracking-wide">
            Live Tracking Users
          </h1>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="text-[11px] px-3 py-1 rounded bg-slate-800 hover:bg-slate-700"
        >
          Back
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded mb-4 text-xs">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="animate-spin" size={14} />
          Loading tracking data...
        </div>
      ) : users.length === 0 ? (
        <div className="text-slate-500 text-sm">
          No users currently sharing location or reports.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          {users.map((user, i) => (
            <div
              key={i}
              className="p-4 rounded-lg border border-emerald-500/20 bg-[#0b1220]"
            >

              {/* NAME */}
              <div className="flex items-center gap-2 mb-2">
                <User size={14} className="text-emerald-400" />
                <h2 className="text-xs font-semibold">
                  {user.full_name || "Unknown User"}
                </h2>
              </div>

              {/* CONTACT */}
              <div className="text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-2">
                  <Mail size={12} />
                  {user.email || "No email"}
                </div>

                <div className="flex items-center gap-2">
                  <Phone size={12} />
                  {user.phone || "No phone"}
                </div>
              </div>

              {/* LOCATION STATUS */}
              <div className="mt-3 flex items-center gap-2 text-emerald-400 text-[11px]">
                <Navigation size={12} />
                LIVE TRACKING ACTIVE
              </div>

              {/* REPORTS */}
              {user.emergency_reports?.length ? (
                <div className="mt-2 text-[10px] text-rose-400">
                  Reports: {user.emergency_reports.length}
                </div>
              ) : (
                <div className="mt-2 text-[10px] text-slate-500">
                  No emergency reports
                </div>
              )}
            </div>
          ))}

        </div>
      )}
    </div>
  );
}