import Constants from "expo-constants";
import PostHog, { PostHogProvider } from "posthog-react-native";
import type { PropsWithChildren } from "react";

const extra = Constants.expoConfig?.extra;
const projectToken = extra?.posthogProjectToken as string | undefined;
const host = extra?.posthogHost as string | undefined;

export const isPostHogConfigured = Boolean(projectToken && host);

if (!isPostHogConfigured && __DEV__) {
  const missingVariable = projectToken
    ? "EXPO_PUBLIC_POSTHOG_HOST"
    : "EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN";

  console.error(
    `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
  );
}

export const posthog = isPostHogConfigured
  ? new PostHog(projectToken!, {
      host: host!,
      captureAppLifecycleEvents: true,
      preloadFeatureFlags: true,
      logs: {
        serviceName: "roam-mobile",
      },
      errorTracking: {
        autocapture: {
          uncaughtExceptions: true,
          unhandledRejections: true,
          console: [],
        },
      },
    })
  : undefined;

export function PostHogRootProvider({ children }: PropsWithChildren) {
  if (!posthog) {
    return children;
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
