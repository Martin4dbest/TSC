"use client";

import React, { useEffect, useState } from "react";
import { MessageSquare, Sun, Moon, Phone, User, Calendar, CheckCircle, Trash2 } from "lucide-react";

const BASE_URL = "https://tsc-backend-nefz.onrender.com/api/v1";
const FEEDBACK_URL = `${BASE_URL}/emergency/feedback`; 

type Feedback = {
  id: number;
  full_name: string;
  phone?: string | null;
  phone_number?: string | null; 
  phoneNumber?: string | null;  
  outcome: "rescued" | "helped" | "not_helped";
  feedback: string;
  created_at: string;
};

export default function EmergencyFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);

  // Core background fetch logic
  const fetchFeedbacks = async (showLoadingState = false) => {
    try {
      if (showLoadingState) setLoading(true);

      const res = await fetch(FEEDBACK_URL);
      
      if (!res.ok) {
        console.warn(`[Dashboard Fetch Notice]: API returned status code ${res.status}`);
        return;
      }
      
      const data = await res.json();

      // Extract raw data format
      const rawList: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.feedbacks)
        ? data.feedbacks
        : [];

      // Force phone properties and raw timestamps directly to the UI rendering keys
      const normalized: Feedback[] = rawList.map((item: any) => {
        const resolvedPhone = item.phone || item.phone_number || item.phoneNumber || "No record";
        const resolvedTime = item.created_at || item.createdAt || item.timestamp || new Date().toISOString();

        return {
          ...item,
          phone: resolvedPhone,
          phone_number: resolvedPhone,
          phoneNumber: resolvedPhone,
          created_at: resolvedTime
        };
      });

      setFeedbacks(normalized);
    } catch (error) {
      console.error("Dashboard Sync Error:", error);
    } finally {
      if (showLoadingState) setLoading(false);
    }
  };

  // Confirmation logic handler to wipe database state elements cleanly
  const handleClearFeedback = async () => {
    const confirmClear = window.confirm("Do you want to clear?");
    if (!confirmClear) return;

    try {
      // NOTE: Ensure your backend has a route at this URL that supports DELETE
      await fetch(FEEDBACK_URL, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      console.error("Backend wipe request unhandled:", err);
    } finally {
      // Instantly wipe frontend cache array tracking registers regardless
      setFeedbacks([]);
    }
  };

  // Initial render fetch
  useEffect(() => {
    fetchFeedbacks(true);
  }, []);

  // Live Auto-Refresh: Polls database silently every 5 seconds for new reports
  useEffect(() => {
    const interval = setInterval(() => {
      fetchFeedbacks(false);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const theme = darkMode
    ? "bg-[#050811] text-slate-100"
    : "bg-slate-50 text-slate-800";

  const card = darkMode
    ? "bg-[#0b1120]/80 backdrop-blur-md border border-white/5 shadow-xl shadow-black/20"
    : "bg-white border border-slate-200 shadow-sm";

  const tableWrapper = darkMode
    ? "bg-[#0b1120]/60 backdrop-blur-md border border-white/5"
    : "bg-white border border-slate-200 shadow-sm";

  const tableHeaderStyle = darkMode
    ? "bg-[#0f182c] text-slate-400 border-b border-white/5 text-[11px] font-semibold tracking-wider uppercase"
    : "bg-slate-100 text-slate-600 border-b border-slate-200 text-[11px] font-semibold tracking-wider uppercase";

  return (
    <div className={`${theme} min-h-screen p-4 md:p-8 transition-colors duration-300 text-xs`}>
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-500/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <MessageSquare size={16} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                Emergency Feedback Control
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5">Real-time civilian post-incident response tracking</p>
            </div>
          </div>

          {/* SYSTEM INTERACTIONS CONTROL INTERFACES */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleClearFeedback}
              className="px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-[11px] font-medium transition-all bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
            >
              <Trash2 size={12} />
              Clear Feedback
            </button>

            {/* THEME TOGGLE */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-[11px] font-medium transition-all ${
                darkMode
                  ? "bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5"
                  : "bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300/5"
              }`}
            >
              {darkMode ? <Sun size={12} /> : <Moon size={12} />}
              {darkMode ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-[11px] tracking-widest uppercase opacity-50 animate-pulse">
              Syncing response registers...
            </div>
          </div>
        ) : (
          <>
            {/* ANALYTICS CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-6">

              <div className={`${card} p-3 rounded-xl`}>
                <p className="text-[10px] font-medium tracking-wide uppercase opacity-50">Total Logged</p>
                <h2 className="text-lg font-bold tracking-tight mt-0.5 text-blue-400">{feedbacks.length}</h2>
              </div>

              <div className={`${card} p-3 rounded-xl`}>
                <p className="text-[10px] font-medium tracking-wide uppercase opacity-50">Rescued Status</p>
                <h2 className="text-lg font-bold tracking-tight mt-0.5 text-emerald-400">
                  {feedbacks.filter(f => f.outcome === "rescued").length}
                </h2>
              </div>

              <div className={`${card} p-3 rounded-xl`}>
                <p className="text-[10px] font-medium tracking-wide uppercase opacity-50">Assisted/Helped</p>
                <h2 className="text-lg font-bold tracking-tight mt-0.5 text-sky-400">
                  {feedbacks.filter(f => f.outcome === "helped").length}
                </h2>
              </div>

              <div className={`${card} p-3 rounded-xl`}>
                <p className="text-[10px] font-medium tracking-wide uppercase opacity-50">Unresolved</p>
                <h2 className="text-lg font-bold tracking-tight mt-0.5 text-rose-400">
                  {feedbacks.filter(f => f.outcome === "not_helped").length}
                </h2>
              </div>

              <div className={`${card} p-3 rounded-xl col-span-2 md:col-span-1`}>
                <p className="text-[10px] font-medium tracking-wide uppercase opacity-50">Success Rate</p>
                <h2 className="text-lg font-bold tracking-tight mt-0.5 text-amber-400">
                  {feedbacks.length
                    ? Math.round(
                        (feedbacks.filter(f => f.outcome !== "not_helped").length /
                          feedbacks.length) *
                          100
                      )
                    : 0}
                  %
                </h2>
              </div>

            </div>

            {/* TABLE CONTAINER */}
            <div className={`${tableWrapper} rounded-xl overflow-hidden shadow-md`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr>
                      <th className={`${tableHeaderStyle} p-3 w-1/4`}><span className="flex items-center gap-1.5"><User size={11}/> Complainant Details</span></th>
                      <th className={`${tableHeaderStyle} p-3 w-1/6`}><span className="flex items-center gap-1.5"><CheckCircle size={11}/> Resolution Status</span></th>
                      <th className={`${tableHeaderStyle} p-3 w-5/12`}><span className="flex items-center gap-1.5"><MessageSquare size={11}/> Incident Evaluation / Feedback</span></th>
                      <th className={`${tableHeaderStyle} p-3 w-1/6`}><span className="flex items-center gap-1.5"><Calendar size={11}/> System Time Record</span></th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-500/10 text-[11px]">
                    {feedbacks.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-400 font-medium tracking-wide">
                          No active monitoring feedback responses detected.
                        </td>
                      </tr>
                    ) : (
                      feedbacks.map((item) => (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            darkMode ? "hover:bg-white/[0.02]" : "hover:bg-slate-100/60"
                          }`}
                        >
                          <td className="p-3 align-top">
                            <div className={`font-semibold text-[12px] ${darkMode ? "text-white" : "text-slate-900"}`}>
                              {item.full_name || "Unknown User"}
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                              <Phone size={9} className="opacity-70 text-blue-400" />
                              <span className="font-mono tracking-tight">
                                {item.phone_number}
                              </span>
                            </div>
                          </td>

                          <td className="p-3 align-top">
                            {item.outcome === "rescued" && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                Rescued
                              </span>
                            )}
                            {item.outcome === "helped" && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
                                Helped
                              </span>
                            )}
                            {item.outcome === "not_helped" && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                Unresolved
                              </span>
                            )}
                          </td>

                          <td className={`p-3 leading-relaxed font-normal text-[11px] align-top whitespace-pre-line ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                            {item.feedback}
                          </td>

                          <td className="p-3 align-top whitespace-nowrap text-slate-400">
                            {item.created_at && !isNaN(Date.parse(item.created_at)) ? (
                              <div className="space-y-0.5">
                                <div className={`font-medium tracking-tight ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                                  {new Date(item.created_at).toLocaleDateString()}
                                </div>
                                <div className="text-[10px] text-slate-500 tracking-wide font-mono">
                                  {new Date(item.created_at).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit'
                                  })}
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-600 font-mono">JUST NOW</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}