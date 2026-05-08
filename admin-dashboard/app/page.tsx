"use client";

import React from "react";
import Link from "next/link";
import {
  Shield,
  Lock,
  BrainCircuit,
  Search,
  Globe,
} from "lucide-react";

export default function TSCDashboardLanding() {
  return (
    <div className="relative min-h-screen bg-[#020817] text-slate-400 overflow-x-hidden">

      {/* BACKGROUND */}
      <div className="fixed inset-0 opacity-20 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] to-[#020817]" />
      </div>

      {/* NAVBAR */}
      <nav className="relative z-50 h-14 flex items-center justify-between px-6 border-b border-white/5 bg-[#020817]/80 backdrop-blur-md">

        {/* LOGO */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded">
            <Shield size={18} className="text-white" />
          </div>

          <h1 className="text-white text-[13px] font-bold uppercase tracking-wider">
            TSC Transport System
          </h1>
        </div>

        {/* FIXED LOGIN BUTTON */}
        <Link
          href="/login"
          className="relative z-[100] bg-blue-600 hover:bg-blue-700 transition-all duration-300 text-white text-[10px] uppercase px-5 py-2 rounded cursor-pointer shadow-lg"
        >
          Admin Login
        </Link>

      </nav>

      {/* MAIN */}
      <main className="relative z-10 max-w-7xl mx-auto p-6 space-y-8">

        {/* TOP GRID */}
        <div className="grid lg:grid-cols-12 gap-6">

          {/* MAP SECTION */}
          <div className="lg:col-span-8 border border-white/10 bg-[#0a1120]/90 rounded-xl overflow-hidden shadow-2xl">

            <div className="p-4 border-b border-white/5">
              <h2 className="text-[10px] uppercase tracking-[0.3em] text-white">
                Global Transport Map
              </h2>
            </div>

            <div className="relative h-[360px]">

              {/* MAP IMAGE */}
              <img
                src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2000"
                alt="Global map"
                className="w-full h-full object-cover opacity-60"
              />

              {/* GRID OVERLAY */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:18px_18px] opacity-30" />

              {/* CENTER ICON */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Globe size={90} className="text-white/20" />
              </div>

            </div>
          </div>

          {/* STATUS PANEL */}
          <div className="lg:col-span-4 border border-white/10 bg-[#0a1120]/90 rounded-xl p-5 space-y-4 shadow-2xl">

            <h2 className="text-[10px] uppercase tracking-[0.3em] text-white">
              System Status
            </h2>

            <Status label="Tracking Engine" />
            <Status label="Mapping System" />
            <Status label="Security Layer" />

            <img
              src="https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1200"
              alt="Vehicle"
              className="w-full h-28 object-cover border border-white/10 rounded-lg"
            />

          </div>
        </div>

        {/* TRANSPORT STRIP */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">

          <TransportCard
            title="Cars"
            img="https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=1200"
          />

          <TransportCard
            title="Buses"
            img="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1200"
          />

          <TransportCard
            title="Trucks"
            img="https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?q=80&w=1200"
          />

          <TransportCard
            title="Air Transport"
            img="https://images.unsplash.com/photo-1540962351504-03099e0a754b?q=80&w=1200"
          />

          <TransportCard
            title="Logistics"
            img="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200"
          />

        </div>

        {/* FEATURES */}
        <div className="grid md:grid-cols-4 gap-4">

          <Feature
            icon={<Lock size={18} />}
            title="Secure Fleet"
          />

          <Feature
            icon={<BrainCircuit size={18} />}
            title="AI Routing"
          />

          <Feature
            icon={<Search size={18} />}
            title="Live Tracking"
          />

          <Feature
            icon={<Globe size={18} />}
            title="Geo Mapping"
          />

        </div>

      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/5 py-6 mt-12 bg-[#010409]">
        <div className="max-w-7xl mx-auto px-6 flex justify-between text-[9px] uppercase tracking-widest">
          <span>© 2026 TSC TRANSPORT SYSTEM</span>
          <span>Fleet Intelligence Active</span>
        </div>
      </footer>

    </div>
  );
}

/* ========================= */
/* COMPONENTS */
/* ========================= */

function TransportCard({ title, img }: any) {
  return (
    <div className="border border-white/10 bg-[#0a1120]/70 rounded-xl overflow-hidden hover:border-blue-500/40 transition-all duration-300 shadow-xl">

      <img
        src={img}
        alt={title}
        className="h-24 w-full object-cover"
      />

      <div className="p-3 text-[10px] text-white uppercase tracking-widest">
        {title}
      </div>

    </div>
  );
}

function Status({ label }: any) {
  return (
    <div className="flex items-center justify-between text-[10px] uppercase border-t border-white/5 pt-3">
      <span>{label}</span>

      <span className="text-emerald-500 font-semibold">
        Online
      </span>
    </div>
  );
}

function Feature({ icon, title }: any) {
  return (
    <div className="p-5 border border-white/10 bg-[#0a1120]/60 rounded-xl hover:border-blue-500/30 transition-all duration-300 shadow-xl">

      <div className="text-blue-500 mb-3">
        {icon}
      </div>

      <div className="text-white text-[10px] uppercase tracking-widest">
        {title}
      </div>

    </div>
  );
}