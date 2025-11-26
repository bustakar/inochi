import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { LogBox, Platform, StatusBar, View } from "react-native";
import ConvexClientProvider from "../ConvexClientProvider";

export default function RootLayout() {
  LogBox.ignoreLogs(["Warning: ..."]);
  LogBox.ignoreAllLogs();

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

  const STATUS_BAR_HEIGHT =
    Platform.OS === "ios" ? 50 : StatusBar.currentHeight;

  return (
    <ConvexClientProvider>
      <View style={{ flex: 1 }}>
        <View style={{ height: STATUS_BAR_HEIGHT, backgroundColor: "#0D87E1" }}>
          <StatusBar
            translucent
            backgroundColor={"#0D87E1"}
            barStyle="light-content"
          />
        </View>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </View>
    </ConvexClientProvider>
  );
}
