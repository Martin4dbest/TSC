"use client";

import React, { useEffect, useState } from "react";
import { MessageSquare, Sun, Moon } from "lucide-react";

const BASE_URL = "https://tsc-backend-nefz.onrender.com/api/v1";
const FEEDBACK_URL = `${BASE_URL}/emergency/feedback/all`;

type Feedback = {
  id: number;
  full_name: string;
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
      const data = await res.json();

      const normalized: Feedback[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.feedbacks)
        ? data.feedbacks
        : [];

      setFeedbacks(normalized);
    } catch (error) {
      console.error(error);
      setFeedbacks([]);
    } finally {
      if (showLoadingState) setLoading(false);
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
    ? "bg-[#070b14] text-white"
    : "bg-gray-100 text-gray-900";

  const card = darkMode
    ? "bg-[#0d1424] border border-white/10"
    : "bg-white border border-gray-200";

  const table = darkMode
    ? "bg-[#0d1424] border-white/10"
    : "bg-white border-gray-200";

  return (
    <div className={`${theme} min-h-screen p-6 transition-all duration-300`}>

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-blue-400" />
          <h1 className="text-2xl font-bold tracking-wide">
            Emergency Feedback Reports
          </h1>
        </div>

        {/* THEME TOGGLE */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition ${
            darkMode
              ? "bg-white/10 hover:bg-white/20"
              : "bg-black/10 hover:bg-black/20"
          }`}
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          {darkMode ? "Light" : "Dark"}
        </button>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="text-gray-400">Loading feedback reports...</div>
      ) : (
        <>
          {/* ANALYTICS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">

            <div className={`${card} p-4 rounded-xl`}>
              <p className="text-xs opacity-60">Total Feedbacks</p>
              <h2 className="text-2xl font-bold mt-1">{feedbacks.length}</h2>
            </div>

            <div className={`${card} p-4 rounded-xl`}>
              <p className="text-xs opacity-60">Rescued</p>
              <h2 className="text-2xl font-bold text-emerald-400 mt-1">
                {feedbacks.filter(f => f.outcome === "rescued").length}
              </h2>
            </div>

            <div className={`${card} p-4 rounded-xl`}>
              <p className="text-xs opacity-60">Helped</p>
              <h2 className="text-2xl font-bold text-blue-400 mt-1">
                {feedbacks.filter(f => f.outcome === "helped").length}
              </h2>
            </div>

            <div className={`${card} p-4 rounded-xl`}>
              <p className="text-xs opacity-60">Not Helped</p>
              <h2 className="text-2xl font-bold text-red-400 mt-1">
                {feedbacks.filter(f => f.outcome === "not_helped").length}
              </h2>
            </div>

            <div className={`${card} p-4 rounded-xl`}>
              <p className="text-xs opacity-60">Satisfaction</p>
              <h2 className="text-2xl font-bold text-yellow-400 mt-1">
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

          {/* TABLE */}
          <div className={`${table} rounded-xl overflow-hidden`}>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left">
                  <th className="p-4">User</th>
                  <th className="p-4">Outcome</th>
                  <th className="p-4">Report</th>
                  <th className="p-4">Date & Time</th>
                </tr>
              </thead>

              <tbody>
                {feedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center opacity-60">
                      No feedback reports found
                    </td>
                  </tr>
                ) : (
                  feedbacks.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-white/5 hover:bg-white/5 transition"
                    >
                      <td className="p-4 font-medium">
                        {item.full_name}
                      </td>

                      <td className="p-4">
                        {item.outcome === "rescued" && (
                          <span className="text-emerald-400 font-medium">
                            Rescued
                          </span>
                        )}
                        {item.outcome === "helped" && (
                          <span className="text-blue-400 font-medium">
                            Helped
                          </span>
                        )}
                        {item.outcome === "not_helped" && (
                          <span className="text-red-400 font-medium">
                            Not Helped
                          </span>
                        )}
                      </td>

                      <td className="p-4 opacity-80">
                        {item.feedback}
                      </td>

                      {/* Displaying both formatted local Date and Time */}
                      <td className="p-4 opacity-60 whitespace-nowrap">
                        {item.created_at ? (
                          <>
                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                            <span className="text-xs block text-gray-400">
                              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        ) : (
                          "N/A"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

          </div>
        </>
      )}
    </div>
  );
}