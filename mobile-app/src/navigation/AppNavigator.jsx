import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// ✅ Correct imports based on your folders
import LoginScreen from "../screens/Auth/LoginScreen";
import HomeScreen from "../screens/Home/HomeScreen";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Auth */}
        <Stack.Screen name="Login" component={LoginScreen} />

        {/* Main */}
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;