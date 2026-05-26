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
  ActivityIndicator,
} from "react-native";

import MapView, {
  Marker,
  Polyline,
  PROVIDER_GOOGLE,
} from "react-native-maps";

import * as Location from "expo-location";
import { captureRef } from "react-native-view-shot";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Send,
  MapPinned,
} from "lucide-react-native";

import API from "../../services/api";

const { width, height } = Dimensions.get("window");

/* ===========================
   DISTANCE CALCULATOR
=========================== */
const getDistance = (p1: any, p2: any) => {
  const R = 6371;

  const dLat =
    ((p2.latitude - p1.latitude) * Math.PI) / 180;

  const dLon =
    ((p2.longitude - p1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((p1.latitude * Math.PI) / 180) *
      Math.cos((p2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return (
    2 *
    R *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );
};

export default function TrackingScreen() {
  const router = useRouter();

  const mapRef = useRef<any>(null);
  const watchRef = useRef<any>(null);
  const screenRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  const startTime = useRef(Date.now());

  const [location, setLocation] =
    useState<any>(null);

  const [routeCoordinates, setRouteCoordinates] =
    useState<any[]>([]);

  const [duration, setDuration] =
    useState("00:00:00");

  const [distance, setDistance] =
    useState("0.00 km");

  const [speed, setSpeed] =
    useState("0 km/h");

  const [address, setAddress] =
    useState("Getting location...");

  const [user, setUser] =
    useState<any>(null);

  const [sendingReport, setSendingReport] =
    useState(false);

  /* ===========================
     LOAD USER
  =========================== */
  useEffect(() => {
    const loadUser = async () => {
      try {
        const u =
          await AsyncStorage.getItem("user");

        if (u) {
          setUser(JSON.parse(u));
        }
      } catch (err) {
        console.log(
          "USER LOAD ERROR:",
          err
        );
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
        clearInterval(
          timerRef.current
        );
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
            "Enable location access to continue."
          );
          return;
        }

        const current =
          await Location.getCurrentPositionAsync(
            {
              accuracy:
                Location.Accuracy.High,
            }
          );

        const coords = {
          latitude:
            current.coords.latitude,
          longitude:
            current.coords.longitude,
        };

        setLocation(coords);
        setRouteCoordinates([
          coords,
        ]);

        // quick placeholder first
        setAddress("Location detected");

        try {
          const geo = await Location.reverseGeocodeAsync(coords);

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

            setAddress(addr || "Location detected");
          }
        } catch (e) {
          console.log("GEOCODE ERROR:", e);
          setAddress("Location detected");
        }

        startTimer();
        startLiveTracking();
      } catch (err) {
        console.log(
          "INIT ERROR:",
          err
        );

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
            (pos) => {
              if (
                !pos?.coords
              )
                return;

              const coords = {
                latitude:
                  pos.coords
                    .latitude,
                longitude:
                  pos.coords
                    .longitude,
              };

              setLocation(
                coords
              );

              setRouteCoordinates(
                (
                  prev
                ) => {
                  const updated =
                    [
                      ...prev,
                      coords,
                    ];

                  if (
                    updated.length >
                    1
                  ) {
                    const last =
                      updated[
                        updated.length -
                          2
                      ];

                    const d =
                      getDistance(
                        last,
                        coords
                      );

                    setDistance(
                      (
                        prevD
                      ) => {
                        const current =
                          parseFloat(
                            prevD
                          ) ||
                          0;

                        return `${(
                          current +
                          d
                        ).toFixed(
                          2
                        )} km`;
                      }
                    );
                  }

                  return updated;
                }
              );

              if (mapRef.current && coords.latitude && coords.longitude) {
                mapRef.current.animateToRegion({
                  ...coords,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                });
              }
                            const speedKmh =
                pos.coords
                  .speed !==
                  null &&
                pos.coords
                  .speed !==
                  undefined
                  ? (
                      pos.coords
                        .speed *
                      3.6
                    ).toFixed(
                      0
                    )
                  : "0";

              setSpeed(
                `${speedKmh} km/h`
              );

              // Safe reverse geocode
              if (
                Math.random() <
                0.25
              ) {
                Location.reverseGeocodeAsync(
                  coords
                )
                  .then(
                    (
                      geo
                    ) => {
                      if (
                        geo?.[0]
                      ) {
                        const addr =
                          [
                            geo[0]
                              .name,
                            geo[0]
                              .street,
                            geo[0]
                              .city,
                            geo[0]
                              .region,
                            geo[0]
                              .country,
                          ]
                            .filter(
                              Boolean
                            )
                            .join(
                              ", "
                            );

                        setAddress(
                          addr ||
                            "Unknown location"
                        );
                      }
                    }
                  )
                  .catch(
                    (
                      err
                    ) => {
                      console.log(
                        "Reverse geocode error:",
                        err
                      );
                    }
                  );
              }
            }
          );
      } catch (err) {
        console.log(
          "TRACKING ERROR:",
          err
        );

        Alert.alert(
          "Tracking Error",
          "Unable to start live GPS tracking."
        );
      }
    };

  /* ===========================
     GET CURRENT LOCATION
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
          loc.coords
            .latitude,
        longitude:
          loc.coords
            .longitude,
      };
    };

  /* ===========================
     SHARE LOCATION
  =========================== */
  const shareLocationAndScreenshot =
    async () => {
      try {
        setSendingReport(
          true
        );

        const token =
          await AsyncStorage.getItem(
            "token"
          );

        const currentLocation =
          await getLocation();

        const uri =
          await captureRef(
            screenRef.current,
            {
              format:
                "jpg",
              quality:
                0.8,
            }
          );

        const formData =
          new FormData();

        formData.append(
          "user_id",
          String(
            user?.id
          )
        );

        formData.append(
          "full_name",
          user?.full_name ||
            ""
        );

        formData.append(
          "phone",
          user?.phone ||
            "UNKNOWN"
        );

        formData.append(
          "email",
          user?.email ||
            ""
        );

        formData.append(
          "latitude",
          String(
            currentLocation.latitude
          )
        );

        formData.append(
          "longitude",
          String(
            currentLocation.longitude
          )
        );

        formData.append(
          "address",
          address
        );

        formData.append(
          "screenshot",
          {
            uri,
            name: `tracking_${Date.now()}.jpg`,
            type: "image/jpeg",
          } as any
        );

        await API.post(
          "/emergency/share-location",
          formData,
          {
            headers:
              {
                Authorization: `Bearer ${token}`,
                "Content-Type":
                  "multipart/form-data",
              },
          }
        );

        Alert.alert(
          "Success",
          "Live location shared successfully."
        );
      } catch (
        err: any
      ) {
        console.log(
          "UPLOAD ERROR:",
          err
            ?.response
            ?.data ||
            err.message
        );

        Alert.alert(
          "Error",
          "Failed to share location."
        );
      } finally {
        setSendingReport(
          false
        );
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
          color="#00F5B0"
        />
        <Text
          style={{
            color:
              "#fff",
            marginTop:
              12,
          }}
        >
          Initializing GPS...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={
        styles.container
      }
      ref={screenRef}
      collapsable={false}
    >
      <SafeAreaView
        style={{
          flex: 1,
        }}
      >
        <StatusBar barStyle="light-content" />

        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={
            styles.map
          }
          showsUserLocation
          initialRegion={{
            ...location,
            latitudeDelta:
              0.01,
            longitudeDelta:
              0.01,
          }}
        >
          <Polyline
            coordinates={
              routeCoordinates
            }
            strokeColor="#00F5B0"
            strokeWidth={
              5
            }
          />

          <Marker
            coordinate={
              location
            }
          />
        </MapView>

        <View
          style={
            styles.card
          }
        >
          <Text
            style={
              styles.title
            }
          >
            Live Tracking
          </Text>

          <Text
            style={
              styles.text
            }
          >
            Duration:{" "}
            {
              duration
            }
          </Text>

          <Text
            style={
              styles.text
            }
          >
            Distance:{" "}
            {
              distance
            }
          </Text>

          <Text
            style={
              styles.text
            }
          >
            Speed:{" "}
            {
              speed
            }
          </Text>
        </View>

        <View
          style={
            styles.addressCard
          }
        >
          <Text
            style={
              styles.addressTitle
            }
          >
            Current Location
          </Text>

          <Text
            style={
              styles.address
            }
          >
            {
              address
            }
          </Text>
        </View>

        <TouchableOpacity
          style={
            styles.shareBtn
          }
          disabled={
            sendingReport
          }
          onPress={
            shareLocationAndScreenshot
          }
        >
          {sendingReport ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MapPinned
                size={
                  18
                }
                color="#fff"
              />
              <Text
                style={
                  styles.btnText
                }
              >
                Share Live Location
              </Text>
              <Send
                size={
                  16
                }
                color="#fff"
              />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={
            styles.redirectArrowBtn
          }
          onPress={() =>
            router.push(
              "/(tabs)/home"
            )
          }
        >
          <ArrowLeft
            size={
              24
            }
            color="#00F5B0"
          />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor:
        "#07111F",
    },

    map: {
      width,
      height,
    },

    loading: {
      flex: 1,
      justifyContent:
        "center",
      alignItems:
        "center",
      backgroundColor:
        "#07111F",
    },

    card: {
      position:
        "absolute",
      top: 80,
      left: 20,
      right: 20,
      backgroundColor:
        "#0B1624",
      padding: 16,
      borderRadius:
        16,
    },

    title: {
      color:
        "#00F5B0",
      fontSize: 18,
      fontWeight:
        "bold",
    },

    text: {
      color:
        "#fff",
      marginTop: 4,
    },

    addressCard: {
      position:
        "absolute",
      bottom: 180,
      left: 20,
      right: 20,
      backgroundColor:
        "#0B1624",
      padding: 14,
      borderRadius:
        12,
    },

    addressTitle: {
      color:
        "#fff",
      fontWeight:
        "bold",
    },

    address: {
      color:
        "#9ca3af",
      marginTop: 4,
    },

    shareBtn: {
      position:
        "absolute",
      bottom: 80,
      left: 20,
      right: 90,
      backgroundColor:
        "#2563eb",
      padding: 16,
      borderRadius:
        18,
      flexDirection:
        "row",
      justifyContent:
        "center",
      alignItems:
        "center",
      gap: 8,
    },

    btnText: {
      color:
        "#fff",
      fontWeight:
        "700",
    },

    redirectArrowBtn:
      {
        position:
          "absolute",
        bottom: 80,
        right: 20,
        width: 56,
        height: 56,
        backgroundColor:
          "#0B1624",
        borderRadius:
          14,
        justifyContent:
          "center",
        alignItems:
          "center",
      },
  });