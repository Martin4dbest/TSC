"use client";

import React, { useEffect, useState } from "react";
import { ShieldAlert, MapPin, AlertTriangle, Bell } from "lucide-react";

const API_URL = "http://10.213.38.196:8000/api/v1/emergency/all";
const UPDATE_URL = "http://10.213.38.196:8000/api/v1/emergency";

/* =========================
   TIME FIX (AFRICA/LAGOS)
========================= */
const formatTime = (timestamp: string) => {
  if (!timestamp) return "Unknown time";

  const date = new Date(timestamp + "Z");

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Africa/Lagos",
  }).format(date);
};

export default function EmergencyPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [status, setStatus] = useState("Connecting...");

  /* =========================
     FETCH ALERTS
  ========================= */
  const fetchAlerts = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error("Failed");

      const data = await res.json();

      const formatted = data.map((item: any) => ({
        id: item.id,
        user: item.full_name || "Unknown user",

        level:
          item.status === "active"
            ? "CRITICAL"
            : item.status?.toUpperCase() || "MEDIUM",

        location:
          item.latitude && item.longitude
            ? `${Number(item.latitude).toFixed(4)}, ${Number(item.longitude).toFixed(4)}`
            : "Unknown location",

        message: item.message || "Emergency Alert",

        time: formatTime(item.created_at),
      }));

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
     UPDATE ALERT STATUS (FIXED)
  ========================= */
  const updateAlertStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`${UPDATE_URL}/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) throw new Error("Update failed");

      fetchAlerts(); // refresh UI immediately
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  /* =========================
     UI COLORS (CLEAN MODERN)
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

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-zinc-100 p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <ShieldAlert size={18} />
          Emergency Control Center
        </h1>

        <span className="text-xs text-zinc-400">{status}</span>
      </div>

      {/* STATUS BAR */}
      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded mb-6 flex items-center gap-2">
        <Bell className="text-zinc-400" size={16} />
        <p className="text-xs text-zinc-400">
          Live SOS monitoring system active
        </p>
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Stat label="Active Alerts" value={alerts.length} />
        <Stat label="Response Teams" value="--" />
        <Stat label="Resolved Today" value="--" />
      </div>

      {/* ALERT LIST */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-4 rounded border bg-zinc-900 ${getAccent(alert.level)}`}
          >

            {/* TOP */}
            <div className="flex justify-between items-center">
              <span className="text-xs px-2 py-1 rounded border border-zinc-700 bg-zinc-800">
                {alert.level}
              </span>

              <span className="text-xs text-zinc-500">
                {alert.time}
              </span>
            </div>

            {/* MESSAGE */}
            <p className="text-sm mt-3 text-zinc-200">
              {alert.message}
            </p>

            {/* LOCATION */}
            <p className="flex items-center gap-2 text-xs mt-2 text-zinc-400">
              <MapPin size={12} />
              {alert.location}
            </p>

            {/* USER */}
            <p className="text-xs mt-2 text-zinc-500">
              Reported by{" "}
              <span className="text-zinc-300">{alert.user}</span>
            </p>

            {/* ACTION BUTTONS (WORKING) */}
            <div className="mt-4 flex gap-2">

              {/* 🔵 DISPATCH */}
              <button
                onClick={() =>
                  updateAlertStatus(alert.id, "dispatched")
                }
                className="bg-blue-600/20 text-blue-300 border border-blue-500/30 px-3 py-1 text-xs rounded hover:bg-blue-600/30"
              >
                Dispatch
              </button>

              {/* 🟢 RESOLVE */}
              <button
                onClick={() =>
                  updateAlertStatus(alert.id, "resolved")
                }
                className="bg-green-600/20 text-green-300 border border-green-500/30 px-3 py-1 text-xs rounded hover:bg-green-600/30"
              >
                Resolve
              </button>

              {/* 🔴 ESCALATE */}
              <button
                onClick={() =>
                  updateAlertStatus(alert.id, "escalated")
                }
                className="bg-red-600/20 text-red-300 border border-red-500/30 px-3 py-1 text-xs rounded hover:bg-red-600/30"
              >
                Escalate
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================
   STATS COMPONENT
========================= */
function Stat({ label, value }: any) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-4 rounded">
      <p className="text-xs text-zinc-500">{label}</p>
      <h2 className="text-lg font-semibold text-zinc-100">
        {value}
      </h2>
    </div>
  );
}