import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      // 🔌 READY FOR FASTAPI CONNECTION
      const response = await fetch("http://YOUR_BACKEND_IP:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Login failed");
      }

      // TODO: store token securely later
      console.log("LOGIN SUCCESS:", data);

      router.replace("/(tabs)");

    } catch (error: any) {
      Alert.alert("Login Failed", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Login to continue your journey</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#94A3B8"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#94A3B8"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
        <Text style={styles.link}>
          Don't have an account? Register
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  input: {
    backgroundColor: "#0F172A",
    color: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#00E5A8",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
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