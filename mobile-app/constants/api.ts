// mobile-app/constants/api.ts
import axios from "axios";

// ✅ Backend base URL (LAN IP of your PC)
//export const API_BASE_URL = "http://192.168.43.137:8000/api/v1";
export const API_BASE_URL = "http://10.213.38.196:8000/api/v1";

// Axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

// ---------------- AUTH ----------------
export const loginUser = async (email: string, password: string) => {
  const res = await api.post("/auth/login", { email, password });
  return res.data;
};

export const registerUser = async (name: string, email: string, password: string) => {
  const res = await api.post("/auth/register", { name, email, password });
  return res.data;
};

// ---------------- USERS ----------------
export const getUsers = async () => {
  const res = await api.get("/users");
  return res.data;
};

export const getUserById = async (id: string) => {
  const res = await api.get(`/users/${id}`);
  return res.data;
};

// ---------------- WALLET ----------------
export const getWallet = async (userId: string) => {
  const res = await api.get(`/wallet/${userId}`);
  return res.data;
};

export const createWallet = async (userId: string) => {
  const res = await api.post(`/wallet/${userId}/create`);
  return res.data;
};

// ---------------- TRACKING ----------------
export const getTracking = async (userId: string) => {
  const res = await api.get(`/tracking/${userId}`);
  return res.data;
};

// ---------------- EMERGENCY ----------------
export const sendEmergencyAlert = async (userId: string, location: string) => {
  const res = await api.post(`/emergency/alert`, { userId, location });
  return res.data;
};

// ---------------- ADMIN ----------------
export const getAdminData = async () => {
  const res = await api.get(`/admin`);
  return res.data;
};