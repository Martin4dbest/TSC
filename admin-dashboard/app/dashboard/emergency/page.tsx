"use client";

import React, { useEffect, useState } from "react";
import { MapPin, X, ShieldAlert, Trash2 } from "lucide-react";

const BASE_URL = "https://tsc-backend-nefz.onrender.com/api/v1";
const API_URL = `${BASE_URL}/emergency/all`;
const UPDATE_URL = `${BASE_URL}/emergency`;

const formatTime = (timestamp: any) => {
  if (!timestamp) return "Unknown time";
  try {
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Africa/Lagos",
    }).format(new Date(timestamp));
  } catch {
    return "Invalid time";
  }
};

type Alert = {
  id: number;
  user: string;
  phone: string;
  email: string;
  location: string;
  message: string;
  time: string;
  safety_score: number;
  risk_level: string;
  status: string;
  escalated_to?: string | null;
};

export default function EmergencyPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [status, setStatus] = useState("Connecting...");
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);
  const [modalType, setModalType] = useState<"dispatch" | "resolve" | "escalate" | null>(null);
  const [selectedAgency, setSelectedAgency] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const agencies = ["Police", "Fire Service", "Ambulance", "Civil Defence", "NDLEA"];

  const fetchAlerts = async () => {
    try {
      const res = await fetch(API_URL, { cache: "no-store" });
      const data = await res.json();
      const formatted: Alert[] = (Array.isArray(data) ? data : data?.data || []).map(
        (item: any) => ({
          id: item.id,
          user: item.full_name || "Unknown",
          phone: item.phone || "N/A",
          email: item.email || "N/A",
          location: item.address || "Unknown",
          message: item.message || "Emergency Alert",
          time: formatTime(item.created_at),
          safety_score: item.safety_score ?? 100,
          risk_level: item.risk_level ?? "LOW",
          status: item.status || "pending",
          escalated_to: item.escalated_to || null,
        })
      );

      setAlerts(formatted);
      setStatus("LIVE");
    } catch {
      setStatus("OFFLINE");
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 4000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id: number, payload: any) => {
    await fetch(`${UPDATE_URL}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    await fetchAlerts();
    setActiveAlert(null);
    setModalType(null);
    setSelectedAgency("");
  };

  const clearAlerts = async () => {
    await fetch(`${BASE_URL}/emergency/clear`, {
      method: "DELETE",
    });
    setAlerts([]);
    setShowClearConfirm(false);
  };

  const getAccent = (risk: string) => {
    switch (risk) {
      case "CRITICAL":
        return "border-red-500/40 bg-red-950/20 text-red-200";
      case "HIGH":
        return "border-orange-500/40 bg-orange-950/20 text-orange-200";
      case "MEDIUM":
        return "border-yellow-500/40 bg-yellow-950/10 text-yellow-200";
      default:
        return "border-zinc-800 bg-zinc-900/50 text-zinc-300";
    }
  };

  const getStatus = (s: string) => {
    switch (s?.toLowerCase()) {
      case "resolved":
        return "text-emerald-400 font-semibold";
      case "dispatched":
        return "text-blue-400 font-semibold";
      case "escalated":
        return "text-red-400 font-semibold";
      case "unresolved":
        return "text-amber-400 font-semibold";
      default:
        return "text-zinc-400";
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-red-500" size={20} />
          <h1 className="font-bold text-base">Emergency Control Center</h1>
        </div>

        <div className="flex gap-4 items-center">
          {/* LIVE BEACON INDICATOR */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded">
            <span className="relative flex h-2 w-2">
              {status === "LIVE" ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </>
              ) : (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </>
              )}
            </span>
            <span className={`text-xs font-bold uppercase tracking-wider ${status === "LIVE" ? "text-emerald-400" : "text-red-400"}`}>
              {status}
            </span>
          </div>

          {/* CLEAR BUTTON */}
          <button
            onClick={() => setShowClearConfirm(true)}
            className="flex items-center gap-1.5 text-xs bg-red-950/30 text-red-400 hover:bg-red-950/50 px-3 py-1.5 rounded border border-red-500/20 transition-colors"
          >
            <Trash2 size={13} /> Clear
          </button>
        </div>
      </div>

      {/* ALERTS FEED */}
      <div className="space-y-4">
        {alerts.map((a) => (
          <div key={a.id} className={`p-4 rounded border ${getAccent(a.risk_level)}`}>
            <div className="flex justify-between items-center">
              <span className={`text-xs uppercase bg-black/30 px-2 py-0.5 rounded border border-zinc-800 ${getStatus(a.status)}`}>
                {(a.status || "PENDING").toUpperCase()}
              </span>
              <span className="text-xs text-zinc-500">{a.time}</span>
            </div>

            {/* MESSAGE RED BADGE */}
            <div className="mt-3">
              <span className="inline-block bg-red-950/40 text-red-300 border border-red-500/20 px-2 py-1 rounded text-xs">
                {a.message}
              </span>
            </div>

            <div className="mt-3 space-y-1 text-xs text-zinc-400">
              <p>Safety Score: <b className="text-zinc-200">{a.safety_score}</b></p>
              <p className="flex gap-1.5 items-center text-zinc-300">
                <MapPin size={12} className="text-zinc-500" /> {a.location}
              </p>
              <p className="text-zinc-300">
                <span className="font-medium text-white">{a.user}</span> | {a.phone}
              </p>
              <p className="text-zinc-500">{a.email}</p>
            </div>

            {a.escalated_to && (
              <p className="text-xs text-red-400 mt-2 bg-red-950/20 border border-red-900/20 px-2 py-1 rounded">
                🚨 Escalated to: <b>{a.escalated_to}</b>
              </p>
            )}

            {/* ACTIONS */}
            <div className="flex gap-2 mt-4 pt-2 border-t border-zinc-900">
              <button
                onClick={() => {
                  setActiveAlert(a);
                  setModalType("dispatch");
                }}
                className="text-xs px-3 py-1 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded transition-colors"
              >
                Dispatch
              </button>

              <button
                onClick={() => {
                  setActiveAlert(a);
                  setModalType("resolve");
                }}
                className="text-xs px-3 py-1 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded transition-colors"
              >
                Resolve
              </button>

              <button
                onClick={() => {
                  setActiveAlert(a);
                  setModalType("escalate");
                }}
                className="text-xs px-3 py-1 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 rounded transition-colors"
              >
                Escalate
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CLEAR CONFIRM MODAL */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-5 rounded w-[320px] border border-zinc-800 shadow-xl">
            <h2 className="text-sm font-bold text-white mb-2">
              ⚠️ Confirm Clear All Alerts
            </h2>
            <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
              This will permanently delete all emergency alerts from the system. You cannot recover them.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 border border-zinc-800 rounded hover:bg-zinc-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={clearAlerts}
                className="px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Yes, Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION MODAL */}
      {activeAlert && modalType && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-5 rounded w-[320px] border border-zinc-800 shadow-xl">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-zinc-800">
              <b className="text-xs uppercase tracking-wider text-zinc-400">{modalType} Action</b>
              <X className="text-zinc-500 hover:text-white cursor-pointer" size={16} onClick={() => { setActiveAlert(null); setModalType(null); }} />
            </div>

            {modalType === "dispatch" && (
              <button
                onClick={() => updateStatus(activeAlert.id, { status: "dispatched" })}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 text-xs font-semibold rounded transition-colors"
              >
                CONFIRM DISPATCH
              </button>
            )}

            {modalType === "resolve" && (
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(activeAlert.id, { status: "resolved" })}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 text-xs font-semibold rounded transition-colors"
                >
                  RESOLVED
                </button>
                <button
                  onClick={() => updateStatus(activeAlert.id, { status: "unresolved" })}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 text-xs font-semibold rounded transition-colors"
                >
                  UNRESOLVED
                </button>
              </div>
            )}

            {modalType === "escalate" && (
              <>
                <select
                  className="w-full p-2 bg-black border border-zinc-800 outline-none rounded text-xs text-zinc-200 mb-3"
                  value={selectedAgency}
                  onChange={(e) => setSelectedAgency(e.target.value)}
                >
                  <option value="">Select Agency</option>
                  {agencies.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>

                <button
                  disabled={!selectedAgency}
                  onClick={() =>
                    updateStatus(activeAlert.id, {
                      status: "escalated",
                      escalated_to: selectedAgency,
                    })
                  }
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 text-xs font-semibold rounded disabled:opacity-40 transition-colors"
                >
                  ESCALATE
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}