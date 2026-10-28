import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@clerk/expo";
import { Redirect, Tabs, router } from "expo-router";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LineIcon } from "@/components/roam-ui";

const tabIcons = {
  home: "home",
  search: "search",
  trips: "calendar",
  profile: "person",
} as const;

const tabLabels = {
  home: "Home",
  search: "Search",
  trips: "Trips",
  profile: "Profile",
} as const;

function GlassBottomBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 18);

  return (
    <View pointerEvents="box-none" style={[styles.floatingWrapper, { bottom: bottomOffset }]}>
      <View style={styles.glassContainer}>
        <BlurView
          intensity={Platform.OS === "ios" ? 85 : 95}
          tint="light"
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.tabBarInner}>
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const name = route.name as keyof typeof tabIcons;
            const options = descriptors[route.key]?.options;
            const label = options?.title ?? tabLabels[name] ?? route.name;

            const onPress = () => {
              if (!isFocused) {
                router.navigate(`/${route.name}` as any);
              }
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={label}
                onPress={onPress}
                style={styles.tabItemPressable}
              >
                {isFocused ? (
                  <View style={styles.activePill}>
                    <LineIcon
                      name={tabIcons[name] || "home"}
                      size={24}
                      color="#111116"
                      strokeWidth={2.6}
                      filled
                    />
                    <Text numberOfLines={1} style={styles.activeLabel}>
                      {label}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.inactiveItem}>
                    <LineIcon
                      name={tabIcons[name] || "home"}
                      size={24}
                      color="#111116"
                      strokeWidth={2.0}
                    />
                    <Text numberOfLines={1} style={styles.inactiveLabel}>
                      {label}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFC12F" />
      </View>
    );
  }
  if (!isSignedIn) {
    return <Redirect href={{ pathname: "/auth", params: { mode: "signin" } }} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: "none" },
      }}
      tabBar={(props) => <GlassBottomBar {...props} />}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen name="trips" options={{ title: "Trips" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAF9F5",
  },
  floatingWrapper: {
    position: "absolute",
    left: 18,
    right: 18,
    alignItems: "center",
    zIndex: 99,
  },
  glassContainer: {
    width: "100%",
    maxWidth: 440,
    height: 76,
    borderRadius: 38,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.95)",
    backgroundColor: Platform.select({
      ios: "rgba(255, 255, 255, 0.72)",
      android: "rgba(255, 255, 255, 0.88)",
      default: "rgba(255, 255, 255, 0.82)",
    }),
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 22,
    elevation: 12,
  },
  tabBarInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  tabItemPressable: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  activePill: {
    width: 68,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#FFB800",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FFB800",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 7,
  },
  activeLabel: {
    marginTop: 2,
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 10.5,
    letterSpacing: -0.2,
  },
  inactiveItem: {
    width: 68,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
  },
  inactiveLabel: {
    marginTop: 3,
    color: "#111116",
    fontFamily: "Manrope_700Bold",
    fontSize: 10.5,
    letterSpacing: -0.2,
  },
});
