import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginUser, registerUser } from "../services/authService";

export const useAuthStore = create((set) => ({
  token: null,

  login: async (email, password) => {
    const res = await loginUser({ email, password });

    const token = res.access_token;

    await AsyncStorage.setItem("token", token);

    set({ token });
  },

  register: async (data) => {
    const res = await registerUser(data);

    const token = res.access_token;

    await AsyncStorage.setItem("token", token);

    set({ token });
  },

  logout: async () => {
    await AsyncStorage.removeItem("token");
    set({ token: null });
  },
}));