"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  MapPin,
  Bell,
  Image as ImageIcon,
} from "lucide-react";

/* =========================
   BASE CONFIG (PRODUCTION SAFE)
========================= */
const BASE_URL = "https://tsc-backend-nefz.onrender.com/api/v1";

const API_URL = `${BASE_URL}/emergency/all`;
const UPDATE_URL = `${BASE_URL}/emergency`;

/* =========================
   TIME FORMAT
========================= */
const formatTime = (timestamp: string) => {
  if (!timestamp) return "Unknown time";

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
    return "Invalid time";
  }
};

/* =========================
   GEO CACHE
========================= */
const geoCache = new Map<string, string>();

/* =========================
   REVERSE GEOCODING
========================= */
const getAddressFromCoords = async (lat: any, lng: any) => {
  try {
    const latitude = Number(lat);
    const longitude = Number(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return "Invalid coordinates";
    }

    const key = `${latitude},${longitude}`;
    if (geoCache.has(key)) return geoCache.get(key)!;

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "EmergencyDashboard/1.0",
        Accept: "application/json",
      },
    });

    if (!res.ok) return "Location unavailable";

    const data = await res.json();
    const addr = data?.address || {};

    const parts = [
      addr.house_number || addr.building || "",
      addr.road || addr.residential || "",
      addr.suburb || addr.neighbourhood || "",
      addr.city || addr.town || addr.county || "",
      addr.country || "",
    ].filter(Boolean);

    const final =
      parts.length > 0
        ? parts.join(", ")
        : data?.display_name || "Unknown location";

    geoCache.set(key, final);

    return final;
  } catch {
    return "Unknown location";
  }
};

/* =========================
   MAIN COMPONENT
========================= */
export default function EmergencyPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [status, setStatus] = useState("Connecting...");
  const [showConfirm, setShowConfirm] = useState(false);

  /* =========================
     FETCH ALERTS
  ========================= */
  const fetchAlerts = async () => {
    try {
      const res = await fetch(API_URL);

      if (!res.ok) {
        setStatus("API Error");
        return;
      }

      const result = await res.json();
      const data = Array.isArray(result) ? result : result?.data || [];

      const formatted = await Promise.all(
        data.map(async (item: any) => {
          let location = "Unknown location";

          if (item.address && item.address !== "Unknown address") {
            location = item.address;
          } else if (item.latitude && item.longitude) {
            location = await getAddressFromCoords(
              item.latitude,
              item.longitude
            );
          }

          const phone =
            item.phone_number ||
            item.phone ||
            item.user?.phone_number ||
            item.user?.phone ||
            "No phone provided";

          return {
            id: item.id,
            user:
              item.full_name ||
              item.user?.full_name ||
              "Unknown user",

            phone,

            email:
              item.email ||
              item.user?.email ||
              "No email",

            level:
              item.status?.toUpperCase() === "ACTIVE"
                ? "CRITICAL"
                : item.status?.toUpperCase() || "MEDIUM",

            location,
            message: item.message || "Emergency Alert",
            time: formatTime(item.created_at),
            screenshot: item.screenshot || null,
            type: item.type || "sos",
          };
        })
      );

      setAlerts(formatted);
      setStatus("Live System");
    } catch {
      setStatus("Offline");
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, []);

  /* =========================
     UPDATE STATUS
  ========================= */
  const updateAlertStatus = async (id: number, statusValue: string) => {
    try {
      const res = await fetch(`${UPDATE_URL}/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: statusValue }),
      });

      if (!res.ok) return;

      fetchAlerts();
    } catch {}
  };

  /* =========================
     CLEAR ALL
  ========================= */
  const clearAlerts = async () => {
    try {
      const res = await fetch(`${BASE_URL}/emergency/clear`, {
        method: "DELETE",
      });

      if (!res.ok) return;

      setAlerts([]);
      setShowConfirm(false);
      fetchAlerts();
    } catch {}
  };

  /* =========================
     COLORS
  ========================= */
  const getAccent = (level: string) => {
    switch (level) {
      case "CRITICAL":
        return "border-red-500/40 text-red-300";
      case "HIGH":
        return "border-orange-500/40 text-orange-300";
      default:
        return "border-zinc-700 text-zinc-300";
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="min-h-screen bg-[#0b0b0c] text-zinc-100 p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <ShieldAlert size={18} />
          Emergency Control Center
        </h1>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400">{status}</span>

          <button
            onClick={() => setShowConfirm(true)}
            className="text-xs px-3 py-1 rounded bg-red-600/20 text-red-300 border border-red-500/30"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* STATUS */}
      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded mb-6 flex items-center gap-2">
        <Bell className="text-zinc-400" size={16} />
        <p className="text-xs text-zinc-400">
          Live SOS monitoring system active
        </p>
      </div>

      {/* ALERTS */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded border bg-zinc-900 ${getAccent(
              alert.level
            )}`}
          >
            <div className="flex justify-between">
              <span className="text-xs px-2 py-1 rounded bg-zinc-800 border border-zinc-700">
                {alert.type === "share_location"
                  ? "SHARED LOCATION"
                  : alert.level}
              </span>

              <span className="text-xs text-zinc-500">
                {alert.time}
              </span>
            </div>

            <p className="text-sm mt-3">{alert.message}</p>

            <p className="flex items-start gap-2 text-xs mt-2 text-zinc-400">
              <MapPin size={12} className="mt-0.5" />
              <span>{alert.location}</span>
            </p>

            <p className="text-xs mt-3 text-zinc-500">
              Reported by{" "}
              <span className="text-zinc-300 font-medium">
                {alert.user}
              </span>
            </p>

            <p className="text-xs mt-1 text-zinc-400">
              📞 {alert.phone}
            </p>

            <p className="text-xs mt-1 text-zinc-400">
              ✉️ {alert.email}
            </p>

            {alert.screenshot && (
              <div className="mt-4">
                <p className="text-xs text-zinc-400 mb-2 flex items-center gap-1">
                  <ImageIcon size={12} />
                  Screenshot
                </p>

                <img
                  src={alert.screenshot}
                  className="rounded border border-zinc-700 max-h-64"
                />
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <button
                onClick={() =>
                  updateAlertStatus(alert.id, "dispatched")
                }
                className="bg-blue-600/20 text-blue-300 px-3 py-1 text-xs rounded"
              >
                Dispatch
              </button>

              <button
                onClick={() =>
                  updateAlertStatus(alert.id, "resolved")
                }
                className="bg-green-600/20 text-green-300 px-3 py-1 text-xs rounded"
              >
                Resolve
              </button>

              <button
                onClick={() =>
                  updateAlertStatus(alert.id, "escalated")
                }
                className="bg-red-600/20 text-red-300 px-3 py-1 text-xs rounded"
              >
                Escalate
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CONFIRM */}
      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 p-6 rounded w-[300px]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-sm font-semibold mb-2">
              Are you sure?
            </h2>

            <p className="text-xs text-zinc-400 mb-4">
              This will clear all emergency alerts.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1 text-xs border border-zinc-700 rounded"
              >
                Cancel
              </button>

              <button
                onClick={clearAlerts}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded"
              >
                Yes, Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}