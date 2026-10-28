import * as WebBrowser from "expo-web-browser";
import { ClerkProvider, useUser } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { useFonts } from "expo-font";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { posthog, PostHogRootProvider } from "@/lib/posthog";
import "../global.css";

WebBrowser.maybeCompleteAuthSession();
SplashScreen.preventAutoHideAsync().catch(() => {});

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

if (!publishableKey) {
  throw new Error("Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY. Add your key to .env.local.\nRun: 1) clerk auth login  2) clerk link  3) clerk env pull — then restart the dev server.");
}

function PostHogIdentity() {
  const { isLoaded, user } = useUser();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (!isLoaded) return;

    const userId = user?.id ?? null;
    if (userId === previousUserId.current) return;

    if (previousUserId.current && userId) {
      posthog?.reset();
    }

    if (user) {
      const email = user.primaryEmailAddress?.emailAddress;
      const name = user.fullName;

      posthog?.identify(user.id, {
        $set: {
          ...(email ? { email } : {}),
          ...(name ? { name } : {}),
        },
      });
    } else if (previousUserId.current) {
      posthog?.reset();
    }

    previousUserId.current = userId;
  }, [isLoaded, user]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    Manrope: Manrope_700Bold,
    "Manrope-Bold": Manrope_700Bold,
    "Manrope-ExtraBold": Manrope_800ExtraBold,
    "Manrope-SemiBold": Manrope_600SemiBold,
    "Manrope-Medium": Manrope_500Medium,
    "Manrope-Regular": Manrope_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FAF9F5" }}>
        <ActivityIndicator size="large" color="#FFC12F" />
      </View>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <PostHogRootProvider>
        <PostHogIdentity />
        <SafeAreaProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaProvider>
      </PostHogRootProvider>
    </ClerkProvider>
  );
}
