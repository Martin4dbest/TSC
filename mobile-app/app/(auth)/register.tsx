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

export default function RegisterScreen() {
  const router = useRouter();

  // ✅ simplified state (no TS issues)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  // ✅ FIXED: removed TypeScript annotations
  const handleChange = (key, value) => {
    setForm({
      ...form,
      [key]: value,
    });
  };

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      Alert.alert("Error", "Please fill required fields");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        "http://YOUR_BACKEND_IP:8000/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || "Registration failed");
      }

      Alert.alert("Success", "Account created successfully");

      router.replace("/(auth)/login");
    } catch (error) {
      Alert.alert(
        "Error",
        error?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StatusBar barStyle="light-content" />

      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>
        Join TSC global safety network
      </Text>

      <TextInput
        placeholder="Full Name"
        placeholderTextColor="#94A3B8"
        style={styles.input}
        onChangeText={(v) => handleChange("name", v)}
      />

      <TextInput
        placeholder="Email"
        placeholderTextColor="#94A3B8"
        style={styles.input}
        onChangeText={(v) => handleChange("email", v)}
      />

      <TextInput
        placeholder="Phone"
        placeholderTextColor="#94A3B8"
        style={styles.input}
        onChangeText={(v) => handleChange("phone", v)}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#94A3B8"
        secureTextEntry
        style={styles.input}
        onChangeText={(v) => handleChange("password", v)}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>
            Create Account
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/(auth)/login")}
      >
        <Text style={styles.link}>
          Already have an account? Login
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

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
    marginBottom: 14,
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