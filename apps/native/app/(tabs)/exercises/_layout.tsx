import { isLiquidGlassAvailable } from "expo-glass-effect";
import { router, Stack } from "expo-router";

export default function ExercisesLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Exercises",
          headerStyle: {
            backgroundColor: isLiquidGlassAvailable()
              ? "transparent"
              : "#0D87E1",
          },
          headerLargeTitle: true,
          headerSearchBarOptions: {
            headerIconColor: "#0D87E1",
            tintColor: "#0D87E1",
            textColor: "#0D87E1",
            hintTextColor: "#0D87E1",
            placeholder: "Search speakers",
            onChangeText: (event) => {
              router.setParams({
                q: event.nativeEvent.text,
              });
            },
          },
        }}
      />
    </Stack>
  );
}
