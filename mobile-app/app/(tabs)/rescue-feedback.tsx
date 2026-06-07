import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../../services/api";

export default function RescueFeedback() {
  const navigation = useNavigation();
  const [status, setStatus] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const submitFeedback = async () => {
    try {
      if (!status) {
        Alert.alert("Required", "Please select an outcome.");
        return;
      }

      if (!feedback.trim()) {
        Alert.alert("Required", "Please provide details.");
        return;
      }

      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      const user = JSON.parse(
        (await AsyncStorage.getItem("user")) || "{}"
      );

      await API.post(
        "/emergency/feedback",
        {
          user_id: user.id,
          full_name: user.full_name,
          outcome: status,
          feedback: feedback,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Alert.alert(
        "Submitted Successfully",
        "Your emergency outcome report has been sent to the admin."
      );

      setStatus("");
      setFeedback("");
      
      // Explicitly return to home dashboard layout configuration
      navigation.navigate("Home" as never);
    } catch (error) {
      console.log(error);

      Alert.alert(
        "Submission Failed",
        "Unable to submit report. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Emergency Outcome</Text>
        <Text style={styles.subtitle}>
          Help us evaluate response effectiveness by confirming what happened following your dispatch request.
        </Text>

        <Text style={styles.label}>Resolution Status</Text>
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.optionCard,
              status === "rescued" ? styles.selectedRescuedCard : null,
            ]}
            onPress={() => setStatus("rescued")}
            activeOpacity={0.85}
          >
            <View style={[styles.radioDot, status === "rescued" ? styles.radioDotRescued : null]}>
              {status === "rescued" && <View style={[styles.radioDotInner, { backgroundColor: "#10b981" }]} />}
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, status === "rescued" ? styles.textRescued : null]}>
                ✅ Rescued Successfully
              </Text>
              <Text style={styles.optionDescription}>First responders arrived and handled the incident.</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              status === "helped" ? styles.selectedHelpedCard : null,
            ]}
            onPress={() => setStatus("helped")}
            activeOpacity={0.85}
          >
            <View style={[styles.radioDot, status === "helped" ? styles.radioDotHelped : null]}>
              {status === "helped" && <View style={[styles.radioDotInner, { backgroundColor: "#2563eb" }]} />}
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, status === "helped" ? styles.textHelped : null]}>
                🤝 Partial Help Provided
              </Text>
              <Text style={styles.optionDescription}>Assistance was received via alternative bystanders or contacts.</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              status === "not_helped" ? styles.selectedNotHelpedCard : null,
            ]}
            onPress={() => setStatus("not_helped")}
            activeOpacity={0.85}
          >
            <View style={[styles.radioDot, status === "not_helped" ? styles.radioDotNotHelped : null]}>
              {status === "not_helped" && <View style={[styles.radioDotInner, { backgroundColor: "#ef4444" }]} />}
            </View>
            <View style={styles.optionContent}>
              <Text style={[styles.optionTitle, status === "not_helped" ? styles.textNotHelped : null]}>
                ❌ No Help Received
              </Text>
              <Text style={styles.optionDescription}>No units arrived or emergency requirements were unfulfilled.</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Incident Log Details</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.modernTextArea}
            multiline
            numberOfLines={6}
            placeholder="Provide context regarding response arrival delays, dispatch personnel names, situational outcomes, or general operational notes..."
            placeholderTextColor="#9ca3af"
            value={feedback}
            onChangeText={setFeedback}
            underlineColorAndroid="transparent"
          />
        </View>

        <TouchableOpacity
          style={[styles.premiumSubmitBtn, !status || !feedback.trim() ? styles.disabledBtn : null]}
          onPress={submitFeedback}
          disabled={loading}
          activeOpacity={0.9}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.premiumSubmitText}>Submit Official Report</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* FLOATING BOTTOM RIGHT BACK BUTTON */}
      <TouchableOpacity 
        style={styles.floatingBottomRightBack} 
        onPress={() => navigation.navigate("Home" as never)}
        activeOpacity={0.8}
      >
        <Text style={styles.floatingBackText}>Home →</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  scrollContainer: {
    padding: 24,
    paddingTop: 32,
    paddingBottom: 110, // Generous padding to prevent element conflict with the floating button
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 8,
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 22,
    marginBottom: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1.5,
    borderColor: "#f3f4f6",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },
  optionContent: {
    flex: 1,
    marginLeft: 12,
  },
  radioDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  radioDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 16,
  },
  selectedRescuedCard: { 
    borderColor: "#10b981", 
    backgroundColor: "#f0fdf4" 
  },
  radioDotRescued: { 
    borderColor: "#10b981" 
  },
  textRescued: { 
    color: "#065f46" 
  },
  selectedHelpedCard: { 
    borderColor: "#2563eb", 
    backgroundColor: "#eff6ff" 
  },
  radioDotHelped: { 
    borderColor: "#2563eb" 
  },
  textHelped: { 
    color: "#1e40af" 
  },
  selectedNotHelpedCard: { 
    borderColor: "#ef4444", 
    backgroundColor: "#fdf2f2" 
  },
  radioDotNotHelped: { 
    borderColor: "#ef4444" 
  },
  textNotHelped: { 
    color: "#991b1b" 
  },
  inputWrapper: {
    backgroundColor: "#f9fafb",
    borderWidth: 1.5,
    borderColor: "#f3f4f6",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 32,
  },
  modernTextArea: {
    height: 130,
    textAlignVertical: "top",
    fontSize: 15,
    color: "#111827",
    lineHeight: 22,
  },
  premiumSubmitBtn: {
    backgroundColor: "#111827",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  disabledBtn: {
    opacity: 0.4,
  },
  premiumSubmitText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  floatingBottomRightBack: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  floatingBackText: {
    color: "#374151",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
});