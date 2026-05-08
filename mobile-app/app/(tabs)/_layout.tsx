import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" }, // hides bottom bar
      }}
    >
      <Tabs.Screen name="index" options={{ title: "" }} />
    </Tabs>
  );
}