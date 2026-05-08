import React, { useState } from "react";
import { View, Text } from "react-native";
import { TextInput, Button } from "react-native-paper";
import { useAuthStore } from "../../store/authStore";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    try {
      await login(email, password);
      navigation.replace("Home");
    } catch (error) {
      console.log("Login error:", error);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 20 }}>
        Welcome Back
      </Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        style={{ marginBottom: 15 }}
      />

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        mode="outlined"
        style={{ marginBottom: 20 }}
      />

      <Button mode="contained" onPress={handleLogin}>
        Login
      </Button>
    </View>
  );
};

export default LoginScreen;