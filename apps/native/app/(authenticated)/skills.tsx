import { useAuth, useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { RFValue } from "react-native-responsive-fontsize";

export default function SkillsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.replace("/");
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Skills</Text>
        <Text style={styles.subtitle}>
          Welcome, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!
        </Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: RFValue(24),
    fontFamily: "SemiBold",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: RFValue(16),
    fontFamily: "Regular",
    color: "#666",
    marginBottom: 32,
    textAlign: "center",
  },
  logoutButton: {
    backgroundColor: "#0D87E1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  logoutButtonText: {
    color: "#FFF",
    fontFamily: "SemiBold",
    fontSize: RFValue(14),
    textAlign: "center",
  },
});

