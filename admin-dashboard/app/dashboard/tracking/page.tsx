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
  MapPin,
  Clock,
} from "lucide-react";

const BASE_URL =
  "https://tsc-backend-nefz.onrender.com/api/v1";

type TrackingRecord = {
  id: number;
  user: string;
  email: string;
  phone: string;
  location: string;
  latitude?: number;
  longitude?: number;
  message: string;
  time: string;
  type: string;
  screenshot?: string | null;
};

const formatTime = (timestamp: string) => {
  if (!timestamp) return "Unknown";

  try {
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Africa/Lagos",
    }).format(new Date(timestamp));
  } catch {
    return "Unknown";
  }
};

export default function TrackingPage() {
  const router = useRouter();

  const [records, setRecords] = useState<
    TrackingRecord[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${BASE_URL}/emergency/all`
      );

      if (!res.ok) {
        throw new Error("Failed to load tracking data");
      }

      const result = await res.json();

      const data = Array.isArray(result)
        ? result
        : result?.data || [];

      const trackingUsers = data
        .filter(
          (item: any) =>
            item.type === "share_location" ||
            item.latitude ||
            item.longitude
        )
        .map((item: any) => ({
          id: item.id,

          user:
            item.full_name ||
            item.user?.full_name ||
            "Unknown User",

          phone:
            item.phone ||
            item.phone_number ||
            item.user?.phone ||
            item.user?.phone_number ||
            "No phone",

          email:
            item.email ||
            item.user?.email ||
            "No email",

          location:
            item.address ||
            "Location Available",

          latitude: item.latitude,

          longitude: item.longitude,

          message:
            item.message ||
            "Live location shared",

          time: formatTime(item.created_at),

          type: item.type || "share_location",

          screenshot:
            item.screenshot || null,
        }));

      setRecords(trackingUsers);
    } catch (err: any) {
      console.log(err);
      setError(
        err.message ||
          "Failed to load tracking information"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();

    const interval = setInterval(
      fetchTrackingData,
      5000
    );

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-6">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Map
            size={18}
            className="text-emerald-400"
          />

          <h1 className="text-sm font-bold tracking-wide">
            Live Tracking Center
          </h1>
        </div>

        <button
          onClick={() =>
            router.push("/dashboard")
          }
          className="text-[11px] px-3 py-1 rounded bg-slate-800 hover:bg-slate-700"
        >
          Back
        </button>
      </div>

      {/* STATS */}
      <div className="mb-5 p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
        <div className="text-[10px] uppercase text-slate-400 mb-1">
          Active Tracking Sessions
        </div>

        <div className="text-2xl font-bold text-emerald-400">
          {records.length}
        </div>
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
          <Loader2
            className="animate-spin"
            size={14}
          />
          Loading tracking data...
        </div>
      ) : records.length === 0 ? (
        <div className="text-slate-500 text-sm">
          No active location shares found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="p-4 rounded-lg border border-emerald-500/20 bg-[#0b1220]"
            >
              {/* USER */}
              <div className="flex items-center gap-2 mb-3">
                <User
                  size={14}
                  className="text-emerald-400"
                />

                <h2 className="text-xs font-semibold">
                  {record.user}
                </h2>
              </div>

              {/* EMAIL */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
                <Mail size={12} />
                {record.email}
              </div>

              {/* PHONE */}
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
                <Phone size={12} />
                {record.phone}
              </div>

              {/* LOCATION */}
              <div className="flex items-start gap-2 text-[11px] text-slate-300 mb-2">
                <MapPin
                  size={12}
                  className="mt-0.5 text-emerald-400"
                />

                <span>
                  {record.location}
                </span>
              </div>

              {/* TIME */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-3">
                <Clock size={12} />
                {record.time}
              </div>

              {/* TRACKING STATUS */}
              <div className="flex items-center gap-2 text-emerald-400 text-[11px] font-medium">
                <Navigation size={12} />
                LIVE LOCATION SHARED
              </div>

              {/* MESSAGE */}
              <div className="mt-3 text-[11px] text-slate-400">
                {record.message}
              </div>

              {/* MAP LINK */}
              {record.latitude &&
                record.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-3 text-[11px] text-blue-400 hover:text-blue-300"
                  >
                    View on Map →
                  </a>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}