import { Stack } from "expo-router";

export default function ExercisesLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerLargeTitleShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Exercises",
        }}
      />
    </Stack>
  );
}

