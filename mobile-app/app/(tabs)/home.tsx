import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

export default function HomeDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [now, setNow] = useState(new Date());

  // =========================
  // LOAD USER (FIXED - IMPORTANT)
  // =========================
  useFocusEffect(
    useCallback(() => {
      const loadUser = async () => {
        try {
          const u = await AsyncStorage.getItem("user");

          console.log("USER FROM STORAGE:", u);

          if (u) {
            setUser(JSON.parse(u));
          } else {
            setUser(null);
          }
        } catch (err) {
          console.log("ERROR LOADING USER:", err);
        }
      };

      loadUser();
    }, [])
  );

  // =========================
  // CLOCK
  // =========================
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // =========================
  // LOGOUT
  // =========================
  const logout = async () => {
    await AsyncStorage.clear();
    router.replace("/(auth)/login");
  };

  // =========================
  // SOS
  // =========================
  const handleSOS = () => {
    Alert.alert("🚨 Emergency Alert", "Send SOS?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "SEND",
        style: "destructive",
        onPress: () => console.log("SOS TRIGGERED"),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          👋 Hello, {user?.full_name ?? user?.name ?? "User"}
        </Text>

        <Text style={styles.clock}>{now.toDateString()}</Text>

        <Text style={styles.time}>{now.toLocaleTimeString()}</Text>

        <View style={styles.statusRow}>
          <View style={styles.dot} />
          <Text style={styles.statusText}>
            System Active • Protected
          </Text>
        </View>
      </View>

      {/* STATUS CARD */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🛡 Safety Status</Text>
        <Text style={styles.safe}>YOU ARE SAFE</Text>
        <Text style={styles.cardSub}>
          All systems running normally
        </Text>
      </View>

      {/* QUICK ACTIONS */}
      <View style={styles.grid}>
        <TouchableOpacity style={styles.box}>
          <Ionicons name="navigate" size={22} color="#00E5A8" />
          <Text style={styles.boxText}>Tracking</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.box}>
          <Ionicons name="wallet" size={22} color="#00E5A8" />
          <Text style={styles.boxText}>Wallet</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.box}>
          <Ionicons name="shield-checkmark" size={22} color="#00E5A8" />
          <Text style={styles.boxText}>Insurance</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.box} onPress={handleSOS}>
          <Ionicons name="warning" size={22} color="red" />
          <Text style={styles.boxText}>SOS</Text>
        </TouchableOpacity>
      </View>

      {/* SOS BUTTON */}
      <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
        <Text style={styles.sosText}>🚨 EMERGENCY SOS</Text>
      </TouchableOpacity>

      {/* LOGOUT */}
      <TouchableOpacity style={styles.logout} onPress={logout}>
        <Text style={{ color: "#fff", textAlign: "center" }}>
          Logout
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* =========================
STYLES
========================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
    padding: 20,
  },

  header: {
    marginTop: 20,
    marginBottom: 25,
  },

  greeting: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
  },

  clock: {
    color: "#94A3B8",
    marginTop: 6,
    fontSize: 14,
  },

  time: {
    color: "#00E5A8",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 4,
  },

  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00E5A8",
    marginRight: 8,
  },

  statusText: {
    color: "#94A3B8",
    fontSize: 12,
  },

  card: {
    backgroundColor: "#0F172A",
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },

  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  safe: {
    color: "#00E5A8",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
  },

  cardSub: {
    color: "#94A3B8",
    marginTop: 6,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  box: {
    width: "48%",
    backgroundColor: "#0F172A",
    padding: 18,
    marginBottom: 12,
    borderRadius: 16,
    alignItems: "center",
  },

  boxText: {
    color: "#fff",
    marginTop: 8,
    fontSize: 12,
  },

  sosButton: {
    backgroundColor: "#EF4444",
    padding: 16,
    borderRadius: 14,
    marginTop: 20,
  },

  sosText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },

  logout: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#1F2937",
    borderRadius: 14,
  },
});