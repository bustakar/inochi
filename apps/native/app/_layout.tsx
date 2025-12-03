import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ConvexClientProvider from "../ConvexClientProvider";

export default function RootLayout() {
  const [loaded] = useFonts({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    Bold: require("../src/assets/fonts/Inter-Bold.ttf"),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    SemiBold: require("../src/assets/fonts/Inter-SemiBold.ttf"),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    Medium: require("../src/assets/fonts/Inter-Medium.ttf"),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    Regular: require("../src/assets/fonts/Inter-Regular.ttf"),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    MBold: require("../src/assets/fonts/Montserrat-Bold.ttf"),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    MSemiBold: require("../src/assets/fonts/Montserrat-SemiBold.ttf"),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    MMedium: require("../src/assets/fonts/Montserrat-Medium.ttf"),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    MRegular: require("../src/assets/fonts/Montserrat-Regular.ttf"),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    MLight: require("../src/assets/fonts/Montserrat-Light.ttf"),
  });

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ConvexClientProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </ConvexClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
