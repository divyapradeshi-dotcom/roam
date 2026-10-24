import { useClerk, useUser } from "@clerk/expo";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { posthog } from "@/lib/posthog";

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const displayName = user?.firstName || "Joanna";

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
      posthog?.capture("user_signed_out");
      router.replace("/");
    } catch (error) {
      Alert.alert(
        "Unable to sign out",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          {user?.primaryEmailAddress?.emailAddress ? (
            <Text style={styles.email}>{user.primaryEmailAddress.emailAddress}</Text>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={isSigningOut}
          onPress={handleSignOut}
          style={({ pressed }) => [styles.signOut, (pressed || isSigningOut) && styles.pressed]}
        >
          <Text style={styles.signOutText}>{isSigningOut ? "Signing out..." : "Sign out"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { flex: 1, paddingHorizontal: 22, paddingTop: 26 },
  eyebrow: {
    color: "#8D7AB8",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 11,
    letterSpacing: 1.5,
  },
  title: {
    marginTop: 8,
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 36,
    letterSpacing: -1.8,
  },
  profileCard: {
    alignItems: "center",
    marginTop: 25,
    paddingVertical: 28,
    borderRadius: 22,
    backgroundColor: "#F6F5F8",
  },
  avatar: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 36,
    backgroundColor: "#FFDEA0",
  },
  avatarInitial: { color: "#111116", fontFamily: "Manrope_800ExtraBold", fontSize: 27 },
  name: { marginTop: 12, color: "#111116", fontFamily: "Manrope_800ExtraBold", fontSize: 18 },
  email: {
    marginTop: 3,
    color: "#777780",
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
  },
  signOut: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
    borderRadius: 26,
    backgroundColor: "#FFC12F",
  },
  signOutText: { color: "#111116", fontFamily: "Manrope_800ExtraBold", fontSize: 14 },
  pressed: { opacity: 0.78 },
});
