import { useClerk, useUser } from "@clerk/expo";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineIcon } from "@/components/roam-ui";
import { posthog } from "@/lib/posthog";

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const displayName =
    user?.fullName ||
    (typeof user?.unsafeMetadata?.fullName === "string"
      ? (user.unsafeMetadata.fullName as string).trim()
      : "") ||
    (user?.firstName
      ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
      : "") ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Explorer";

  const userImage =
    user?.imageUrl ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=260&h=260&q=85";

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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.topRow}>
          <Text style={styles.logo}>roam</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={() => {}}
            style={({ pressed }) => [styles.settingsBtn, pressed && styles.pressed]}
          >
            <LineIcon name="settings" size={20} color="#111116" strokeWidth={2.2} />
          </Pressable>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <Image source={{ uri: userImage }} style={styles.avatar} />
          <View style={styles.userInfo}>
            <Text numberOfLines={1} style={styles.userName}>
              {displayName}
            </Text>
            <View style={styles.locationRow}>
              <LineIcon name="pin" size={14} color="#85858E" strokeWidth={2.2} />
              <Text style={styles.locationText}>San Francisco, CA</Text>
            </View>
            <View style={styles.badgePill}>
              <Text style={styles.badgeIcon}>⭐</Text>
              <Text style={styles.badgeText}>Roam Explorer</Text>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Trips</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.statNumber}>4.9</Text>
            </View>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>

        {/* Account Section */}
        <Text style={styles.sectionHeading}>Account</Text>
        <View style={styles.menuCard}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
          >
            <View style={styles.menuIconWrap}>
              <LineIcon name="person" size={20} color="#111116" strokeWidth={2.2} />
            </View>
            <Text style={styles.menuTitle}>Personal info</Text>
            <LineIcon name="chevron-right" size={18} color="#85858E" strokeWidth={2.2} />
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
          >
            <View style={styles.menuIconWrap}>
              <LineIcon name="card" size={20} color="#111116" strokeWidth={2.2} />
            </View>
            <Text style={styles.menuTitle}>Payment methods</Text>
            <LineIcon name="chevron-right" size={18} color="#85858E" strokeWidth={2.2} />
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/trips")}
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
          >
            <View style={styles.menuIconWrap}>
              <LineIcon name="suitcase" size={20} color="#111116" strokeWidth={2.2} />
            </View>
            <Text style={styles.menuTitle}>Trips</Text>
            <LineIcon name="chevron-right" size={18} color="#85858E" strokeWidth={2.2} />
          </Pressable>
        </View>

        {/* Preferences Section */}
        <Text style={styles.sectionHeading}>Preferences</Text>
        <View style={styles.menuCard}>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
          >
            <View style={styles.menuIconWrap}>
              <LineIcon name="bell" size={20} color="#111116" strokeWidth={2.2} />
            </View>
            <Text style={styles.menuTitle}>Notifications</Text>
            <LineIcon name="chevron-right" size={18} color="#85858E" strokeWidth={2.2} />
          </Pressable>

          <View style={styles.menuDivider} />

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
          >
            <View style={styles.menuIconWrap}>
              <LineIcon name="help" size={20} color="#111116" strokeWidth={2.2} />
            </View>
            <Text style={styles.menuTitle}>Help & support</Text>
            <LineIcon name="chevron-right" size={18} color="#85858E" strokeWidth={2.2} />
          </Pressable>
        </View>

        {/* Free Cancellation Banner */}
        <View style={styles.policyCard}>
          <View style={styles.policyIconWrap}>
            <LineIcon name="policy" size={22} color="#7C5DFA" strokeWidth={2.2} />
          </View>
          <View style={styles.policyCopy}>
            <Text style={styles.policyTitle}>Free cancellation</Text>
            <Text style={styles.policySubtitle}>
              Full refund up to 7 days before check-in.
            </Text>
          </View>
          <LineIcon name="chevron-right" size={18} color="#85858E" strokeWidth={2.2} />
        </View>

        {/* Sign Out Button */}
        <Pressable
          accessibilityRole="button"
          disabled={isSigningOut}
          onPress={handleSignOut}
          style={({ pressed }) => [
            styles.signOutBtn,
            (pressed || isSigningOut) && styles.pressed,
          ]}
        >
          <Text style={styles.signOutText}>
            {isSigningOut ? "Signing out..." : "Sign out"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 130, // Clearance for floating glass bar
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    height: 48,
  },
  logo: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 34,
    letterSpacing: -2.2,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F4F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    marginBottom: 24,
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "#FFE1A1",
  },
  userInfo: {
    flex: 1,
    justifyContent: "center",
  },
  userName: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 25,
    letterSpacing: -1.0,
    ...(Platform.OS === "web" ? { fontWeight: "800" as const } : {}),
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    color: "#7E7E88",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13.5,
  },
  badgePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: "#F2ECFF",
  },
  badgeIcon: {
    fontSize: 12,
  },
  badgeText: {
    color: "#111116",
    fontFamily: "Manrope_700Bold",
    fontSize: 12,
  },
  statsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#F0F0F3",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    marginBottom: 26,
  },
  statCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statNumber: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 23,
    letterSpacing: -0.7,
    ...(Platform.OS === "web" ? { fontWeight: "800" as const } : {}),
  },
  statLabel: {
    marginTop: 3,
    color: "#7E7E88",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12.5,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingStar: {
    color: "#FFB000",
    fontSize: 18,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#EAEAEF",
  },
  sectionHeading: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 20,
    letterSpacing: -0.7,
    marginBottom: 12,
    ...(Platform.OS === "web" ? { fontWeight: "800" as const } : {}),
  },
  menuCard: {
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#F0F0F3",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F4F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  menuTitle: {
    flex: 1,
    color: "#111116",
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#F2F2F5",
    marginLeft: 54,
  },
  policyCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 22,
    backgroundColor: "#F3EDFF",
    marginBottom: 24,
  },
  policyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E4D7FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  policyCopy: {
    flex: 1,
  },
  policyTitle: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 15,
  },
  policySubtitle: {
    marginTop: 2,
    color: "#777785",
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
  },
  signOutBtn: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: "#FFB800",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    shadowColor: "#FFB800",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  signOutText: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 16,
    letterSpacing: -0.2,
    ...(Platform.OS === "web" ? { fontWeight: "800" as const } : {}),
  },
  pressed: {
    opacity: 0.76,
  },
});
