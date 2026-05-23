"use client";

import { useState } from "react";
import { login } from "../../lib/auth";

import { Shield, Lock, User, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    try {
      setLoading(true);

      const data = await login(email, password);

      const token = data?.access_token;

      if (!token) {
        throw new Error("No access token returned from backend");
      }

      // 🔥 DECODE TOKEN (REAL SOURCE OF ROLE)
      const decoded: any = jwtDecode(token);
      const role = decoded?.role;

      console.log("DECODED USER:", decoded);
      console.log("ROLE FOUND:", role);

      // SAVE AUTH DATA
      localStorage.setItem("token", token);
      localStorage.setItem("role", role || "user");

      // 🚀 ROLE BASED REDIRECT
      if (role === "superadmin") {
        router.push("/dashboard/superadmin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020817] text-white px-4">
      <div className="w-full max-w-md bg-[#0a1120] border border-white/10 rounded-xl p-8 shadow-2xl">

        {/* HEADER */}
        <div className="text-center mb-6">
          <div className="flex justify-center">
            <div className="bg-blue-600 p-3 rounded-full">
              <Shield size={22} />
            </div>
          </div>

          <h1 className="mt-4 text-lg font-bold uppercase tracking-widest">
            TSC LOGIN SYSTEM
          </h1>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-4 text-xs text-red-400 bg-red-900/20 p-2 rounded">
            {error}
          </div>
        )}

        {/* EMAIL */}
        <div className="mb-4">
          <label className="text-[10px] uppercase text-slate-400">
            Email
          </label>

          <div className="flex items-center mt-2 bg-[#020817] border border-white/10 rounded px-3">
            <User size={14} />
            <input
              className="flex-1 bg-transparent p-3 outline-none min-w-0"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
            />
          </div>
        </div>

        {/* PASSWORD */}
        <div className="mb-6">
          <label className="text-[10px] uppercase text-slate-400">
            Password
          </label>

          <div className="flex items-center mt-2 bg-[#020817] border border-white/10 rounded px-3">
            <Lock size={14} />

            <input
              type={showPassword ? "text" : "password"}
              className="flex-1 bg-transparent p-3 outline-none min-w-0"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="shrink-0 ml-2 text-slate-400 hover:text-white cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* BUTTON */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 py-3 text-xs uppercase font-bold"
        >
          {loading ? "Authenticating..." : "Login"}
        </button>
      </div>
    </div>
  );
}