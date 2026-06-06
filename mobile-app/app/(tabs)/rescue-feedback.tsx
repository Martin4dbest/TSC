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

import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../../services/api";

export default function RescueFeedback() {
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
            status === "rescued" ? styles.selected : null,
          ]}
          onPress={() => setStatus("rescued")}
        >
          <Text style={styles.optionText}>
            ✅ Rescued Successfully
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.option,
            status === "helped" ? styles.selected : null,
          ]}
          onPress={() => setStatus("helped")}
        >
          <Text style={styles.optionText}>
            🤝 Help Was Provided
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.option,
            status === "not_helped" ? styles.selected : null,
          ]}
          onPress={() => setStatus("not_helped")}
        >
          <Text style={styles.optionText}>
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
        value={feedback}
        onChangeText={setFeedback}
      />

      <TouchableOpacity
        style={styles.submitBtn}
        onPress={submitFeedback}
        disabled={loading}
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

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 25,
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
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    backgroundColor: "#ffffff",
  },

  selected: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },

  optionText: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "500",
  },

  textArea: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    padding: 15,
    height: 180,
    textAlignVertical: "top",
    backgroundColor: "#ffffff",
    marginBottom: 25,
  },

  submitBtn: {
    backgroundColor: "#2563eb",
    height: 55,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  submitText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});