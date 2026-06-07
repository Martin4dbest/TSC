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
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* HEADER SECTION WITH BACK BUTTON */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>
        Emergency Outcome Report
      </Text>

      <Text style={styles.subtitle}>
        Let the admin know what happened after your emergency request.
      </Text>

      <Text style={styles.label}>
        Were you rescued or assisted?
      </Text>

      <View style={styles.options}>
        <TouchableOpacity
          style={[
            styles.option,
            status === "rescued" ? styles.selectedRescued : null,
          ]}
          onPress={() => setStatus("rescued")}
          activeOpacity={0.8}
        >
          <Text style={[styles.optionText, status === "rescued" ? styles.selectedRescuedText : null]}>
            ✅ Rescued Successfully
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.option,
            status === "helped" ? styles.selectedHelped : null,
          ]}
          onPress={() => setStatus("helped")}
          activeOpacity={0.8}
        >
          <Text style={[styles.optionText, status === "helped" ? styles.selectedHelpedText : null]}>
            🤝 Help Was Provided
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.option,
            status === "not_helped" ? styles.selectedNotHelped : null,
          ]}
          onPress={() => setStatus("not_helped")}
          activeOpacity={0.8}
        >
          <Text style={[styles.optionText, status === "not_helped" ? styles.selectedNotHelpedText : null]}>
            ❌ No Help Received
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>
        Describe what happened
      </Text>

      <TextInput
        style={styles.textArea}
        multiline
        numberOfLines={8}
        placeholder="Describe the incident, response time, who assisted you, and any additional information..."
        placeholderTextColor="#9ca3af"
        value={feedback}
        onChangeText={setFeedback}
      />

      <TouchableOpacity
        style={styles.submitBtn}
        onPress={submitFeedback}
        disabled={loading}
        activeOpacity={0.9}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>
            Submit Report
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 50,
    backgroundColor: "#ffffff",
    flexGrow: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },

  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },

  backButtonText: {
    fontSize: 14,
    color: "#4b5563",
    fontWeight: "600",
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    letterSpacing: -0.5,
  },

  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 25,
    lineHeight: 20,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 10,
  },

  options: {
    marginBottom: 25,
  },

  option: {
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#f9fafb",
  },

  // Color-specific selection variants
  selectedRescued: {
    borderColor: "#10b981",
    backgroundColor: "#ecfdf5",
  },

  selectedRescuedText: {
    color: "#065f46",
    fontWeight: "600",
  },

  selectedHelped: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },

  selectedHelpedText: {
    color: "#1e40af",
    fontWeight: "600",
  },

  selectedNotHelped: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
  },

  selectedNotHelpedText: {
    color: "#991b1b",
    fontWeight: "600",
  },

  optionText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },

  textArea: {
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 15,
    height: 160,
    textAlignVertical: "top",
    backgroundColor: "#f9fafb",
    marginBottom: 25,
    fontSize: 15,
    color: "#111827",
  },

  submitBtn: {
    backgroundColor: "#2563eb",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },

  submitText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});