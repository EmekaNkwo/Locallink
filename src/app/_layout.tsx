import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import { useEffect } from "react";
import { useColorScheme } from "react-native";

import { AnimatedSplashOverlay } from "@/components/animated-icon";
import { useBatteryStore, useMessageStore } from "@/store";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const hydrate = useMessageStore((state) => state.hydrate);
  const hydrateBattery = useBatteryStore((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
    void hydrateBattery();
  }, [hydrate, hydrateBattery]);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="talk"
          options={{ presentation: "fullScreenModal", animation: "fade" }}
        />
        <Stack.Screen name="splash-screen" />
      </Stack>
    </ThemeProvider>
  );
}
