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
import * as Battery from "expo-battery"; 

const { width } = Dimensions.get("window");

import API from "../../services/api";

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
        
        const savedAvatar = await AsyncStorage.getItem(`avatar_${parsedUser.id}`);
        if (savedAvatar) {
          setAvatar(savedAvatar);
        } else {
          setAvatar(null);
        }
      }
      
      const checkTracking = Math.random() > 0.5;
      setIsTrackingActive(checkTracking);
    };

    loadDashboardData();
  }, []);

  /* ======================================
      REAL BATTERY MONITORING
  ====================================== */
  useEffect(() => {
    let batterySubscription: Battery.Subscription | null = null;

    const setupBatteryLevel = async () => {
      try {
        const level = await Battery.getBatteryLevelAsync();
        setBatteryLevel(Math.round(level * 100) + "%");

        batterySubscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
          setBatteryLevel(Math.round(batteryLevel * 100) + "%");
        });
      } catch (error) {
        console.log("Could not initialize telemetry data", error);
        setBatteryLevel("ERR");
      }
    };

    setupBatteryLevel();

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
      REAL GPS
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

  const goToTracking = () => {
    router.push("/tracking");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.innerWrapper}>
          
          {/* TOP CORE LAYOUT */}
          <View>
            {/* HEADER */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.iconCircle}>
                <Ionicons name="menu" size={20} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.logo}>TSC🛡️</Text>

              <View style={styles.bellWrapper}>
                <TouchableOpacity style={styles.iconCircle}>
                  <Ionicons name="notifications-outline" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>3</Text>
                </View>
              </View>
            </View>

            {/* PROFILE BANNER CARDS */}
            <View style={styles.userRow}>
              <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                {avatar && avatar.trim() !== "" ? (
                  <Image source={{ uri: avatar }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="cloud-upload-outline" size={16} color="#00e5a8" />
                    <Text style={styles.avatarPlaceholderText}>Upload Pic</Text>
                  </View>
                )}
                <View style={styles.editBadge}>
                  <Ionicons name="camera" size={9} color="#fff" />
                </View>
              </TouchableOpacity>

              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.greeting} numberOfLines={2}>
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
              <View style={[styles.shieldCircle, { backgroundColor: getStatusColor() + "12" }]}>
                <Ionicons name="shield-checkmark" size={22} color={getStatusColor()} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>System Status Matrix</Text>
                <Text style={[styles.safeText, { color: getStatusColor() }]}>
                  {getSafetyText()}
                </Text>
                <Text style={styles.cardSub}>
                  Satellite encryption active
                </Text>

                {countdown !== null && (
                  <View style={styles.countdownContainer}>
                    <Text style={styles.countdown}>
                      Dispatching help in: {countdown}s
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* TELEMETRY COMPONENT SHOWING LIVE DATA */}
            <View style={styles.telemetryCard}>
              <View style={styles.telemetryItem}>
                <MaterialCommunityIcons name="battery-high" size={16} color="#00e5a8" />
                <Text style={styles.telemetryLabel}>Device Batt</Text>
                <Text style={styles.telemetryValue}>{batteryLevel}</Text>
              </View>
              <View style={styles.telemetryDivider} />
              <View style={styles.telemetryItem}>
                <MaterialCommunityIcons name="signal-cellular-outline" size={16} color="#3b82f6" />
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
              <ModernAction icon="alert-octagon" label="Force Distress" description="Instant Exec" color="#ef4444" onPress={handleSOS} />
            </View>
          </View>

          {/* LOWER CONTROLS PANEL */}
          <View style={styles.bottomControls}>
            {/* HIGH-VISIBILITY ACTION INTERACTIVE SOS TARGET */}
            <TouchableOpacity style={styles.sosCard} onPress={handleSOS} activeOpacity={0.9}>
              <View style={styles.sosButton}>
                <MaterialCommunityIcons name="alarm-light" size={22} color="#fff" />
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.sosCardTitle}>CRITICAL EMERGENCY DISTRESS</Text>
                <Text style={styles.sosCardSub} numberOfLines={1}>
                  Notify authorities instantly
                </Text>
              </View>

              <View style={styles.chevronCircle}>
                <Ionicons name="chevron-forward" size={14} color="#fff" />
              </View>
            </TouchableOpacity>

            {/* ALIGNED RIGHT COMPACT LOGOUT BUTTON */}
            <View style={styles.logoutWrapper}>
              <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
                <MaterialCommunityIcons name="logout" size={14} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.logoutText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

function ModernAction({ icon, label, description, color, onPress }: any) {
  return (
    <TouchableOpacity style={styles.modernActionBox} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.actionIconCircle, { backgroundColor: color + "15" }]}>
        <MaterialCommunityIcons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.modernActionLabel} numberOfLines={1}>{label}</Text>
      <Text style={styles.modernActionDesc} numberOfLines={1}>{description}</Text>
    </TouchableOpacity>
  );
}

/* ROBUST DESIGN STYLESHEET MATRIX */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#070c14" },
  scroll: { flexGrow: 1 },
  innerWrapper: {
    flex: 1,
    justifyContent: "space-between",
    paddingBottom: 24,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: "center",
  },
  logo: { color: "#00e5a8", fontSize: 18, fontWeight: "900", letterSpacing: 0.5 },
  bellWrapper: { position: "relative" },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#111a2e",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  badge: {
    position: "absolute",
    top: -1,
    right: -1,
    backgroundColor: "#ef4444",
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 8, fontWeight: "bold" },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  avatarContainer: { position: "relative" },
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: "#00e5a8" },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#111a2e",
    borderWidth: 1.5,
    borderColor: "#1e293b",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    padding: 2,
  },
  avatarPlaceholderText: {
    color: "#64748b",
    fontSize: 7,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 2,
  },
  editBadge: {
    position: "absolute",
    bottom: -1,
    right: -1,
    backgroundColor: "#2563eb",
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#070c14",
  },
  greeting: { color: "#fff", fontSize: 14, fontWeight: "400", lineHeight: 18 },
  timeBox: { marginLeft: "auto", alignItems: "flex-end" },
  timeText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  dateText: { color: "#64748b", fontSize: 11, marginTop: 1, fontWeight: "500" },

  safetyCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#111a2e",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  shieldCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardTitle: { color: "#64748b", fontSize: 10, fontWeight: "600", letterSpacing: 0.3, textTransform: "uppercase" },
  safeText: { fontSize: 16, fontWeight: "800", marginVertical: 1 },
  cardSub: { color: "#94a3b8", fontSize: 11 },
  countdownContainer: {
    marginTop: 6,
    padding: 6,
    backgroundColor: "#ef444415",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#ef444430",
  },
  countdown: { color: "#ef4444", fontWeight: "bold", fontSize: 11, textAlign: "center" },

  telemetryCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  telemetryItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  telemetryLabel: { color: "#64748b", fontSize: 11, marginLeft: 5, marginRight: "auto" },
  telemetryValue: { color: "#fff", fontSize: 11, fontWeight: "700" },
  telemetryDivider: { width: 1, backgroundColor: "#1e293b", marginHorizontal: 10 },

  sectionTitle: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 18,
    marginTop: 14,
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  modernActionBox: {
    backgroundColor: "#111a2e",
    width: (width - 42) / 2,
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  actionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  modernActionLabel: { color: "#fff", fontSize: 12, fontWeight: "700" },
  modernActionDesc: { color: "#64748b", fontSize: 10, marginTop: 1 },

  bottomControls: {
    marginTop: 12,
  },
  sosCard: {
    flexDirection: "row",
    backgroundColor: "#ef444415",
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ef444435",
  },
  sosButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
  },
  sosCardTitle: { color: "#ef4444", fontWeight: "800", fontSize: 12, letterSpacing: 0.3 },
  sosCardSub: { color: "#94a3b8", fontSize: 11, marginTop: 1, marginRight: 10 },
  chevronCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#ef444420",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
  },

  logoutWrapper: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
  },
  logoutButton: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 11 },
});