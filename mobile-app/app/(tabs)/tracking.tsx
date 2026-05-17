import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
  StatusBar,
  SafeAreaView,
} from "react-native";

import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import { captureRef } from "react-native-view-shot";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native"; 
import API from "../../services/api";

const { width, height } = Dimensions.get("window");

/* ===========================
   DISTANCE CALCULATOR
=========================== */
const getDistance = (p1, p2) => {
  const R = 6371;

  const dLat = ((p2.latitude - p1.latitude) * Math.PI) / 180;
  const dLon = ((p2.longitude - p1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((p1.latitude * Math.PI) / 180) *
      Math.cos((p2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function TrackingScreen() {
  const router = useRouter();

  const mapRef = useRef(null);
  const watchRef = useRef(null);
  const screenRef = useRef(null);

  const startTime = useRef(Date.now());

  const [location, setLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  const [duration, setDuration] = useState("00:00:00");
  const [distance, setDistance] = useState("0.00 km");
  const [speed, setSpeed] = useState("0 km/h");

  const [address, setAddress] = useState("Fetching location...");
  const [user, setUser] = useState(null);

  const [sendingSOS, setSendingSOS] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);

  const [status, setStatus] = useState("idle");

  /* ===========================
     LOAD USER
  =========================== */
  useEffect(() => {
    const loadUser = async () => {
      const u = await AsyncStorage.getItem("user");
      if (u) setUser(JSON.parse(u));
    };
    loadUser();
  }, []);

  /* ===========================
     INIT TRACKING
  =========================== */
  useEffect(() => {
    initializeTracking();

    return () => {
      if (watchRef.current) {
        watchRef.current.remove();
      }
    };
  }, []);

  const initializeTracking = async () => {
    try {
      const { status } =
        await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission Required", "Enable location access");
        return;
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const coords = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };

      setLocation(coords);
      setRouteCoordinates([coords]);

      const geo = await Location.reverseGeocodeAsync(coords);

      const addr = geo?.[0]
        ? `${geo[0].name || ""} ${geo[0].street || ""}, ${
            geo[0].city || ""
          }`
        : "Unknown location";

      setAddress(addr);

      startTimer();
      startLiveTracking();
    } catch (e) {
      console.log("INIT ERROR:", e);
    }
  };

  /* ===========================
     TIMER
  =========================== */
  const startTimer = () => {
    setInterval(() => {
      const diff = Date.now() - startTime.current;

      const sec = Math.floor(diff / 1000) % 60;
      const min = Math.floor(diff / 60000) % 60;
      const hr = Math.floor(diff / 3600000);

      setDuration(
        `${String(hr).padStart(2, "0")}:${String(min).padStart(
          2,
          "0"
        )}:${String(sec).padStart(2, "0")}`
      );
    }, 1000);
  };

  /* ===========================
     LIVE TRACKING
  =========================== */
  const startLiveTracking = async () => {
    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        timeInterval: 3000,
        distanceInterval: 3,
      },
      (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };

        setLocation(coords);

        setRouteCoordinates((prev) => {
          const updated = [...prev, coords];

          if (updated.length > 1) {
            const last = updated[updated.length - 2];
            const d = getDistance(last, coords);

            setDistance((prevD) => {
              const current = parseFloat(prevD) || 0;
              return `${(current + d).toFixed(2)} km`;
            });
          }

          return updated;
        });

        mapRef.current?.animateToRegion({
          ...coords,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        });

        const speedKmh = ((pos.coords.speed || 0) * 3.6).toFixed(0);
        setSpeed(`${speedKmh} km/h`);
      }
    );
  };

  /* ===========================
     GET CURRENT LOCATION
  =========================== */
  const getLocation = async () => {
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });

    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };
  };

  /* ===========================
     SHARE LOCATION + SCREENSHOT (FIXED)
  =========================== */
  const shareLocationAndScreenshot = async () => {
    try {
      setSendingReport(true);

      const token = await AsyncStorage.getItem("token");
      const currentLocation = await getLocation();

      // capture screen
      const uri = await captureRef(screenRef, {
        format: "jpg",
        quality: 0.8,
      });

      if (!uri) {
        throw new Error("Screenshot capture failed");
      }

      const formData = new FormData();

      formData.append("user_id", String(user?.id));
      formData.append("full_name", user?.full_name || "");
      formData.append("latitude", String(currentLocation.latitude));
      formData.append("longitude", String(currentLocation.longitude));
      formData.append("address", address || "Unknown location");

      formData.append("screenshot", {
        uri,
        name: `tracking_${Date.now()}.jpg`,
        type: "image/jpeg",
      } as any);

      const res = await API.post(
        "/emergency/share-location",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("UPLOAD SUCCESS:", res.data);

      Alert.alert("Success", "Location + screenshot sent successfully");
    } catch (err: any) {
      console.log("UPLOAD ERROR:", err?.response?.data || err.message);
      Alert.alert("Error", "Failed to send location report");
    } finally {
      setSendingReport(false);
    }
  };

  /* ===========================
     UI LOADING
  =========================== */
  if (!location) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: "#fff" }}>Initializing GPS...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} ref={screenRef}>
      <StatusBar barStyle="light-content" />

      {/* MAP */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          ...location,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Polyline
          coordinates={routeCoordinates}
          strokeColor="#00F5B0"
          strokeWidth={5}
        />

        <Marker coordinate={location} />
      </MapView>

      {/* INFO CARD */}
      <View style={styles.card}>
        <Text style={styles.title}>Live Tracking</Text>
        <Text style={styles.text}>Duration: {duration}</Text>
        <Text style={styles.text}>Distance: {distance}</Text>
        <Text style={styles.text}>Speed: {speed}</Text>
      </View>

      {/* ADDRESS */}
      <View style={styles.addressCard}>
        <Text style={styles.addressTitle}>Current Location</Text>
        <Text style={styles.address}>{address}</Text>
      </View>

      {/* SHARE BUTTON */}
      <TouchableOpacity
        style={styles.shareBtn}
        onPress={shareLocationAndScreenshot}
      >
        <Text style={styles.btnText}>
          {sendingReport ? "Sending..." : "Share Location + Screenshot"}
        </Text>
      </TouchableOpacity>

      {/* VISIBLE REDIRECT ARROW BUTTON BENEATH BY THE RIGHT END */}
      <TouchableOpacity
        style={styles.redirectArrowBtn}
        onPress={() => router.push("/(tabs)/home")} // Fixed targeted home path within expo router group structure
        activeOpacity={0.7}
      >
        <ArrowLeft size={24} color="#00F5B0" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

/* ===========================
   STYLES
=========================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07111F",
  },

  map: {
    width,
    height,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#07111F",
  },

  card: {
    position: "absolute",
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: "#0B1624",
    padding: 16,
    borderRadius: 16,
  },

  title: {
    color: "#00F5B0",
    fontSize: 18,
    fontWeight: "bold",
  },

  text: {
    color: "#fff",
    marginTop: 4,
  },

  addressCard: {
    position: "absolute",
    bottom: 180,
    left: 20,
    right: 20,
    backgroundColor: "#0B1624",
    padding: 14,
    borderRadius: 12,
  },

  addressTitle: {
    color: "#fff",
    fontWeight: "bold",
  },

  address: {
    color: "#9ca3af",
    marginTop: 4,
  },

  shareBtn: {
    position: "absolute",
    bottom: 80,
    left: 20,
    right: 90,
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontWeight: "bold",
  },

  redirectArrowBtn: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    backgroundColor: "#0B1624",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#1E293B",
    zIndex: 999,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});