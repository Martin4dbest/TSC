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
import API from "../../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    try {
      setLoading(true);

      // 1. LOGIN
      const res = await API.post("/auth/login", {
        email,
        password,
      });

      const data = res.data;

      console.log("LOGIN RESPONSE:", data);

      // 2. SAVE TOKEN
      await AsyncStorage.setItem("token", data.access_token);

      // 3. FETCH USER
      const userRes = await API.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      });

      const user = userRes.data;

      console.log("USER FROM /me:", user);

      // 4. NORMALIZE USER
      const normalizedUser = {
        id: user.id,
        email: user.email,
        full_name: user.full_name || user.name || "User",
      };

      // 5. SAVE USER
      await AsyncStorage.setItem(
        "user",
        JSON.stringify(normalizedUser)
      );

      console.log("SAVED USER:", normalizedUser);

      // 6. GO TO DASHBOARD
      router.replace("/(tabs)/home");
    } catch (error) {
      console.log("LOGIN ERROR:", error?.response?.data || error);
      Alert.alert("Login Failed", "Check credentials or backend");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Login to continue</Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#94A3B8"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
      />

      {/* PASSWORD FIELD WITH EYE */}
      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Password"
          placeholderTextColor="#94A3B8"
          value={password}
          onChangeText={setPassword}
          style={styles.passwordInput}
          secureTextEntry={!showPassword}
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
});