import { useAuth } from "@clerk/expo";
import { Redirect, Tabs } from "expo-router";
import type { BottomTabBarProps } from "expo-router/build/react-navigation/bottom-tabs";
import { CommonActions } from "expo-router/build/react-navigation/routers";
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

function GlassBottomBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <nav className="roam-glass-tabbar" aria-label="Main navigation">
      {state.routes.map((route, index) => {
        const selected = state.index === index;
        const name = route.name as keyof typeof tabIcons;
        const options = descriptors[route.key]?.options;
        const label = options?.title ?? tabLabels[name];

        function selectTab() {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!selected && !event.defaultPrevented) {
            navigation.dispatch({
              ...CommonActions.navigate(route),
              target: state.key,
            });
          }
        }

        return (
          <button
            key={route.key}
            aria-current={selected ? "page" : undefined}
            aria-label={label}
            className={`roam-glass-tab${selected ? " roam-glass-tab-selected" : ""}`}
            onClick={selectTab}
            type="button"
          >
            <LineIcon
              color="#111116"
              name={tabIcons[name]}
              size={23}
              strokeWidth={selected ? 2.8 : 2.2}
            />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default function WebTabsLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;
  if (!isSignedIn) {
    return <Redirect href={{ pathname: "/auth", params: { mode: "signin" } }} />;
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <GlassBottomBar {...props} />}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen name="trips" options={{ title: "Trips" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
