import { useAuth } from "@clerk/expo";
import { Redirect } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) {
    return <Redirect href={{ pathname: "/auth", params: { mode: "signin" } }} />;
  }

  return (
    <NativeTabs
      backgroundColor="rgba(255,255,255,0.82)"
      blurEffect="systemUltraThinMaterialLight"
      iconColor={{ default: "#6B6B72", selected: "#111116" }}
      labelStyle={{
        default: { color: "#6B6B72", fontFamily: "Manrope_500Medium", fontSize: 11 },
        selected: { color: "#111116", fontFamily: "Manrope_700Bold", fontSize: 11 },
      }}
      indicatorColor="#FFC12F"
      labelVisibilityMode="labeled"
    >
      <NativeTabs.Trigger name="home">
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "house", selected: "house.fill" }} md={{ default: "home", selected: "home" }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <NativeTabs.Trigger.Label>Search</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="trips">
        <NativeTabs.Trigger.Label>Trips</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "calendar", selected: "calendar" }} md="calendar_month" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }} md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
