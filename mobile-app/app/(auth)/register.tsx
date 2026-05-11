import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";
import API from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

export default function RegisterScreen() {
  const router = useRouter();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleRegister = async () => {
    if (!form.full_name || !form.email || !form.password) {
      Alert.alert("Error", "Full name, email and password are required");
      return;
    }

    try {
      setLoading(true);

      const res = await API.post("/auth/register", form);

      console.log("REGISTER SUCCESS:", res.data);

      Alert.alert("Success", "Account created successfully");

      router.replace("/(auth)/login");
    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error.message ||
        "Something went wrong";

      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="light-content" />

      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join TSC global safety network</Text>

      {/* FULL NAME */}
      <TextInput
        placeholder="Full Name"
        placeholderTextColor="#94A3B8"
        style={styles.input}
        onChangeText={(v) => handleChange("full_name", v)}
      />

      {/* EMAIL */}
      <TextInput
        placeholder="Email"
        placeholderTextColor="#94A3B8"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        onChangeText={(v) => handleChange("email", v)}
      />

      {/* PHONE */}
      <TextInput
        placeholder="Phone"
        placeholderTextColor="#94A3B8"
        style={styles.input}
        keyboardType="phone-pad"
        onChangeText={(v) => handleChange("phone", v)}
      />

      {/* PASSWORD (MATCH LOGIN STYLE) */}
      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Password"
          placeholderTextColor="#94A3B8"
          style={styles.passwordInput}
          secureTextEntry={!showPassword}
          onChangeText={(v) => handleChange("password", v)}
        />

        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
        >
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={22}
            color="#94A3B8"
          />
        </TouchableOpacity>
      </View>

      {/* BUTTON */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </TouchableOpacity>

      {/* LOGIN LINK */}
      <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
        <Text style={styles.link}>
          Already have an account? Login
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* =========================
   STYLES (MATCH LOGIN)
========================= */
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#050816",
    justifyContent: "center",
    padding: 24,
  },

  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#fff",
  },

  subtitle: {
    color: "#94A3B8",
    marginBottom: 30,
    marginTop: 8,
  },

  input: {
    backgroundColor: "#0F172A",
    color: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },

  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  passwordInput: {
    flex: 1,
    color: "#fff",
    paddingVertical: 16,
  },

  button: {
    backgroundColor: "#00E5A8",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  buttonText: {
    fontWeight: "bold",
    color: "#000",
    fontSize: 16,
  },

  link: {
    color: "#00E5A8",
    marginTop: 20,
    textAlign: "center",
  },
});