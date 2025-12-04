import { useSSO, useUser } from "@clerk/clerk-expo";
import { AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";

const getOAuthStrategy = (
  authType: string,
): "oauth_google" | "oauth_apple" | "oauth_github" => {
  switch (authType) {
    case "google":
      return "oauth_google";
    case "apple":
      return "oauth_apple";
    case "github":
      return "oauth_github";
    default:
      throw new Error(`Unknown auth type: ${authType}`);
  }
};

export default function LoginScreen() {
  const { startSSOFlow } = useSSO();
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace("/(tabs)/exercises");
    }
  }, [isLoaded, isSignedIn, router]);

  const onPress = async (authType: string) => {
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: getOAuthStrategy(authType),
      });
      if (createdSessionId && setActive) {
        void setActive({ session: createdSessionId });
        router.replace("/(tabs)/exercises");
      }
    } catch (err) {
      console.error("OAuth error", err);
    }
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          source={require("../src/assets/icons/logo.png")}
          style={styles.logo}
        />
        <Text style={styles.title}>Log in to your account</Text>
        <Text style={styles.subtitle}>Welcome! Please login below.</Text>
        <TouchableOpacity
          style={styles.buttonGoogle}
          onPress={() => onPress("github")}
        >
          {/* <Image
            style={styles.githubIcon}
            source={require("../src/assets/icons/github.png")}
          /> */}
          <Text style={{ ...styles.buttonText, color: "#344054" }}>
            Continue with GitHub
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonGoogle}
          onPress={() => onPress("google")}
        >
          <Image
            style={styles.googleIcon}
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            source={require("../src/assets/icons/google.png")}
          />
          <Text style={{ ...styles.buttonText, color: "#344054" }}>
            Continue with Google
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonApple}
          onPress={() => onPress("apple")}
        >
          <AntDesign name="apple" size={24} color="black" />
          <Text
            style={{ ...styles.buttonText, color: "#344054", marginLeft: 12 }}
          >
            Continue with Apple
          </Text>
        </TouchableOpacity>

        <View style={styles.signupContainer}>
          <Text style={{ fontFamily: "Regular" }}>Don't have an account? </Text>
          <Text>Sign up above.</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    padding: 10,
    alignItems: "center",
    width: "98%",
  },
  logo: {
    width: 74,
    height: 74,
    marginTop: 20,
  },
  title: {
    marginTop: 49,
    fontSize: RFValue(21),
    fontFamily: "SemiBold",
  },
  subtitle: {
    marginTop: 8,
    fontSize: RFValue(14),
    color: "#000",
    fontFamily: "Regular",
    marginBottom: 32,
    textAlign: "center",
  },
  buttonText: {
    textAlign: "center",
    color: "#FFF",
    fontFamily: "SemiBold",
    fontSize: RFValue(14),
  },
  buttonGoogle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    width: "100%",
    marginBottom: 12,
    height: 44,
  },
  buttonApple: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    width: "100%",
    marginBottom: 32,
  },
  signupContainer: {
    flexDirection: "row",
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
});
