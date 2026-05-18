import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Dimensions,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as Battery from "expo-battery"; // 🔋 Real Battery API Installed Here

import API from "../../services/api";

const { width } = Dimensions.get("window");

export default function HomeDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  const [status, setStatus] = useState<
    "idle" | "preparing" | "sending" | "sent" | "failed"
  >("idle");

  const [sendingSOS, setSendingSOS] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  
  // Real battery state and simulated GPS connection status
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState("---%");
  const [signalStatus, setSignalStatus] = useState("Excellent");

  /* ======================================
     LOAD USER & SYSTEM STATUS
  ====================================== */
  useEffect(() => {
    const loadDashboardData = async () => {
      const u = await AsyncStorage.getItem("user");

      if (u) {
        const parsedUser = JSON.parse(u);
        setUser(parsedUser);
        
        // Dynamic Key Fix: Scope image retrieval to current user ID
        const savedAvatar = await AsyncStorage.getItem(`avatar_${parsedUser.id}`);
        if (savedAvatar) {
          setAvatar(savedAvatar);
        } else {
          setAvatar(null);
        }
      }
      
      // Simulate checking active tracking status safely
      const checkTracking = Math.random() > 0.5;
      setIsTrackingActive(checkTracking);
    };

    loadDashboardData();
  }, []);

  /* ======================================
     🔋 REAL BATTERY MONITORING
  ====================================== */
  useEffect(() => {
    let batterySubscription: Battery.Subscription | null = null;

    const setupBatteryLevel = async () => {
      try {
        // 1. Get initial real-time battery charge
        const level = await Battery.getBatteryLevelAsync();
        // Level returns as a fraction (e.g., 0.85), convert to formatted string
        setBatteryLevel(Math.round(level * 100) + "%");

        // 2. Add dynamic listener for real-time charge changes
        batterySubscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
          setBatteryLevel(Math.round(batteryLevel * 100) + "%");
        });
      } catch (error) {
        console.log("Could not initialize telemetry data", error);
        setBatteryLevel("ERR");
      }
    };

    setupBatteryLevel();

    // Clean up hardware system event listener on unmount
    return () => {
      if (batterySubscription) {
        batterySubscription.remove();
      }
    };
  }, []);

  /* ======================================
     CLOCK
  ====================================== */
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  /* ======================================
     LOGOUT
  ====================================== */
  const logout = async () => {
    await AsyncStorage.clear();
    router.replace("/(auth)/login");
  };

  /* ======================================
     PICK IMAGE
  ====================================== */
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow gallery access."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setAvatar(imageUri);
      
      // Dynamic Key Fix: Save avatar using user ID key reference
      if (user?.id) {
        await AsyncStorage.setItem(`avatar_${user.id}`, imageUri);
      } else {
        await AsyncStorage.setItem("avatar", imageUri);
      }

      try {
        const token = await AsyncStorage.getItem("token");
        const formData = new FormData();

        formData.append("file", {
          uri: imageUri,
          name: "avatar.jpg",
          type: "image/jpeg",
        } as any);

        await API.post(
          "/user/upload-avatar",
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
      } catch (err) {
        console.log("Upload Failed", err);
      }
    }
  };

  /* ======================================
     🚨 REAL GPS FIXED HERE
  ====================================== */
  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Location access is required for SOS."
      );
      throw new Error("Location permission denied");
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
  };

  /* ======================================
     SOS
  ====================================== */
  const sendSOS = async () => {
    try {
      setSendingSOS(true);
      setStatus("sending");

      const token = await AsyncStorage.getItem("token");
      const location = await getLocation();

      await API.post(
        "/emergency/sos",
        {
          user_id: user?.id,
          full_name: user?.full_name,
          latitude: location.latitude,
          longitude: location.longitude,
          message: "EMERGENCY ALERT 🚨",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setStatus("sent");

      Alert.alert(
        "SOS SENT",
        "Emergency team notified."
      );

      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    } catch (err) {
      console.log(err);
      setStatus("failed");

      Alert.alert(
        "FAILED",
        "Unable to send SOS."
      );
    } finally {
      setSendingSOS(false);
      setCountdown(null);
    }
  };

  const handleSOS = () => {
    Alert.alert(
      "Emergency SOS",
      "Send emergency alert?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Send",
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
                sendSOS();
              }
            }, 1000);
          },
        },
      ]
    );
  };

  /* ======================================
     STATUS UTILS
  ====================================== */
  const getSafetyText = () => {
    switch (status) {
      case "sending":
        return "SENDING ALERT";
      case "sent":
        return "ALERT SENT";
      case "failed":
        return "SYSTEM ERROR";
      case "preparing":
        return "PREPARING SOS";
      default:
        return "YOU ARE SECURE";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "sending":
        return "#ef4444";
      case "sent":
        return "#00e5a8";
      case "failed":
        return "#f97316";
      case "preparing":
        return "#f59e0b";
      default:
        return "#00e5a8";
    }
  };

  /* ======================================
     NAVIGATION
  ===================================== */
  const goToTracking = () => {
    router.push("/tracking");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* TOP NOTIFICATION BAR FOR ACTIVE SESSIONS */}
      {isTrackingActive && (
        <TouchableOpacity style={styles.activeBanner} onPress={goToTracking}>
          <MaterialCommunityIcons name="radar" size={18} color="#0b1220" />
          <Text style={styles.activeBannerText}> Live dynamic routing engine active</Text>
          <Ionicons name="arrow-forward" size={14} color="#0b1220" style={{ marginLeft: "auto" }} />
        </TouchableOpacity>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconCircle}>
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.logo}>TSC🛡️</Text>

          <View style={styles.bellWrapper}>
            <TouchableOpacity style={styles.iconCircle}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </View>
        </View>

        {/* PROFILE BANNER CARDS */}
        <View style={styles.userRow}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            <Image
              source={{
                uri: avatar && avatar.trim() !== "" ? avatar : "https://randomuser.me/api/portraits/men/32.jpg",
              }}
              style={styles.avatar}
            />
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={12} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={{ marginLeft: 14 }}>
            <Text style={styles.greeting}>
              Welcome,{"\n"}
              <Text style={{ color: "#00e5a8", fontWeight: "800" }}>
                {user?.full_name || "User File"}
              </Text>
            </Text>
          </View>

          <View style={styles.timeBox}>
            <Text style={styles.timeText}>
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text style={styles.dateText}>
              {now.toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </Text>
          </View>
        </View>

        {/* PRIMARY HEALTH STATUS CONTAINER */}
        <View style={[styles.safetyCard, { borderColor: getStatusColor() + "40" }]}>
          <View style={[styles.shieldCircle, { backgroundColor: getStatusColor() + "15" }]}>
            <Ionicons name="shield-checkmark" size={28} color={getStatusColor()} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>System Status Matrix</Text>

            <Text style={[styles.safeText, { color: getStatusColor() }]}>
              {getSafetyText()}
            </Text>

            <Text style={styles.cardSub}>
              Encrypted satellite link operational
            </Text>

            {countdown !== null && (
              <View style={styles.countdownContainer}>
                <Text style={styles.countdown}>
                  Dispatching Emergency Responders in: {countdown}s
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* TELEMETRY COMPONENT SHOWING LIVE DATA */}
        <View style={styles.telemetryCard}>
          <View style={styles.telemetryItem}>
            <MaterialCommunityIcons name="battery-high" size={20} color="#00e5a8" />
            <Text style={styles.telemetryLabel}>Device Batt</Text>
            <Text style={styles.telemetryValue}>{batteryLevel}</Text>
          </View>
          <View style={styles.telemetryDivider} />
          <View style={styles.telemetryItem}>
            <MaterialCommunityIcons name="signal-cellular-outline" size={20} color="#3b82f6" />
            <Text style={styles.telemetryLabel}>GPS Node</Text>
            <Text style={styles.telemetryValue}>{signalStatus}</Text>
          </View>
        </View>

        {/* QUICK ACTIONS INTERACTIVE GRID */}
        <Text style={styles.sectionTitle}>Command Operations</Text>
        <View style={styles.quickGrid}>
          <ModernAction icon="map-marker-radius" label="Live Tracking" description="GPS Stream" color="#00e5a8" onPress={goToTracking} />
          <ModernAction icon="wallet-outline" label="Secure Wallet" description="Transit Ledger" color="#3b82f6" />
          <ModernAction icon="shield-car" label="Insurance" description="Coverage Portal" color="#a855f7" />
          <ModernAction icon="alert-octagon" label="Force Distress" description="Instant Execution" color="#ef4444" onPress={handleSOS} />
        </View>

        {/* HIGH-VISIBILITY ACTION INTERACTIVE SOS TARGET */}
        <TouchableOpacity style={styles.sosCard} onPress={handleSOS} activeOpacity={0.9}>
          <View style={styles.sosButton}>
            <MaterialCommunityIcons name="alarm-light" size={30} color="#fff" />
          </View>

          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.sosCardTitle}>CRITICAL EMERGENCY DISTRESS</Text>
            <Text style={[styles.sosCardSub, { color: "#00C853" }]}>
              Send emergency alert to authorities
            </Text>
          </View>

          <View style={styles.chevronCircle}>
            <Ionicons name="chevron-forward" size={18} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* SYSTEM EXIT SECTION */}
        <TouchableOpacity style={styles.logout} onPress={logout} activeOpacity={0.8}>
          <MaterialCommunityIcons name="logout" size={18} color="#9ca3af" style={{ marginRight: 8 }} />
          <Text style={[styles.logoutText, { color: "#3e2af7" }]}>
            Log Out
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

/* COMPONENT FOR MODERN ARCHITECTURE ACTION CARDS */
function ModernAction({ icon, label, description, color, onPress }: any) {
  return (
    <TouchableOpacity style={styles.modernActionBox} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.actionIconCircle, { backgroundColor: color + "15" }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.modernActionLabel}>{label}</Text>
      <Text style={styles.modernActionDesc}>{description}</Text>
    </TouchableOpacity>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070c14" },
  scroll: { paddingBottom: 40 },

  activeBanner: {
    flexDirection: "row",
    backgroundColor: "#00e5a8",
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  activeBannerText: {
    color: "#0b1220",
    fontWeight: "bold",
    fontSize: 13,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: "center",
  },
  logo: { color: "#00e5a8", fontSize: 22, fontWeight: "900", letterSpacing: 1 },
  bellWrapper: { position: "relative" },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#111a2e",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#ef4444",
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "bold" },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginVertical: 15,
  },
  avatarContainer: { position: "relative" },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: "#1e293b" },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2563eb",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#070c14",
  },
  greeting: { color: "#fff", fontSize: 20, fontWeight: "400", lineHeight: 26 },
  timeBox: { marginLeft: "auto", alignItems: "flex-end" },
  timeText: { color: "#fff", fontSize: 22, fontWeight: "800" },
  dateText: { color: "#64748b", fontSize: 13, marginTop: 2, fontWeight: "500" },

  safetyCard: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#111a2e",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  shieldCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  cardTitle: { color: "#64748b", fontSize: 12, fontWeight: "600", letterSpacing: 0.5, textTransform: "uppercase" },
  safeText: { fontSize: 20, fontWeight: "800", marginVertical: 2 },
  cardSub: { color: "#94a3b8", fontSize: 13 },
  countdownContainer: {
    marginTop: 10,
    padding: 8,
    backgroundColor: "#ef444415",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ef444430",
  },
  countdown: { color: "#ef4444", fontWeight: "bold", fontSize: 12, textAlign: "center" },

  telemetryCard: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  telemetryItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  telemetryLabel: { color: "#64748b", fontSize: 12, marginLeft: 6, marginRight: "auto" },
  telemetryValue: { color: "#fff", fontSize: 13, fontWeight: "700" },
  telemetryDivider: { width: 1, backgroundColor: "#1e293b", marginHorizontal: 12 },

  sectionTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 22,
    marginTop: 20,
    marginBottom: 12,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  modernActionBox: {
    backgroundColor: "#111a2e",
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  modernActionLabel: { color: "#fff", fontSize: 14, fontWeight: "700" },
  modernActionDesc: { color: "#64748b", fontSize: 11, marginTop: 2 },

  sosCard: {
    flexDirection: "row",
    backgroundColor: "#ef444415",
    marginHorizontal: 20,
    marginVertical: 15,
    padding: 16,
    borderRadius: 20,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#ef444440",
  },
  sosButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  sosCardTitle: { color: "#ef4444", fontWeight: "900", fontSize: 14, letterSpacing: 0.5 },
  sosCardSub: { color: "#94a3b8", fontSize: 12, marginTop: 2, marginRight: 10 },
  chevronCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ef444425",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
  },

  logout: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 15,
    padding: 16,
    backgroundColor: "#111a2e",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  logoutText: { color: "#94a3b8", textAlign: "center", fontWeight: "600", fontSize: 14 },
});