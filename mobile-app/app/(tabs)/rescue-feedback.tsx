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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API from "../../services/api";

export default function RescueFeedback() {
  const navigation = useNavigation<any>();
  const [status, setStatus] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const submitFeedback = async () => {
    // ... [Your existing logic remains unchanged]
    try {
      if (!status) { Alert.alert("Required", "Please select an outcome."); return; }
      if (!feedback.trim()) { Alert.alert("Required", "Please provide details."); return; }
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const user = JSON.parse((await AsyncStorage.getItem("user")) || "{}");
      await API.post("/emergency/feedback", { user_id: user.id, full_name: user.full_name, outcome: status, feedback: feedback }, { headers: { Authorization: `Bearer ${token}` } });
      Alert.alert("Submitted", "Report sent successfully.", [{ text: "OK", onPress: () => { setStatus(""); setFeedback(""); navigation.navigate("home"); } }]);
    } catch (error) { Alert.alert("Error", "Unable to submit."); } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#065f46" />
      
      {/* Header with Green Theme */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Emergency Outcome</Text>
        <Text style={styles.headerSubtitle}>Evaluate your dispatch request response.</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.sectionLabel}>Resolution Status</Text>
          <View style={styles.optionsContainer}>
            <TouchableOpacity style={[styles.optionCard, status === "rescued" && styles.activeCard]} onPress={() => setStatus("rescued")}>
              <Text style={[styles.optionText, status === "rescued" && styles.activeText]}>✅ Rescued Successfully</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.optionCard, status === "helped" && styles.activeCard]} onPress={() => setStatus("helped")}>
              <Text style={[styles.optionText, status === "helped" && styles.activeText]}>🤝 Partial Help Provided</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.optionCard, status === "not_helped" && styles.activeCard]} onPress={() => setStatus("not_helped")}>
              <Text style={[styles.optionText, status === "not_helped" && styles.activeText]}>❌ No Help Received</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionLabel}>Incident Log Details</Text>
          <TextInput
            style={styles.textArea}
            multiline
            placeholder="Describe the outcome..."
            placeholderTextColor="#9ca3af"
            value={feedback}
            onChangeText={setFeedback}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={submitFeedback}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit Official Report</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f3f4f6" },
  header: { backgroundColor: "#065f46", padding: 24, paddingTop: 40, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTitle: { color: "#ffffff", fontSize: 28, fontWeight: "800" },
  headerSubtitle: { color: "#d1fae5", marginTop: 4, fontSize: 14 },
  scrollContainer: { padding: 20 },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: "#374151", marginBottom: 12, marginTop: 10 },
  optionsContainer: { gap: 12 },
  optionCard: { backgroundColor: "#ffffff", padding: 20, borderRadius: 16, borderWidth: 2, borderColor: "#e5e7eb" },
  activeCard: { borderColor: "#065f46", backgroundColor: "#ecfdf5" },
  optionText: { fontSize: 16, fontWeight: "600", color: "#4b5563" },
  activeText: { color: "#065f46" },
  textArea: { backgroundColor: "#ffffff", borderRadius: 16, padding: 16, height: 120, fontSize: 16, borderWidth: 1, borderColor: "#e5e7eb", textAlignVertical: "top" },
  submitBtn: { backgroundColor: "#065f46", marginTop: 24, padding: 18, borderRadius: 16, alignItems: "center" },
  submitText: { color: "#ffffff", fontSize: 16, fontWeight: "700" }
});