import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const BASE_URL =
  Platform.OS === "android"
    ? "http://10.213.38.196:8000/api/v1"
    : "http://localhost:8000/api/v1";

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

API.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers.Accept = "application/json";
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;