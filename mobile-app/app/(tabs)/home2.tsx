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
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

import {
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

import * as ImagePicker from "expo-image-picker";

import API from "../../services/api";

export default function HomeDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);

  const [avatar, setAvatar] = useState<string | null>(null);

  const [activities, setActivities] = useState<any[]>([]);

  const [now, setNow] = useState(new Date());

  const [status, setStatus] = useState<
    "idle" | "preparing" | "sending" | "sent" | "failed"
  >("idle");

  const [sendingSOS, setSendingSOS] = useState(false);

  const [countdown, setCountdown] =
    useState<number | null>(null);

  /* ======================================
     LOAD USER
  ====================================== */

  useEffect(() => {
    const loadUser = async () => {
      const u =
        await AsyncStorage.getItem("user");

      const savedAvatar =
        await AsyncStorage.getItem(
          "avatar"
        );

      if (u) setUser(JSON.parse(u));

      if (savedAvatar)
        setAvatar(savedAvatar);

      fetchRecentTracking();
    };

    loadUser();
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
     FETCH TRACKING
  ====================================== */

  const fetchRecentTracking =
    async () => {
      try {
        const token =
          await AsyncStorage.getItem(
            "token"
          );

        const res = await API.get(
          "/tracking/recent",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const formatted = res.data.map(
          (item: any) => ({
            text: `Trip Activity`,
            time: new Date(
              item.created_at
            ).toLocaleTimeString(),

            color: "#00e5a8",
          })
        );

        setActivities(formatted);
      } catch (err) {
        console.log(err);
      }
    };

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
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Permission Required",
        "Please allow gallery access."
      );

      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync(
        {
          mediaTypes:
            ImagePicker.MediaTypeOptions
              .Images,

          allowsEditing: true,

          aspect: [1, 1],

          quality: 0.8,
        }
      );

    if (!result.canceled) {
      const imageUri =
        result.assets[0].uri;

      setAvatar(imageUri);

      await AsyncStorage.setItem(
        "avatar",
        imageUri
      );

      try {
        const token =
          await AsyncStorage.getItem(
            "token"
          );

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

              "Content-Type":
                "multipart/form-data",
            },
          }
        );
      } catch (err) {
        console.log(
          "Upload Failed",
          err
        );
      }
    }
  };

  /* ======================================
     SOS
  ====================================== */

  const getLocation = async () => ({
    latitude: 6.5244,
    longitude: 3.3792,
  });

  const sendSOS = async () => {
    try {
      setSendingSOS(true);

      setStatus("sending");

      const token =
        await AsyncStorage.getItem(
          "token"
        );

      const location =
        await getLocation();

      await API.post(
        "/emergency/sos",
        {
          user_id: user?.id,

          full_name:
            user?.full_name,

          latitude:
            location.latitude,

          longitude:
            location.longitude,

          message:
            "EMERGENCY ALERT 🚨",
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

      fetchRecentTracking();
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

            const interval =
              setInterval(() => {
                count -= 1;

                setCountdown(count);

                if (count <= 0) {
                  clearInterval(
                    interval
                  );

                  sendSOS();
                }
              }, 1000);
          },
        },
      ]
    );
  };

  /* ======================================
     STATUS
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
        return "YOU ARE SAFE";
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
  ====================================== */

  const goToTracking = () => {
    router.push("/tracking");
  };

  /* ======================================
     UI
  ====================================== */

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
      />

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.scroll
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Ionicons
            name="menu"
            size={28}
            color="#fff"
          />

          <Text style={styles.logo}>
            TSC
          </Text>

          <View style={styles.bellWrapper}>
            <Ionicons
              name="notifications-outline"
              size={26}
              color="#fff"
            />

            <View style={styles.badge}>
              <Text
                style={styles.badgeText}
              >
                3
              </Text>
            </View>
          </View>
        </View>

        {/* USER */}

        <View style={styles.userRow}>
          <TouchableOpacity
            onPress={pickImage}
          >
            <Image
              source={{
                uri:
                  avatar ||
                  "https://randomuser.me/api/portraits/men/32.jpg",
              }}
              style={styles.avatar}
            />
          </TouchableOpacity>

          <View>
            <Text
              style={styles.greeting}
            >
              Hello{" "}
              <Text
                style={{
                  color: "#00e5a8",
                }}
              >
                {user?.full_name ||
                  "User"}{" "}
                👋
              </Text>
            </Text>

            <Text
              style={styles.subText}
            >
              Tap photo to change
            </Text>
          </View>

          <View style={styles.timeBox}>
            <Text
              style={styles.dateText}
            >
              {now.toDateString()}
            </Text>

            <Text
              style={styles.timeText}
            >
              {now.toLocaleTimeString()}
            </Text>
          </View>
        </View>

        {/* SAFETY */}

        <View style={styles.safetyCard}>
          <View
            style={styles.shieldCircle}
          >
            <Ionicons
              name="shield-checkmark"
              size={30}
              color="#00e5a8"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={styles.cardTitle}
            >
              Safety Status
            </Text>

            <Text
              style={[
                styles.safeText,
                {
                  color:
                    getStatusColor(),
                },
              ]}
            >
              {getSafetyText()}
            </Text>

            <Text
              style={styles.cardSub}
            >
              Real-time monitoring
              active
            </Text>

            {countdown !== null && (
              <Text
                style={
                  styles.countdown
                }
              >
                SOS in {countdown}
              </Text>
            )}
          </View>

          <View style={styles.liveTag}>
            <View
              style={styles.greenDot}
            />

            <Text
              style={styles.liveText}
            >
              Live
            </Text>
          </View>
        </View>

        {/* QUICK ACTIONS */}

        <View style={styles.quickRow}>
          {/* TRACKING */}

          <Action
            icon="map-marker"
            label="Tracking"
            color="#00e5a8"
            onPress={goToTracking}
          />

          {/* WALLET */}

          <Action
            icon="wallet"
            label="Wallet"
            color="#3b82f6"
          />

          {/* INSURANCE */}

          <Action
            icon="shield-check"
            label="Insurance"
            color="#a855f7"
          />

          {/* SOS */}

          <Action
            icon="alarm-light"
            label="Emergency"
            color="#ef4444"
            onPress={handleSOS}
          />
        </View>

        {/* SOS CARD */}

        <TouchableOpacity
          style={styles.sosCard}
          onPress={handleSOS}
        >
          <View style={styles.sosButton}>
            <Text style={styles.sosText}>
              SOS
            </Text>
          </View>

          <View
            style={{
              flex: 1,
              marginLeft: 15,
            }}
          >
            <Text
              style={styles.cardTitle}
            >
              Need Help?
            </Text>

            <Text
              style={styles.cardSub}
            >
              Tap to send emergency
              alert
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={22}
            color="#fff"
          />
        </TouchableOpacity>

        {/* ACTIVITY */}

        <Text style={styles.sectionTitle}>
          Recent Tracking Activity
        </Text>

        <View style={styles.activityBox}>
          {activities.length ===
          0 ? (
            <Text
              style={styles.noActivity}
            >
              No recent tracking yet
            </Text>
          ) : (
            activities.map(
              (item, i) => (
                <View
                  key={i}
                  style={
                    styles.activityRow
                  }
                >
                  <View
                    style={[
                      styles.dot,
                      {
                        backgroundColor:
                          item.color,
                      },
                    ]}
                  />

                  <Text
                    style={
                      styles.activityText
                    }
                  >
                    {item.text}
                  </Text>

                  <Text
                    style={
                      styles.activityTime
                    }
                  >
                    {item.time}
                  </Text>
                </View>
              )
            )
          )}
        </View>

        {/* LOGOUT */}

        <TouchableOpacity
          style={styles.logout}
          onPress={logout}
        >
          <Text
            style={styles.logoutText}
          >
            Logout
          </Text>
        </TouchableOpacity>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

/* ======================================
   ACTION
====================================== */

function Action({
  icon,
  label,
  color,
  onPress,
}: any) {
  return (
    <TouchableOpacity
      style={styles.actionBox}
      onPress={onPress}
    >
      <View
        style={[
          styles.actionIcon,
          {
            backgroundColor:
              color + "20",
          },
        ]}
      >
        <MaterialCommunityIcons
          name={icon}
          size={24}
          color={color}
        />
      </View>

      <Text style={styles.actionText}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ======================================
   STYLES
====================================== */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1220",
  },

  scroll: {
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    alignItems: "center",
  },

  logo: {
    color: "#00e5a8",
    fontSize: 20,
    fontWeight: "bold",
  },

  bellWrapper: {
    position: "relative",
  },

  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "red",
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },

  badgeText: {
    color: "#fff",
    fontSize: 10,
  },

  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },

  avatar: {
    width: 55,
    height: 55,
    borderRadius: 30,
  },

  greeting: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
  },

  subText: {
    color: "#9ca3af",
    marginLeft: 10,
  },

  timeBox: {
    marginLeft: "auto",
    alignItems: "flex-end",
  },

  dateText: {
    color: "#9ca3af",
    fontSize: 12,
  },

  timeText: {
    color: "#00e5a8",
    fontSize: 15,
    fontWeight: "bold",
  },

  safetyCard: {
    flexDirection: "row",
    margin: 20,
    padding: 15,
    borderRadius: 18,
    backgroundColor: "#111a2e",
    alignItems: "center",
  },

  shieldCircle: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: "#00e5a820",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  cardTitle: {
    color: "#9ca3af",
  },

  safeText: {
    fontSize: 16,
    fontWeight: "bold",
  },

  cardSub: {
    color: "#9ca3af",
    fontSize: 12,
  },

  countdown: {
    color: "#f59e0b",
    marginTop: 4,
  },

  liveTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f2937",
    padding: 6,
    borderRadius: 10,
  },

  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#00e5a8",
    marginRight: 5,
  },

  liveText: {
    color: "#00e5a8",
  },

  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginVertical: 15,
  },

  actionBox: {
    alignItems: "center",
    width: "23%",
  },

  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  actionText: {
    color: "#fff",
    marginTop: 6,
    fontSize: 12,
  },

  sosCard: {
    flexDirection: "row",
    backgroundColor: "#111a2e",
    margin: 20,
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
  },

  sosButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
  },

  sosText: {
    color: "#fff",
    fontWeight: "bold",
  },

  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 20,
    marginBottom: 10,
  },

  activityBox: {
    backgroundColor: "#111a2e",
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 12,
  },

  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },

  activityText: {
    color: "#fff",
    flex: 1,
  },

  activityTime: {
    color: "#9ca3af",
    fontSize: 12,
  },

  noActivity: {
    color: "#9ca3af",
    textAlign: "center",
  },

  logout: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 14,
    backgroundColor: "#1f2937",
    borderRadius: 12,
  },

  logoutText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});