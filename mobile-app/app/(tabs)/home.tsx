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
  ActivityIndicator,
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

// Custom FormData interfaces preventing generic upload red lines in TypeScript compiling
type FormDataValue = string | Blob | { uri: string; name: string; type: string };

interface ExtendedFormData extends FormData {
  append(name: string, value: FormDataValue, fileName?: string): void;
}

export default function HomeDashboard() {
  const router = useRouter();

  // Primary Theme Switching Control hook
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [user, setUser] = useState<any>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  const [status, setStatus] = useState<
    "idle" | "preparing" | "sending" | "sent" | "failed"
  >("idle");

  const [sendingSOS, setSendingSOS] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [batteryLevel, setBatteryLevel] = useState("---%");
  const [signalStatus] = useState("Excellent");
  const [showEmergencyUnits, setShowEmergencyUnits] = useState(false);
  const [selectedUnits, setSelectedUnits] = useState<string[]>([]);

  // Unified Theme configuration properties mapped seamlessly throughout components
  const theme = {
    background: isDarkMode ? "#0f172a" : "#ffffff",
    cardBg: isDarkMode ? "#1e293b" : "#ffffff",
    telemetryBg: isDarkMode ? "#1e293b" : "#f8fafc",
    telemetryBorder: isDarkMode ? "#334155" : "#f1f5f9",
    border: isDarkMode ? "#334155" : "#e2e8f0",
    textPrimary: isDarkMode ? "#f8fafc" : "#0f172a",
    textSecondary: isDarkMode ? "#94a3b8" : "#64748b",
    iconCircleBg: isDarkMode ? "#1e293b" : "#f8fafc",
    iconCircleBorder: isDarkMode ? "#334155" : "#f1f5f9",
    avatarPlaceholderBg: isDarkMode ? "#1e293b" : "#f8fafc",
    avatarPlaceholderBorder: isDarkMode ? "#334155" : "#e2e8f0",
    bottomPanelBg: isDarkMode ? "#1e293b" : "#ffffff",
    logoutButtonBg: isDarkMode ? "#1e293b" : "#f1f5f9",
    actionBoxBg: isDarkMode ? "#1e293b" : "#ffffff",
  };

  const emergencyUnits = [
    { id: "police", title: "Police Unit", icon: "shield-account", color: "#2563eb" },
    { id: "ambulance", title: "Medical Response", icon: "ambulance", color: "#dc2626" },
    { id: "fire", title: "Fire Service", icon: "fire-truck", color: "#ea580c" },
    { id: "security", title: "Private Security", icon: "shield-alert", color: "#475569" },
  ];

  /* ======================================
      LOAD USER & THEME PREFERENCE
  ====================================== */
  useEffect(() => {
    const loadDashboardData = async () => {
      const u = await AsyncStorage.getItem("user");
      const savedTheme = await AsyncStorage.getItem("theme_preference");

      if (savedTheme) {
        setIsDarkMode(savedTheme === "dark");
      }

      if (u) {
        const parsedUser = JSON.parse(u);
        setUser(parsedUser);

        const savedAvatar = await AsyncStorage.getItem(
          `avatar_${parsedUser.id}`
        );

        if (savedAvatar) {
          setAvatar(savedAvatar);
        }
      }
    };

    loadDashboardData();
  }, []);

  // Toggles settings states fluidly between white and dark layouts
  const toggleTheme = async () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    await AsyncStorage.setItem("theme_preference", nextMode ? "dark" : "light");
  };

  /* ======================================
      BATTERY
  ====================================== */
  useEffect(() => {
    let batterySubscription: Battery.Subscription | null = null;

    const setupBatteryLevel = async () => {
      try {
        const level = await Battery.getBatteryLevelAsync();
        setBatteryLevel(Math.round(level * 100) + "%");

        batterySubscription = Battery.addBatteryLevelListener(
          ({ batteryLevel }) => {
            setBatteryLevel(Math.round(batteryLevel * 100) + "%");
          }
        );
      } catch (error) {
        console.log(error);
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
      PICK IMAGE (Guaranteed No Red Lines)
  ====================================== */
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission Required", "Please allow gallery access.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setAvatar(imageUri);

      if (user?.id) {
        await AsyncStorage.setItem(`avatar_${user.id}`, imageUri);
      }

      try {
        const token = await AsyncStorage.getItem("token");
        
        // Cast as ExtendedFormData to cleanly handle files inside native JS compilation structures
        const formData = new FormData() as ExtendedFormData;

        formData.append("file", {
          uri: imageUri,
          name: "avatar.jpg",
          type: "image/jpeg",
        });

        await API.post("/user/upload-avatar", formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
      } catch (err) {
        console.log(err);
      }
    }
  };

  /* ======================================
      LOCATION
  ====================================== */
  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission Required", "Location access is required.");
      throw new Error("Location denied");
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
      NORMAL SOS
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
      Alert.alert("SOS SENT", "Emergency team notified.");

      setTimeout(() => {
        setStatus("idle");
      }, 3000);
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
    ]);
  };

  /* ======================================
      FORCE DISTRESS
  ====================================== */
  const toggleEmergencyUnit = (id: string) => {
    setSelectedUnits((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  };

  const sendDistressAlert = async () => {
    try {
      if (selectedUnits.length === 0) {
        Alert.alert(
          "Emergency Unit Required",
          "Please select at least one emergency unit."
        );
        return;
      }

      setSendingSOS(true);
      setStatus("sending");

      const token = await AsyncStorage.getItem("token");
      const location = await getLocation();

      await API.post(
        "/emergency/sos",
        {
          user_id: user?.id,
          full_name: user?.full_name,
          phone: user?.phone,
          email: user?.email,
          latitude: location.latitude,
          longitude: location.longitude,
          emergency_units: selectedUnits,
          emergency_type: "CRITICAL DISTRESS",
          message: `🚨 CRITICAL DISTRESS ALERT:\n\nEmergency Units Requested:\n${selectedUnits.join(
            ", "
          )}\n\nImmediate assistance required.`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setStatus("sent");
      Alert.alert("DISTRESS ALERT SENT", "Emergency response units notified.");
      setShowEmergencyUnits(false);
      setSelectedUnits([]);

      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    } catch (err) {
      console.log(err);
      setStatus("failed");
      Alert.alert("FAILED", "Unable to send distress alert.");
    } finally {
      setSendingSOS(false);
    }
  };

  const handleForceDistress = () => {
    setShowEmergencyUnits(true);
  };

  /* ======================================
      STATUS CONFIGURATIONS
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
        return "#dc2626";
      case "sent":
        return "#16a34a";
      case "failed":
        return "#ea580c";
      case "preparing":
        return "#d97706";
      default:
        return "#16a34a";
    }
  };

  const goToTracking = () => {
    router.push("/tracking");
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={theme.background} 
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.innerWrapper}>
          <View>
            {/* HEADER SECTION */}
            <View style={styles.header}>
              <TouchableOpacity style={[styles.iconCircle, { backgroundColor: theme.iconCircleBg, borderColor: theme.iconCircleBorder }]}>
                <Ionicons name="menu" size={20} color={isDarkMode ? "#94a3b8" : "#334155"} />
              </TouchableOpacity>

              <Text style={[styles.logo, { color: theme.textPrimary }]}>TSC🛡️</Text>

              <View style={styles.rightHeaderGroup}>
                {/* ACTIVE TOGGLE BUTTON FOR SHIFTING SYSTEM BACKGROUNDS */}
                <TouchableOpacity 
                  onPress={toggleTheme}
                  style={[styles.iconCircle, { marginRight: 8, backgroundColor: theme.iconCircleBg, borderColor: theme.iconCircleBorder }]}
                >
                  <Ionicons 
                    name={isDarkMode ? "sunny" : "moon"} 
                    size={20} 
                    color={isDarkMode ? "#f59e0b" : "#334155"} 
                  />
                </TouchableOpacity>

                <View style={styles.bellWrapper}>
                  <TouchableOpacity style={[styles.iconCircle, { backgroundColor: theme.iconCircleBg, borderColor: theme.iconCircleBorder }]}>
                    <Ionicons
                      name="notifications-outline"
                      size={20}
                      color={isDarkMode ? "#94a3b8" : "#334155"}
                    />
                  </TouchableOpacity>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>3</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* USER RECOGNITION PANEL */}
            <View style={[styles.userRow, { backgroundColor: theme.cardBg }]}>
              <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                {avatar ? (
                  <Image source={{ uri: avatar }} style={[styles.avatar, { borderColor: isDarkMode ? "#3b82f6" : "#2563eb" }]} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: theme.avatarPlaceholderBg, borderColor: theme.avatarPlaceholderBorder }]}>
                    <Ionicons
                      name="cloud-upload-outline"
                      size={16}
                      color={isDarkMode ? "#3b82f6" : "#2563eb"}
                    />
                    <Text style={styles.avatarPlaceholderText}>Upload</Text>
                  </View>
                )}

                <View style={[styles.editBadge, { backgroundColor: isDarkMode ? "#3b82f6" : "#2563eb", borderColor: theme.cardBg }]}>
                  <Ionicons name="camera" size={9} color="#fff" />
                </View>
              </TouchableOpacity>

              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[styles.greeting, { color: theme.textSecondary }]}>
                  Welcome,{"\n"}
                  <Text style={{ color: theme.textPrimary, fontWeight: "800" }}>
                    {user?.full_name || "User"}
                  </Text>
                </Text>
              </View>

              <View style={styles.timeBox}>
                <Text style={[styles.timeText, { color: theme.textPrimary }]}>
                  {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
                <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                  {now.toLocaleDateString([], { month: "short", day: "numeric" })}
                </Text>
              </View>
            </View>

            {/* SECURITY SYSTEM MATRIX CARD */}
            <View
              style={[
                styles.safetyCard,
                {
                  borderColor: getStatusColor() + "30",
                  backgroundColor: isDarkMode ? theme.cardBg : getStatusColor() + "08",
                },
              ]}
            >
              <View style={[styles.shieldCircle, { backgroundColor: getStatusColor() + "15" }]}>
                <Ionicons
                  name={status === "idle" || status === "sent" ? "shield-checkmark" : "alert-circle"}
                  size={22}
                  color={getStatusColor()}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: theme.textSecondary }]}>System Status Matrix</Text>
                <Text style={[styles.safeText, { color: getStatusColor() }]}>
                  {getSafetyText()}
                </Text>
                <Text style={[styles.cardSub, { color: theme.textSecondary }]}>Satellite encryption active</Text>

                {countdown !== null && (
                  <View style={styles.countdownContainer}>
                    <Text style={styles.countdown}>
                      Dispatching help in: {countdown}s
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* TELEMETRY METRICS SECTION */}
            <View style={[styles.telemetryCard, { backgroundColor: theme.telemetryBg, borderColor: theme.telemetryBorder }]}>
              <View style={styles.telemetryItem}>
                <MaterialCommunityIcons
                  name="battery-high"
                  size={18}
                  color="#16a34a"
                />
                <Text style={[styles.telemetryLabel, { color: theme.textSecondary }]}>Device Batt</Text>
                <Text style={[styles.telemetryValue, { color: theme.textPrimary }]}>{batteryLevel}</Text>
              </View>

              <View style={[styles.telemetryDivider, { backgroundColor: theme.border }]} />

              <View style={styles.telemetryItem}>
                <MaterialCommunityIcons
                  name="signal-cellular-outline"
                  size={18}
                  color={isDarkMode ? "#3b82f6" : "#2563eb"}
                />
                <Text style={[styles.telemetryLabel, { color: theme.textSecondary }]}>GPS Node</Text>
                <Text style={[styles.telemetryValue, { color: theme.textPrimary }]}>{signalStatus}</Text>
              </View>
            </View>

            {/* COMMAND GRIDS LIST */}
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Command Operations</Text>

            <View style={styles.quickGrid}>
              <ModernAction
                icon="map-marker-radius"
                label="Live Tracking"
                description="GPS Stream"
                color={isDarkMode ? "#3b82f6" : "#2563eb"}
                onPress={goToTracking}
                theme={theme}
              />
              <ModernAction
                icon="wallet-outline"
                label="Secure Wallet"
                description="Transit Ledger"
                color="#475569"
                theme={theme}
              />
              <ModernAction
                icon="shield-car"
                label="Insurance"
                description="Coverage Portal"
                color="#7c3aed"
                theme={theme}
              />
              <ModernAction
                icon="alert-octagon"
                label="Force Distress"
                description="Critical Alert"
                color="#dc2626"
                onPress={handleForceDistress}
                theme={theme}
              />
              <ModernAction
                icon="message-alert"
                label="Rescue Feedback"
                description="Report Outcome"
                color="#0891b2"
                onPress={() => router.push("/(tabs)/rescue-feedback" as any)}
                theme={theme}
              />
            </View>
          </View>

          {/* DYNAMIC DISPATCH SHEET PANEL OVERLAY */}
          {showEmergencyUnits && (
            <View style={[styles.emergencyPanel, { backgroundColor: theme.bottomPanelBg, borderColor: theme.border }]}>
              <View style={styles.emergencyHeader}>
                <View>
                  <Text style={[styles.emergencyTitle, { color: theme.textPrimary }]}>Critical Distress</Text>
                  <Text style={[styles.emergencySub, { color: theme.textSecondary }]}>
                    Select emergency response units
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setShowEmergencyUnits(false)}
                  style={[styles.closePanelButton, { backgroundColor: isDarkMode ? "#334155" : "#f1f5f9" }]}
                >
                  <Ionicons name="close" size={20} color={isDarkMode ? "#94a3b8" : "#334155"} />
                </TouchableOpacity>
              </View>

              <View style={styles.emergencyGrid}>
                {emergencyUnits.map((item) => {
                  const selected = selectedUnits.includes(item.id);

                  return (
                    <TouchableOpacity
                      key={item.id}
                      activeOpacity={0.8}
                      onPress={() => toggleEmergencyUnit(item.id)}
                      style={[
                        styles.emergencyUnitCard,
                        {
                          borderColor: selected ? item.color : theme.border,
                          backgroundColor: selected ? item.color + "10" : theme.actionBoxBg,
                        },
                      ]}
                    >
                      <View style={[styles.emergencyIconCircle, { backgroundColor: item.color + "15" }]}>
                        <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
                      </View>

                      <Text style={[styles.emergencyUnitText, { color: theme.textPrimary }]}>{item.title}</Text>

                      {selected && (
                        <View style={[styles.selectedDot, { backgroundColor: item.color }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.sendDistressBtn}
                activeOpacity={0.9}
                disabled={sendingSOS}
                onPress={sendDistressAlert}
              >
                {sendingSOS ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="alarm-light" size={20} color="#fff" />
                    <Text style={styles.sendDistressText}>Send Critical Distress</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* LOWER FIXED CONTROLS FOOTER */}
          <View style={styles.bottomControls}>
            <TouchableOpacity style={styles.sosCard} onPress={handleSOS} activeOpacity={0.9}>
              <View style={styles.sosButton}>
                <MaterialCommunityIcons name="alarm-light" size={24} color="#fff" />
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.sosCardTitle}>CRITICAL EMERGENCY DISTRESS</Text>
                <Text style={styles.sosCardSub}>Notify authorities instantly</Text>
              </View>

              <View style={[styles.chevronCircle, { backgroundColor: theme.cardBg, borderColor: isDarkMode ? "#7f1d1d" : "#fee2e2" }]}>
                <Ionicons name="chevron-forward" size={14} color="#dc2626" />
              </View>
            </TouchableOpacity>

            <View style={styles.logoutWrapper}>
              <TouchableOpacity style={[styles.logoutButton, { backgroundColor: theme.logoutButtonBg }]} onPress={logout}>
                <MaterialCommunityIcons
                  name="logout"
                  size={14}
                  color={theme.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.logoutText, { color: theme.textSecondary }]}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ModernAction({ icon, label, description, color, onPress, theme }: any) {
  return (
    <TouchableOpacity
      style={[styles.modernActionBox, { backgroundColor: theme.actionBoxBg, borderColor: theme.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIconCircle, { backgroundColor: color + "12" }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={color} />
      </View>

      <Text style={[styles.modernActionLabel, { color: theme.textPrimary }]}>{label}</Text>
      <Text style={[styles.modernActionDesc, { color: theme.textSecondary }]}>{description}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
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
  rightHeaderGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  bellWrapper: {
    position: "relative",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#ef4444",
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#ffffff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "bold",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPlaceholderText: {
    color: "#64748b",
    fontSize: 8,
    marginTop: 2,
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
  },
  greeting: {
    fontSize: 14,
    lineHeight: 20,
  },
  timeBox: {
    marginLeft: "auto",
    alignItems: "flex-end",
  },
  timeText: {
    fontSize: 16,
    fontWeight: "800",
  },
  dateText: {
    fontSize: 11,
    marginTop: 2,
  },
  safetyCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1,
  },
  shieldCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  safeText: {
    fontSize: 18,
    fontWeight: "800",
    marginVertical: 2,
  },
  cardSub: {
    fontSize: 12,
  },
  countdownContainer: {
    marginTop: 6,
  },
  countdown: {
    color: "#dc2626",
    fontWeight: "bold",
    fontSize: 12,
  },
  telemetryCard: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  telemetryItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  telemetryLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
    marginRight: "auto",
  },
  telemetryValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  telemetryDivider: {
    width: 1,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    justifyContent: "space-between",
  },
  modernActionBox: {
    width: (width - 44) / 2,
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    marginHorizontal: 4,
    minHeight: 95,
    marginBottom: 10,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  actionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  modernActionLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  modernActionDesc: {
    fontSize: 10,
    marginTop: 1,
  },
  emergencyPanel: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 5,
  },
  emergencyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  emergencySub: {
    fontSize: 12,
    marginTop: 2,
  },
  closePanelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  emergencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  emergencyUnitCard: {
    width: (width - 56) / 2,
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    alignItems: "center",
    position: "relative",
  },
  emergencyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  emergencyUnitText: {
    fontSize: 12,
    fontWeight: "600",
  },
  selectedDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sendDistressBtn: {
    backgroundColor: "#dc2626",
    flexDirection: "row",
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  sendDistressText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
    marginLeft: 8,
  },
  bottomControls: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sosCard: {
    flexDirection: "row",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fee2e2",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  sosButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#dc2626",
    justifyContent: "center",
    alignItems: "center",
  },
  sosCardTitle: {
    color: "#991b1b",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  sosCardSub: {
    color: "#ef4444",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 1,
  },
  chevronCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  logoutWrapper: {
    alignItems: "center",
    marginTop: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  logoutText: {
    fontSize: 12,
    fontWeight: "600",
  },
});