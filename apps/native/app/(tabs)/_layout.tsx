import { useAuth } from "@clerk/clerk-expo";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Redirect } from "expo-router";
import {
  Icon,
  Label,
  NativeTabs,
  VectorIcon,
} from "expo-router/unstable-native-tabs";
import { ActivityIndicator, Platform, View } from "react-native";
import type { ColorValue, ImageSourcePropType } from "react-native";

interface VectorIconFamily {
  getImageSource: (
    name: string,
    size: number,
    color: ColorValue,
  ) => Promise<ImageSourcePropType>;
}

const TINT_COLOR = "#0D87E1";
const INACTIVE_COLOR = "#71717A";

export default function TabsLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={TINT_COLOR} />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/" />;
  }

  return (
    <NativeTabs
      tintColor={TINT_COLOR}
      iconColor={INACTIVE_COLOR}
      labelStyle={{ color: INACTIVE_COLOR }}
      labelVisibilityMode="labeled"
    >
      <NativeTabs.Trigger name="exercises">
        {Platform.select({
          ios: <Icon sf="dumbbell.fill" />,
          android: (
            <Icon
              src={
                <VectorIcon
                  family={MaterialCommunityIcons as VectorIconFamily}
                  name="dumbbell"
                />
              }
              selectedColor={TINT_COLOR}
            />
          ),
        })}
        <Label>Exercises</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        {Platform.select({
          ios: <Icon sf="person.fill" />,
          android: (
            <Icon
              src={
                <VectorIcon
                  family={MaterialCommunityIcons as VectorIconFamily}
                  name="account"
                />
              }
              selectedColor={TINT_COLOR}
            />
          ),
        })}
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
