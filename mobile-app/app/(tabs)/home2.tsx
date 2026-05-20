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
  
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState("---%");
  const [signalStatus, setSignalStatus] = useState("Excellent");

  /* ======================================
     LOAD USER & SYSTEM STATUS (USER SCOPED)
  ====================================== */
  useEffect(() => {
    const loadDashboardData = async () => {
      const u = await AsyncStorage.getItem("user");
      
      if (u) {
        const parsedUser = JSON.parse(u);
        setUser(parsedUser);
        
        // 🔑 FIXED: Load avatar using the user's unique ID key string
        const savedAvatar = await AsyncStorage.getItem(`avatar_${parsedUser.id}`);
        if (savedAvatar) {
          setAvatar(savedAvatar);
        } else {
          setAvatar(null); // Clear or fallback to default if no profile photo exists
        }
      }
      
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
        const level = await Battery.getBatteryLevelAsync();
        setBatteryLevel(Math.round(level * 100) + "%");

        batterySubscription = Battery.addBatteryLevelListener(({ batteryLevel }) => {
          setBatteryLevel(Math.round(batteryLevel * 100) + "%");
        });
      } catch (error) {
        console.log("Telemetry Error", error);
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
    // Note: standard clear deletes everything. If you prefer keeping local image caches,
    // clear token and user keys selectively instead of .clear()
    await AsyncStorage.clear();
    router.replace("/(auth)/login");
  };

  /* ======================================
     PICK IMAGE (USER SCOPED SAVE)
  ====================================== */
  const pickImage = async () => {
    if (!user?.id) {
      Alert.alert("Error", "User session profile not established.");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission Required", "Please allow gallery access.");
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
      
      // 🔑 FIXED: Save avatar targeting a user specific key string matching their unique database entry
      await AsyncStorage.setItem(`avatar_${user.id}`, imageUri);

      try {
        const token = await AsyncStorage.getItem("token");
        const formData = new FormData();

        formData.append("file", {
          uri: imageUri,
          name: `avatar_${user.id}.jpg`,
          type: "image/jpeg",
        } as any);

        await API.post("/user/upload-avatar", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } catch (err) {
        console.log("Upload Failed", err);
      }
    }
  };

  /* ======================================
     🚨 GPS ACCESSOR
  ====================================== */
  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission Required", "Location access is required for SOS.");
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
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStatus("sent");
      Alert.alert("SOS SENT", "Emergency team notified.");

      setTimeout(() => { setStatus("idle"); }, 3000);
    } catch (err) {
      console.log(err);
      setStatus("failed");
      Alert.alert("FAILED", "Unable to send SOS.");
    } finally {
      setSendingSOS(false);
      setCountdown(null);
    }
  };

  const handleSOS = () => {
    Alert.alert("Emergency SOS", "Send emergency alert?", [
      { text: "Cancel", style: "cancel" },
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
    ]);
  };

  const getSafetyText = () => {
    switch (status) {
      case "sending": return "SENDING ALERT";
      case "sent": return "ALERT SENT";
      case "failed": return "SYSTEM ERROR";
      case "preparing": return "PREPARING SOS";
      default: return "SYSTEM SECURE";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "sending": return "#ef4444";
      case "sent": return "#00e5a8";
      case "failed": return "#f97316";
      case "preparing": return "#f59e0b";
      default: return "#00e5a8";
    }
  };

  const goToTracking = () => { router.push("/tracking"); };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {isTrackingActive && (
        <TouchableOpacity style={styles.activeBanner} onPress={goToTracking}>
          <MaterialCommunityIcons name="radar" size={14} color="#0b1220" />
          <Text style={styles.activeBannerText}> Live dynamic routing active</Text>
          <Ionicons name="arrow-forward" size={12} color="#0b1220" style={{ marginLeft: "auto" }} />
        </TouchableOpacity>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

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

        {/* PROFILE BAR */}
        <View style={styles.userRow}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            <Image
              source={{ uri: avatar || "https://randomuser.me/api/portraits/men/32.jpg" }}
              style={styles.avatar}
            />
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={9} color="#fff" />
            </View>
          </TouchableOpacity>

          <View style={{ marginLeft: 10 }}>
            <Text style={styles.greeting}>
              Welcome, <Text style={{ color: "#00e5a8", fontWeight: "700" }}>{user?.full_name || "User File"}</Text>
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

        {/* MONITOR MATRIX STATUS */}
        <View style={[styles.safetyCard, { borderColor: getStatusColor() + "30" }]}>
          <View style={[styles.shieldCircle, { backgroundColor: getStatusColor() + "10" }]}>
            <Ionicons name="shield-checkmark" size={22} color={getStatusColor()} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Status Core</Text>
            <Text style={[styles.safeText, { color: getStatusColor() }]}>{getSafetyText()}</Text>
            <Text style={styles.cardSub}>Satellite terminal operational</Text>

            {countdown !== null && (
              <View style={styles.countdownContainer}>
                <Text style={styles.countdown}>Emergency Response: {countdown}s</Text>
              </View>
            )}
          </View>
        </View>

        {/* METRICS */}
        <View style={styles.telemetryCard}>
          <View style={styles.telemetryItem}>
            <MaterialCommunityIcons name="battery-high" size={16} color="#00e5a8" />
            <Text style={styles.telemetryLabel}>Battery</Text>
            <Text style={styles.telemetryValue}>{batteryLevel}</Text>
          </View>
          <View style={styles.telemetryDivider} />
          <View style={styles.telemetryItem}>
            <MaterialCommunityIcons name="signal-cellular-outline" size={16} color="#3b82f6" />
            <Text style={styles.telemetryLabel}>GPS Node</Text>
            <Text style={styles.telemetryValue}>{signalStatus}</Text>
          </View>
        </View>

        {/* ACTIONS */}
        <Text style={styles.sectionTitle}>Operations</Text>
        <View style={styles.quickGrid}>
          <ModernAction icon="map-marker-radius" label="Live Tracking" color="#00e5a8" onPress={goToTracking} />
          <ModernAction icon="wallet-outline" label="Secure Wallet" color="#3b82f6" />
          <ModernAction icon="shield-car" label="Insurance" color="#a855f7" />
          <ModernAction icon="alert-octagon" label="Force Distress" color="#ef4444" onPress={handleSOS} />
        </View>

        {/* CRITICAL SOS */}
        <TouchableOpacity style={styles.sosCard} onPress={handleSOS} activeOpacity={0.9}>
          <View style={styles.sosButton}>
            <MaterialCommunityIcons name="alarm-light" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.sosCardTitle}>CRITICAL EMERGENCY DISTRESS  HERE</Text>
            <Text style={styles.sosCardSub}>Broadcast tactical array to grid responders</Text>
          </View>
          <View style={styles.chevronCircle}>
            <Ionicons name="chevron-forward" size={14} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* SHUTDOWN */}
        <TouchableOpacity style={styles.logout} onPress={logout} activeOpacity={0.8}>
          <MaterialCommunityIcons name="logout" size={14} color="#64748b" style={{ marginRight: 6 }} />
          <Text style={styles.logoutText}>Terminate Session</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

function ModernAction({ icon, label, color, onPress }: any) {
  return (
    <TouchableOpacity style={styles.modernActionBox} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.actionIconCircle, { backgroundColor: color + "10" }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.modernActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

/* SPACING STYLES */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050911" },
  scroll: { paddingBottom: 20 },

  activeBanner: {
    flexDirection: "row",
    backgroundColor: "#00e5a8",
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  activeBannerText: { color: "#0b1220", fontWeight: "700", fontSize: 11 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
    alignItems: "center",
  },
  logo: { color: "#00e5a8", fontSize: 16, fontWeight: "900", letterSpacing: 0.5 },
  bellWrapper: { position: "relative" },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: -1,
    right: -1,
    backgroundColor: "#ef4444",
    width: 12,
    height: 12,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 8, fontWeight: "bold" },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginVertical: 10,
  },
  avatarContainer: { position: "relative" },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: "#1e293b" },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2563eb",
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#050911",
  },
  greeting: { color: "#fff", fontSize: 14, fontWeight: "400" },
  timeBox: { marginLeft: "auto", alignItems: "flex-end" },
  timeText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  dateText: { color: "#475569", fontSize: 11, marginTop: 1 },

  safetyCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#0f172a",
    alignItems: "center",
    borderWidth: 1,
  },
  shieldCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  cardTitle: { color: "#475569", fontSize: 10, fontWeight: "600", textTransform: "uppercase" },
  safeText: { fontSize: 15, fontWeight: "800" },
  cardSub: { color: "#64748b", fontSize: 11 },
  countdownContainer: {
    marginTop: 6,
    padding: 4,
    backgroundColor: "#ef444410",
    borderRadius: 6,
  },
  countdown: { color: "#ef4444", fontWeight: "700", fontSize: 11, textAlign: "center" },

  telemetryCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: "#0b1222",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  telemetryItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  telemetryLabel: { color: "#475569", fontSize: 11, marginLeft: 4, marginRight: "auto" },
  telemetryValue: { color: "#fff", fontSize: 11, fontWeight: "700" },
  telemetryDivider: { width: 1, backgroundColor: "#1e293b", marginHorizontal: 10 },

  sectionTitle: {
    color: "#64748b",
    fontSize: 11,
    fontWeight: "700",
    marginLeft: 18,
    marginTop: 12,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  modernActionBox: {
    backgroundColor: "#0f172a",
    width: (width - 42) / 2,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#1e293b",
    flexDirection: "row",
    alignItems: "center",
  },
  actionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  modernActionLabel: { color: "#fff", fontSize: 12, fontWeight: "600" },

  sosCard: {
    flexDirection: "row",
    backgroundColor: "#ef444410",
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ef444425",
  },
  sosButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
  },
  sosCardTitle: { color: "#ef4444", fontWeight: "800", fontSize: 12 },
  sosCardSub: { color: "#64748b", fontSize: 11, marginTop: 1 },
  chevronCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ef444415",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: "auto",
  },

  logout: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 8,
    padding: 10,
    backgroundColor: "#0f172a",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  logoutText: { color: "#64748b", fontWeight: "600", fontSize: 12 },
});

