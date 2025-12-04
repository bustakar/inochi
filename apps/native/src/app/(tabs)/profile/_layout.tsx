import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Stack } from "expo-router";

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Profile",
          headerStyle: {
            backgroundColor: isLiquidGlassAvailable()
              ? "transparent"
              : "#0D87E1",
          },
          headerLargeTitle: true,
        }}
      />
    </Stack>
  );
}

