import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
  ScrollView,
  TouchableWithoutFeedback,
} from "react-native";

import OSMMap from "../../components/OSMMap";

import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

import {
  ArrowLeft,
  Send,
  MapPinned,
  ShieldAlert,
  X,
} from "lucide-react-native";

import API from "../../services/api";



const { width, height } =
  Dimensions.get("window");

export default function TrackingScreen() {
  const router = useRouter();

  const trackingStartedRef = useRef(false);

  const watchRef = useRef(null);
  const timerRef = useRef(null);

  const slideAnim = useRef(
    new Animated.Value(0)
  ).current;

  const startTime = useRef(
    Date.now()
  );

  


  const [location, setLocation] =
    useState(null);

  const [duration, setDuration] =
    useState("00:00:00");

  const [distance, setDistance] =
    useState("0.00 km");

  const [speed, setSpeed] =
    useState("0 km/h");

  const [address, setAddress] =
    useState("Getting location...");

  const [user, setUser] =
    useState(null);

  const [tripId, setTripId] =
  useState<number | null>(null);
  

  

  const [safetyScore, setSafetyScore] = useState(100);

  const [riskLevel, setRiskLevel] = useState("SAFE");


  const [sendingReport, setSendingReport] =
    useState(false);

  const [emergencyText, setEmergencyText] =
    useState("");

  const [showPanel, setShowPanel] =
    useState(true);

  const [keyboardVisible, setKeyboardVisible] =
    useState(false);

  /* ===========================
     KEYBOARD EVENTS
  =========================== */
  useEffect(() => {
    const showSub =
      Keyboard.addListener(
        "keyboardDidShow",
        () => {
          setKeyboardVisible(true);
        }
      );

    const hideSub =
      Keyboard.addListener(
        "keyboardDidHide",
        () => {
          setKeyboardVisible(false);
        }
      );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  /* ===========================
     PANEL ANIMATION
  =========================== */
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: showPanel ? 0 : 500,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [showPanel]);

  /* ===========================
     LOAD USER
  =========================== */
  useEffect(() => {
    const loadUser = async () => {
      try {
        const u =
          await AsyncStorage.getItem(
            "user"
          );

        if (u) {
          setUser(JSON.parse(u));
        }
      } catch (err) {
        console.log(err);
      }
    };

    loadUser();
  }, []);

  /* ===========================
     INIT TRACKING
  =========================== */
  useEffect(() => {
    initializeTracking();

    return () => {
      watchRef.current?.remove();

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const initializeTracking =
    async () => {
      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (
          status !== "granted"
        ) {
          Alert.alert(
            "Permission Required",
            "Enable location access."
          );

          return;
        }

        const current =
          await Location.getCurrentPositionAsync(
            {
              accuracy:
                Location.Accuracy.Highest,
            }
          );

        const coords = {
          latitude:
            current.coords.latitude,
          longitude:
            current.coords.longitude,
        };

        setLocation(coords);

        try {
          const geo =
            await Location.reverseGeocodeAsync(
              coords
            );

          if (geo?.[0]) {
            const addr = [
              geo[0].name,
              geo[0].street,
              geo[0].city,
              geo[0].region,
              geo[0].country,
            ]
              .filter(Boolean)
              .join(", ");

            setAddress(addr);

            if (!trackingStartedRef.current) {
              trackingStartedRef.current = true;
              await startTrip(addr);
            }
          }
        } catch {}

        startTimer();
        startLiveTracking();
      } catch (err) {
        console.log(err);

        Alert.alert(
          "GPS Error",
          "Failed to initialize tracking."
        );
      }
    };

  /* ===========================
     TIMER
  =========================== */
  const startTimer = () => {
    timerRef.current =
      setInterval(() => {
        const diff =
          Date.now() -
          startTime.current;

        const sec =
          Math.floor(
            diff / 1000
          ) % 60;

        const min =
          Math.floor(
            diff / 60000
          ) % 60;

        const hr =
          Math.floor(
            diff / 3600000
          );

        setDuration(
          `${String(hr).padStart(
            2,
            "0"
          )}:${String(
            min
          ).padStart(
            2,
            "0"
          )}:${String(
            sec
          ).padStart(
            2,
            "0"
          )}`
        );
      }, 1000);
  };
  

  /* ===========================
     LIVE TRACKING
  =========================== */
  const startLiveTracking =
    async () => {
      try {
        watchRef.current =
          await Location.watchPositionAsync(
            {
              accuracy:
                Location.Accuracy.Highest,
              timeInterval: 3000,
              distanceInterval: 3,
            },
            async (pos) => {
              if (
                !pos?.coords
              )
                return;

              const coords = {
                latitude:
                  pos.coords.latitude,
                longitude:
                  pos.coords.longitude,
              };

              setLocation(coords);

              if (tripId) {
                try {
                  const token =
                    await AsyncStorage.getItem(
                      "token"
                    );

                  const res = await API.put(
                    `/tracking/${tripId}/location`,
                    {
                      latitude: coords.latitude,
                      longitude: coords.longitude,
                    },
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    }
                  );

                  console.log(
                    "LOCATION UPDATE:",
                    res.data
                  );

                  setSafetyScore(
                    res.data.safety_score
                  );

                  setRiskLevel(
                    res.data.risk_level
                  );
                                  } catch (err) {
                  console.log(err);
                }
              }

              const speedKmh =
                pos.coords.speed
                  ? (
                      pos.coords
                        .speed * 3.6
                    ).toFixed(0)
                  : "0";

              setSpeed(
                `${speedKmh} km/h`
              );
            }
          );
      } catch (err) {
        console.log(err);
      }
    };

  /* ===========================
     GET LOCATION
  =========================== */
  const getLocation =
    async () => {
      const loc =
        await Location.getCurrentPositionAsync(
          {
            accuracy:
              Location.Accuracy.Highest,
          }
        );

      return {
        latitude:
          loc.coords.latitude,
        longitude:
          loc.coords.longitude,
      };
    };

  /* ===========================
   START TRIP
=========================== */
const startTrip = async (
  startAddress: string
) => {
  try {
    const token =
      await AsyncStorage.getItem(
        "token"
      );

    const res = await API.post(
      "/tracking/start",
      {
        start_location: startAddress,
        destination: "Unknown",
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log(
      "Trip Started:",
      res.data
    );

    setTripId(res.data.id);

  } catch (err) {
    console.log(
      "START TRIP ERROR:",
      err
    );
  }
};

/* ===========================
   END TRIP
=========================== */
const endTrip = async () => {
  try {
    if (!tripId) return;

    const token = await AsyncStorage.getItem("token");

    await API.put(
      `/tracking/${tripId}/end`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // 🛑 STOP GPS WATCH
    watchRef.current?.remove();

    // ⏱ STOP TIMER
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    Alert.alert(
      "Trip Ended",
      "Tracking stopped successfully."
    );

    // 🔁 OPTIONAL: go home
    router.push("/(tabs)/home");

  } catch (err) {
    console.log(err);
    Alert.alert("Error", "Failed to end trip");
  }
};

  /* ===========================
     SHARE REPORT
  =========================== */
  const shareLocationAndReport =
    async () => {
      try {
        setSendingReport(true);

        const token =
          await AsyncStorage.getItem(
            "token"
          );

        if (
          !token ||
          !user
        ) {
          Alert.alert(
            "Error",
            "User not logged in"
          );

          return;
        }

        const currentLocation =
          await getLocation();

        const params =
          new URLSearchParams();

        params.append(
          "user_id",
          String(user?.id)
        );

        params.append(
          "full_name",
          user?.full_name || ""
        );

        params.append(
          "phone",
          user?.phone || ""
        );

        params.append(
          "email",
          user?.email || ""
        );

        params.append(
          "latitude",
          String(
            currentLocation.latitude
          )
        );

        params.append(
          "longitude",
          String(
            currentLocation.longitude
          )
        );

        params.append(
          "address",
          address
        );

        params.append(
          "emergency_message",
          emergencyText
        );

        await API.post(
          "/emergency/share-location",
          params.toString(),
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type":
                "application/x-www-form-urlencoded",
            },
          }
        );

        Keyboard.dismiss();

        setEmergencyText("");

        Alert.alert(
          "Emergency Sent",
          "Location & emergency report shared successfully."
        );

        setShowPanel(false);
      } catch (err) {
        console.log(err);

        Alert.alert(
          "Error",
          "Failed to send emergency report."
        );
      } finally {
        setSendingReport(false);
      }
    };

  /* ===========================
     LOADING
  =========================== */
  if (!location) {
    return (
      <View
        style={
          styles.loading
        }
      >
        <ActivityIndicator
          size="large"
          color="#ef4444"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Initializing GPS...
        </Text>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback
      onPress={() =>
        Keyboard.dismiss()
      }
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : "height"
        }
        keyboardVerticalOffset={
          Platform.OS === "ios"
            ? 40
            : 0
        }
      >
        <View
          style={
            styles.container
          }
        >
          <StatusBar barStyle="light-content" />

          {/* MAP */}
          <TouchableOpacity
            activeOpacity={1}
            style={{ flex: 1 }}
            onPress={() =>
              setShowPanel(
                !showPanel
              )
            }
          >
            <OSMMap
              latitude={
                location.latitude
              }
              longitude={
                location.longitude
              }
            />
          </TouchableOpacity>

          {/* HEADER */}
          <SafeAreaView
            style={
              styles.topContainer
            }
          >
            <View
              style={
                styles.headerCard
              }
            >
              <View
                style={
                  styles.headerTop
                }
              >
                <ShieldAlert
                  size={22}
                  color="#ef4444"
                />

                <Text
                  style={
                    styles.headerTitle
                  }
                >
                  Emergency Tracking
                </Text>
              </View>

              <View
                style={
                  styles.statsRow
                }
              >
                <View
                  style={
                    styles.statCard
                  }
                >
                  <Text
                    style={
                      styles.statLabel
                    }
                  >
                    Duration
                  </Text>

                  <Text
                    style={
                      styles.statValue
                    }
                  >
                    {duration}
                  </Text>
                </View>

                <View
                  style={
                    styles.statCard
                  }
                >
                  <Text
                    style={
                      styles.statLabel
                    }
                  >
                    Distance
                  </Text>

                  <Text
                    style={
                      styles.statValue
                    }
                  >
                    {distance}
                  </Text>
                </View>

                <View
                  style={
                    styles.statCard
                  }
                >
                  <Text
                    style={
                      styles.statLabel
                    }
                  >
                    Speed
                  </Text>

                  <Text
                    style={
                      styles.statValue
                    }
                  >
                    {speed}
                  </Text>

                  <View
                    style={{
                      marginTop: 15,
                      backgroundColor: "#111827",
                      borderRadius: 15,
                      padding: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "700",
                      }}
                    >
                      Safety Score: {safetyScore}
                    </Text>

                    <Text
                      style={{
                        color:
                          riskLevel === "SAFE"
                            ? "#22c55e"
                            : riskLevel === "LOW"
                            ? "#84cc16"
                            : riskLevel === "MEDIUM"
                            ? "#facc15"
                            : riskLevel === "HIGH"
                            ? "#f97316"
                            : "#ef4444",
                        marginTop: 5,
                        fontWeight: "700",
                      }}
                    >
                      Risk Level: {riskLevel}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </SafeAreaView>

          {/* FLOATING PANEL */}
          <Animated.View
            style={[
              styles.panel,
              {
                transform: [
                  {
                    translateY:
                      slideAnim,
                  },
                ],

                bottom:
                  keyboardVisible
                    ? 0
                    : 0,
              },
            ]}
          >
            <View
              style={
                styles.handle
              }
            />

            {/* CLOSE */}
            <TouchableOpacity
              style={
                styles.closeBtn
              }
              onPress={() =>
                setShowPanel(false)
              }
            >
              <X
                size={20}
                color="#fff"
              />
            </TouchableOpacity>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={
                false
              }
            >
              {/* LOCATION */}
              <View
                style={
                  styles.locationBox
                }
              >
                <Text
                  style={
                    styles.locationTitle
                  }
                >
                  Current Location
                </Text>

                <Text
                  style={
                    styles.locationText
                  }
                >
                  {address}
                </Text>
              </View>

              {/* INPUT */}
              <View
                style={
                  styles.messageContainer
                }
              >
                <Text
                  style={
                    styles.messageTitle
                  }
                >
                  Emergency Description
                </Text>

                <TextInput
                  placeholder="Describe your emergency..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  value={
                    emergencyText
                  }
                  onChangeText={
                    setEmergencyText
                  }
                  style={
                    styles.messageInput
                  }
                  textAlignVertical="top"
                />
              </View>

              {/* BUTTONS */}
              <View
                style={styles.buttonRow}
              >
                {/* BACK BUTTON */}
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() =>
                    router.push(
                      "/(tabs)/home"
                    )
                  }
                >
                  <ArrowLeft
                    size={22}
                    color="#fff"
                  />
                </TouchableOpacity>

                {/* 🛑 STOP TRIP BUTTON (ADDED) */}
                <TouchableOpacity
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 18,
                    backgroundColor: "#ef4444",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                  onPress={endTrip}   // ✅ FIXED (uses your existing function)
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontWeight: "700",
                    }}
                  >
                    STOP
                  </Text>
                </TouchableOpacity>

                {/* SHARE EMERGENCY */}
                <TouchableOpacity
                  style={styles.shareBtn}
                  disabled={sendingReport}
                  onPress={shareLocationAndReport}
                >
                  {sendingReport ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <MapPinned
                        size={18}
                        color="#fff"
                      />

                      <Text
                        style={styles.shareText}
                      >
                        Share Emergency
                      </Text>

                      <Send
                        size={18}
                        color="#fff"
                      />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#020617",
    },

    loading: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#020617",
    },

    loadingText: {
      color: "#fff",
      marginTop: 12,
      fontSize: 16,
    },

    topContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
    },

    headerCard: {
      marginTop: 55,
      marginHorizontal: 16,
      backgroundColor:
        "rgba(15,23,42,0.92)",
      borderRadius: 24,
      padding: 18,
      borderWidth: 1,
      borderColor:
        "rgba(239,68,68,0.25)",
    },

    headerTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: 18,
    },

    headerTitle: {
      color: "#fff",
      fontSize: 18,
      fontWeight: "700",
    },

    statsRow: {
      flexDirection: "row",
      justifyContent:
        "space-between",
    },

    statCard: {
      flex: 1,
      backgroundColor:
        "#111827",
      marginHorizontal: 4,
      borderRadius: 18,
      paddingVertical: 14,
      alignItems: "center",
    },

    statLabel: {
      color: "#94a3b8",
      fontSize: 12,
      marginBottom: 6,
    },

    statValue: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700",
    },

    panel: {
      position: "absolute",
      left: 0,
      right: 0,
      backgroundColor:
        "#0f172a",
      borderTopLeftRadius: 34,
      borderTopRightRadius: 34,
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 30,
      borderTopWidth: 2,
      borderTopColor:
        "rgba(239,68,68,0.4)",
      maxHeight: height * 0.75,
    },

    handle: {
      width: 70,
      height: 6,
      backgroundColor:
        "#475569",
      borderRadius: 20,
      alignSelf: "center",
      marginBottom: 18,
    },

    closeBtn: {
      position: "absolute",
      top: 18,
      right: 18,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor:
        "#dc2626",
      justifyContent:
        "center",
      alignItems:
        "center",
      zIndex: 99,
    },

    locationBox: {
      backgroundColor:
        "#111827",
      borderRadius: 20,
      padding: 16,
      marginTop: 10,
    },

    locationTitle: {
      color: "#ef4444",
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 6,
    },

    locationText: {
      color: "#cbd5e1",
      lineHeight: 22,
    },

    messageContainer: {
      marginTop: 18,
    },

    messageTitle: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 10,
    },

    messageInput: {
      minHeight: 180,
      backgroundColor:
        "#111827",
      borderRadius: 22,
      padding: 18,
      color: "#fff",
      fontSize: 16,
      borderWidth: 1,
      borderColor:
        "rgba(239,68,68,0.25)",
    },

    buttonRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 22,
      marginBottom: 20,
    },

    backBtn: {
      width: 58,
      height: 58,
      borderRadius: 18,
      backgroundColor:
        "#1e293b",
      justifyContent:
        "center",
      alignItems:
        "center",
      marginRight: 12,
    },

    shareBtn: {
      flex: 1,
      height: 58,
      borderRadius: 18,
      backgroundColor:
        "#dc2626",
      justifyContent:
        "center",
      alignItems:
        "center",
      flexDirection: "row",
      gap: 10,
    },

    shareText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 15,
    },
  });