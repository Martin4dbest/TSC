import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from "react-native";

import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=2070&auto=format&fit=crop",
        }}
        style={styles.heroImage}
      >
        <LinearGradient
          colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.7)", "#050816"]}
          style={styles.overlay}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >

              {/* TOP ROW */}
              <View style={styles.topRow}>
                <View style={styles.logoBox}>
                  <Text style={styles.logoText}>TSC</Text>
                </View>

                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              </View>

              {/* TITLE */}
              <Text style={styles.title}>Travel Safe</Text>
              <Text style={styles.titleGreen}>Anywhere</Text>

              {/* SUBTITLE */}
              <Text style={styles.subtitle}>
                Smart global protection for travelers,
                transport systems and emergency response.
              </Text>

              {/* MAP CARD */}
              <View style={styles.mapCard}>
                <ImageBackground
                  source={{
                    uri: "https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1974&auto=format&fit=crop",
                  }}
                  style={styles.mapImage}
                >
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.85)"]}
                    style={styles.mapOverlay}
                  >
                    <Text style={styles.mapTitle}>
                      Global Tracking
                    </Text>
                    <Text style={styles.mapSubtitle}>
                      GPS • AI Safety • SOS Alerts
                    </Text>
                  </LinearGradient>
                </ImageBackground>
              </View>

              {/* TRANSPORT GRID */}
              <View style={styles.transportGrid}>
                <View style={styles.transportCard}>
                  <Text style={styles.transportEmoji}>✈️</Text>
                  <Text style={styles.transportTitle}>Flights</Text>
                </View>

                <View style={styles.transportCard}>
                  <Text style={styles.transportEmoji}>🚌</Text>
                  <Text style={styles.transportTitle}>Transit</Text>
                </View>

                <View style={styles.transportCard}>
                  <Text style={styles.transportEmoji}>🚗</Text>
                  <Text style={styles.transportTitle}>Cars</Text>
                </View>

                <View style={styles.transportCard}>
                  <Text style={styles.transportEmoji}>🚨</Text>
                  <Text style={styles.transportTitle}>SOS</Text>
                </View>
              </View>

              {/* STATS */}
              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>24/7</Text>
                  <Text style={styles.statLabel}>Monitoring</Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>AI</Text>
                  <Text style={styles.statLabel}>Protection</Text>
                </View>

                <View style={styles.statCard}>
                  <Text style={styles.statNumber}>GPS</Text>
                  <Text style={styles.statLabel}>Tracking</Text>
                </View>
              </View>

              {/* BUTTONS */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push("/(auth)/register")}
              >
                <LinearGradient
                  colors={["#00E5A8", "#00C896"]}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.primaryButtonText}>
                    Create Account
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => router.push("/(auth)/login")}
              >
                <Text style={styles.secondaryButtonText}>
                  Login
                </Text>
              </TouchableOpacity>

            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
  },

  heroImage: {
    width,
    height,
  },

  overlay: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
  },

  logoBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "rgba(0,229,168,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },

  logoText: {
    color: "#00E5A8",
    fontSize: 16,
    fontWeight: "900",
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00E5A8",
    marginRight: 6,
  },

  liveText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },

  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
  },

  titleGreen: {
    color: "#00E5A8",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 10,
  },

  subtitle: {
    color: "#CBD5E1",
    fontSize: 12,
    lineHeight: 20,
    marginBottom: 20,
  },

  mapCard: {
    height: 160,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
  },

  mapImage: {
    width: "100%",
    height: "100%",
  },

  mapOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 14,
  },

  mapTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },

  mapSubtitle: {
    color: "#CBD5E1",
    fontSize: 10,
  },

  transportGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  transportCard: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },

  transportEmoji: {
    fontSize: 22,
    marginBottom: 6,
  },

  transportTitle: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },

  statCard: {
    width: "31%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },

  statNumber: {
    color: "#00E5A8",
    fontSize: 16,
    fontWeight: "900",
  },

  statLabel: {
    color: "#CBD5E1",
    fontSize: 9,
  },

  primaryButton: {
    borderRadius: 16,
    overflow: "hidden",
  },

  buttonGradient: {
    paddingVertical: 14,
    borderRadius: 16,
  },

  primaryButtonText: {
    textAlign: "center",
    color: "#000",
    fontSize: 14,
    fontWeight: "800",
  },

  secondaryButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#00E5A8",
    paddingVertical: 14,
    borderRadius: 16,
  },

  secondaryButtonText: {
    textAlign: "center",
    color: "#00E5A8",
    fontSize: 14,
    fontWeight: "800",
  },
});