import { posthog } from "@/lib/posthog";

type AuthenticationMethod = "email_code" | "google_sso" | "apple_sso" | "password";
type AuthenticationFlow = "signin" | "signup";

/**
 * Dedicated PostHog logger. Only calls made through this facade are exported
 * to PostHog Logs, keeping the app's existing log output local.
 */
export const posthogLogs = {
  authenticationCompleted(method: AuthenticationMethod, flow: AuthenticationFlow) {
    posthog?.logger.info("authentication completed", {
      event: "authentication_completed",
      authentication_method: method,
      authentication_flow: flow,
    });
  },

  staySearchCompleted(hasQuery: boolean, resultCount: number) {
    posthog?.logger.info("stay search completed", {
      event: "stay_search_completed",
      has_query: hasQuery,
      result_count: resultCount,
      source: "search_results",
    });
  },
};
