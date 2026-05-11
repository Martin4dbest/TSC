import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import API from "../../services/api";

export default function HomeDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [now, setNow] = useState(new Date());

  // SOS STATES
  const [sendingSOS, setSendingSOS] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "preparing" | "sending" | "sent" | "failed"
  >("idle");

  const [countdown, setCountdown] = useState<number | null>(null);

  // BLINK ANIMATION
  const blink = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (sendingSOS || status === "sending") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(blink, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(blink, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      blink.setValue(1);
    }
  }, [sendingSOS, status]);

  // LOAD USER
  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await AsyncStorage.getItem("user");
        if (u) setUser(JSON.parse(u));
      } catch (err) {
        console.log("USER LOAD ERROR:", err);
      }
    };
    loadUser();
  }, []);

  // CLOCK
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const logout = async () => {
    await AsyncStorage.clear();
    router.replace("/(auth)/login");
  };

  // SIMULATED GPS (replace later with real GPS)
  const getLocation = async () => {
    return {
      latitude: 6.5244,
      longitude: 3.3792,
    };
  };

  // REAL SOS FLOW
  const sendSOS = async () => {
    try {
      setStatus("sending");
      setSendingSOS(true);

      const token = await AsyncStorage.getItem("token");
      const userString = await AsyncStorage.getItem("user");
      const currentUser = JSON.parse(userString || "{}");

      const location = await getLocation();

      const res = await API.post(
        "/emergency/sos",
        {
          user_id: currentUser.id,
          full_name: currentUser.full_name,
          latitude: location.latitude,
          longitude: location.longitude,
          message: "EMERGENCY ALERT 🚨 User needs help!",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("SOS SUCCESS:", res.data);

      setStatus("sent");
      Alert.alert("🚨 SOS SENT", "Emergency team notified!");

      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      console.log("SOS ERROR:", err);
      setStatus("failed");

      Alert.alert("SOS FAILED", "Could not send emergency alert");
    } finally {
      setSendingSOS(false);
      setCountdown(null);
    }
  };

  // COUNTDOWN BEFORE SOS
  const handleSOS = () => {
    Alert.alert("🚨 EMERGENCY ALERT", "Send SOS in 3 seconds?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "START",
        style: "destructive",
        onPress: () => {
          setStatus("preparing");

          let count = 3;
          setCountdown(count);

          const interval = setInterval(() => {
            count -= 1;
            setCountdown(count);

            if (count <= 0) {
              clearInterval(interval);
              setCountdown(null);
              sendSOS();
            }
          }, 1000);
        },
      },
    ]);
  };

  const getStatusColor = () => {
    switch (status) {
      case "sending":
        return "#EF4444";
      case "sent":
        return "#00E5A8";
      case "failed":
        return "orange";
      case "preparing":
        return "#F59E0B";
      default:
        return "#94A3B8";
    }
  };

  return (
    <ScrollView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* STATUS BANNER */}
      <Animated.View
        style={[
          styles.banner,
          { opacity: blink, borderColor: getStatusColor() },
        ]}
      >
        <Text style={styles.bannerText}>
          STATUS: {status.toUpperCase()}
        </Text>

        {countdown !== null && (
          <Text style={styles.countdown}>
            Sending in {countdown}...
          </Text>
        )}
      </Animated.View>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          👋 Hello, {user?.full_name || "User"}
        </Text>

        <Text style={styles.clock}>
          {now.toDateString()}
        </Text>

        <Text style={styles.time}>
          {now.toLocaleTimeString()}
        </Text>
      </View>

      {/* STATUS CARD */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🛡 Safety Status</Text>
        <Text style={styles.safe}>YOU ARE SAFE</Text>
        <Text style={styles.cardSub}>
          Real-time monitoring active
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

      {/* BIG SOS */}
      <TouchableOpacity
        style={[
          styles.sosButton,
          status === "sending" && styles.sosActive,
        ]}
        onPress={handleSOS}
        disabled={sendingSOS}
      >
        {sendingSOS ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.sosText}>
            🚨 EMERGENCY SOS
          </Text>
        )}
      </TouchableOpacity>

      {/* LOGOUT */}
      <TouchableOpacity style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
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

  banner: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
  },

  bannerText: {
    color: "#fff",
    fontWeight: "bold",
  },

  countdown: {
    color: "#F59E0B",
    marginTop: 5,
    fontSize: 18,
  },

  header: {
    marginTop: 10,
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
    alignItems: "center",
  },

  sosActive: {
    backgroundColor: "#7F1D1D",
  },

  sosText: {
    color: "#fff",
    fontWeight: "bold",
  },

  logout: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#1F2937",
    borderRadius: 14,
  },

  logoutText: {
    color: "#fff",
    textAlign: "center",
  },
});