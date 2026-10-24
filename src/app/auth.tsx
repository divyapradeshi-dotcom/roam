import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useAuth, useSignIn, useSignUp } from "@clerk/expo";
import { useSSO } from "@clerk/expo/experimental";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { posthog } from "@/lib/posthog";
import { posthogLogs } from "@/lib/posthog-logs";

type AuthStep = "signup" | "verify" | "signin";
type VerificationFlow = "signup" | "signin";

const colors = {
  ink: "#111116",
  muted: "#85858E",
  yellow: "#FFC12F",
  field: "#F4F4F5",
  border: "#E9E9EB",
  purple: "#A98BFF",
  error: "#C62C4B",
  success: "#176B4B",
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export default function AuthScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { signIn, fetchStatus: signInFetchStatus } = useSignIn();
  const { signUp, fetchStatus: signUpFetchStatus } = useSignUp();
  const { startSSOFlow } = useSSO();
  const [step, setStep] = useState<AuthStep>(mode === "signin" ? "signin" : "signup");
  const [verificationFlow, setVerificationFlow] = useState<VerificationFlow>(
    mode === "signin" ? "signin" : "signup",
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isGoogleBusy, setIsGoogleBusy] = useState(false);
  const isBusy =
    isGoogleBusy || signInFetchStatus === "fetching" || signUpFetchStatus === "fetching";

  if (!authLoaded) return null;
  if (isSignedIn) return <Redirect href="/home" />;

  function clearMessages() {
    setError("");
    setNotice("");
  }

  function goBack() {
    clearMessages();
    if (step === "verify") {
      setStep(verificationFlow);
      return;
    }
    if (step === "signin") {
      setStep("signup");
      return;
    }
    router.back();
  }

  async function submitSignUp() {
    if (fullName.trim().length < 2) {
      setError("Enter your full name to continue.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }
    clearMessages();
    setVerificationCode("");
    try {
      const { error: resetError } = await signUp.reset();
      if (resetError) {
        setError(resetError.message);
        return;
      }
      const { error: createError } = await signUp.password({
        emailAddress: email.trim(),
        password,
        unsafeMetadata: { fullName: fullName.trim() },
      });
      if (createError) {
        setError(createError.message);
        return;
      }
      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        setError(sendError.message);
        return;
      }
      setVerificationFlow("signup");
      setStep("verify");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to send a verification code. Please try again.",
      );
    }
  }

  async function submitVerification() {
    if (verificationCode.length !== 6) {
      setError("Enter the 6-digit verification code.");
      return;
    }
    clearMessages();
    try {
      const { error: verificationError } =
        verificationFlow === "signup"
          ? await signUp.verifications.verifyEmailCode({ code: verificationCode })
          : await signIn.mfa.verifyEmailCode({ code: verificationCode });
      if (verificationError) {
        setError(verificationError.message);
        return;
      }

      const { error: finalizeError } =
        verificationFlow === "signup"
          ? signUp.status === "complete"
            ? await signUp.finalize()
            : { error: null }
          : signIn.status === "complete"
            ? await signIn.finalize()
            : { error: null };
      if (finalizeError) {
        setError(finalizeError.message);
        return;
      }
      if (
        (verificationFlow === "signup" && signUp.status !== "complete") ||
        (verificationFlow === "signin" && signIn.status !== "complete")
      ) {
        setError("More information is required to finish signing in. Please contact support.");
        return;
      }
      posthog?.capture("authentication_completed", {
        authentication_method: "email_code",
        authentication_flow: verificationFlow,
      });
      posthogLogs.authenticationCompleted("email_code", verificationFlow);
      router.replace("/home");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to verify your code. Please try again.",
      );
    }
  }

  async function submitSignIn() {
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }
    clearMessages();
    setVerificationCode("");
    try {
      const { error: signInError } = await signIn.password({
        identifier: email.trim(),
        password,
      });
      if (signInError) {
        setError(signInError.message);
        return;
      }
      if (signIn.status === "complete") {
        const { error: finalizeError } = await signIn.finalize();
        if (finalizeError) {
          setError(finalizeError.message);
          return;
        }
        posthog?.capture("authentication_completed", {
          authentication_method: "password",
          authentication_flow: "signin",
        });
        posthogLogs.authenticationCompleted("password", "signin");
        router.replace("/home");
        return;
      }
      if (
        (signIn.status === "needs_client_trust" || signIn.status === "needs_second_factor") &&
        signIn.supportedSecondFactors.some((factor) => factor.strategy === "email_code")
      ) {
        const { error: sendError } = await signIn.mfa.sendEmailCode();
        if (sendError) {
          setError(sendError.message);
          return;
        }
        setVerificationFlow("signin");
        setStep("verify");
        return;
      }
      setError("This sign-in requires a verification method that isn’t available here.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to sign in. Please try again.",
      );
    }
  }

  async function continueWithGoogle() {
    clearMessages();
    setIsGoogleBusy(true);
    try {
      const { createdSessionId, signUp: pendingSignUp } = await startSSOFlow({
        strategy: "oauth_google",
        unsafeMetadata: isSignUp ? { fullName: fullName.trim() } : undefined,
      });
      if (createdSessionId) {
        const authenticationFlow = isSignUp ? "signup" : "signin";
        posthog?.capture("authentication_completed", {
          authentication_method: "google_sso",
          authentication_flow: authenticationFlow,
        });
        posthogLogs.authenticationCompleted("google_sso", authenticationFlow);
        router.replace("/home");
      } else if (pendingSignUp?.status === "missing_requirements") {
        setError("We couldn’t finish setting up your account. Try signing up with email.");
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to continue with Google. Please try again.",
      );
    } finally {
      setIsGoogleBusy(false);
    }
  }

  const isSignUp = step === "signup";
  const isVerification = step === "verify";
  const title = isVerification
    ? "Check your\nemail"
    : isSignUp
      ? "Create\nyour account"
      : "Welcome\nback";

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={goBack}
              hitSlop={10}
              style={styles.backButton}
            >
              <Text style={styles.backArrow}>‹</Text>
            </Pressable>
            <Text style={styles.logo}>roam</Text>
          </View>

          <View style={styles.intro}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>
              {isVerification
                ? `We sent a 6-digit code to ${email.trim()}. Enter it below to ${verificationFlow === "signup" ? "verify your email" : "sign in"}.`
                : isSignUp
                  ? "Join roam to save your stays, get personalized recommendations and access them across all your devices."
                  : "Sign in to see your saved stays and get back to planning your next trip."}
            </Text>
          </View>

          {isVerification ? (
            <View style={styles.form}>
              <Text style={styles.fieldLabel}>Verification code</Text>
              <View style={styles.codeContainer}>
                <View style={styles.codeBoxes} pointerEvents="none">
                  {Array.from({ length: 6 }, (_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.codeBox,
                        index === verificationCode.length && styles.codeBoxActive,
                      ]}
                    >
                      <Text style={styles.codeDigit}>{verificationCode[index] ?? ""}</Text>
                    </View>
                  ))}
                </View>
                <TextInput
                  accessibilityLabel="6-digit verification code"
                  autoComplete="one-time-code"
                  autoFocus
                  keyboardType="number-pad"
                  maxLength={6}
                  onChangeText={(value) => {
                    setVerificationCode(value.replace(/\D/g, "").slice(0, 6));
                    setError("");
                  }}
                  style={styles.codeInput}
                  textContentType="oneTimeCode"
                  value={verificationCode}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={async () => {
                  clearMessages();
                  try {
                    const { error: resendError } =
                      verificationFlow === "signup"
                        ? await signUp.verifications.sendEmailCode()
                        : await signIn.mfa.sendEmailCode();
                    if (resendError) {
                      setError(resendError.message);
                      return;
                    }
                    setVerificationCode("");
                    setNotice(`A new code was sent to ${email.trim()}.`);
                  } catch (caughtError) {
                    setError(
                      caughtError instanceof Error
                        ? caughtError.message
                        : "Unable to resend the code. Please try again.",
                    );
                  }
                }}
                style={styles.resendButton}
                disabled={isBusy}
              >
                <Text style={styles.resendText}>Didn’t get a code? Resend</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.form}>
              {isSignUp && (
                <AuthField
                  icon="♙"
                  label="Full name"
                  onChangeText={(value) => {
                    setFullName(value);
                    setError("");
                  }}
                  placeholder="e.g. Adrian Hajdin"
                  textContentType="name"
                  value={fullName}
                />
              )}
              <AuthField
                icon="✉"
                label="Email address"
                onChangeText={(value) => {
                  setEmail(value);
                  setError("");
                }}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
                value={email}
              />
              <View style={styles.fieldWrap}>
                <View style={styles.fieldIcon}>
                  <InputIcon kind="lock" />
                </View>
                <View style={styles.fieldContent}>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <TextInput
                    accessibilityLabel="Password"
                    autoCapitalize="none"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    onChangeText={(value) => {
                      setPassword(value);
                      setError("");
                    }}
                    onSubmitEditing={isSignUp ? submitSignUp : submitSignIn}
                    placeholder={isSignUp ? "At least 8 characters" : "Your password"}
                    placeholderTextColor="#9A9AA2"
                    returnKeyType="go"
                    secureTextEntry={!passwordVisible}
                    style={styles.fieldInput}
                    textContentType={isSignUp ? "newPassword" : "password"}
                    value={password}
                  />
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={passwordVisible ? "Hide password" : "Show password"}
                  onPress={() => setPasswordVisible((visible) => !visible)}
                  hitSlop={10}
                  style={styles.visibilityButton}
                >
                  <Text style={styles.visibilityIcon}>{passwordVisible ? "◉" : "◉̸"}</Text>
                </Pressable>
              </View>
            </View>
          )}

          <View style={styles.actions}>
            {notice ? (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>{notice}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss message"
                  onPress={() => setNotice("")}
                  hitSlop={8}
                >
                  <Text style={styles.noticeClose}>×</Text>
                </Pressable>
              </View>
            ) : null}
            {!isVerification ? <View nativeID="clerk-captcha" /> : null}
            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                {error}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              onPress={isVerification ? submitVerification : isSignUp ? submitSignUp : submitSignIn}
              disabled={isBusy}
              style={({ pressed }) => [
                styles.primaryButton,
                (pressed || isBusy) && styles.pressed,
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {isBusy
                  ? "Please wait..."
                  : isVerification
                    ? verificationFlow === "signup"
                      ? "Verify email"
                      : "Verify sign-in"
                    : isSignUp
                      ? "Create account"
                      : "Sign in"}
              </Text>
              <Text style={styles.primaryArrow}>→</Text>
            </Pressable>

            {!isVerification && (
              <View style={styles.socialOptions}>
                <View style={styles.separator}>
                  <View style={styles.separatorLine} />
                  <Text style={styles.separatorText}>or</Text>
                  <View style={styles.separatorLine} />
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Continue with Google"
                  disabled={isBusy}
                  onPress={continueWithGoogle}
                  style={({ pressed }) => [
                    styles.googleButton,
                    (pressed || isBusy) && styles.pressed,
                  ]}
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24" style={styles.googleMark}>
                    <Path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
                    />
                    <Path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.15v2.84C3.96 20.53 7.7 23 12 23Z"
                    />
                    <Path
                      fill="#FBBC05"
                      d="M5.84 14.1a6.8 6.8 0 0 1 0-4.2V7.06H2.15a11 11 0 0 0 0 9.88l3.69-2.84Z"
                    />
                    <Path
                      fill="#EA4335"
                      d="M12 4.36c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45.99 14.97 0 12 0 7.7 0 3.96 2.47 2.15 6.06l3.69 2.84C6.71 6.29 9.14 4.36 12 4.36Z"
                    />
                  </Svg>
                  <Text style={styles.googleButtonText}>
                    {isGoogleBusy ? "Connecting..." : "Continue with Google"}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          <View style={styles.footer}>
            {isVerification ? (
              <>
                <Text style={styles.footerText}>Wrong email? </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    clearMessages();
                    setStep(verificationFlow);
                  }}
                >
                  <Text style={styles.footerLink}>Edit details</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.footerText}>
                  {isSignUp ? "Already have an account? " : "New to roam? "}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    clearMessages();
                    setStep(isSignUp ? "signin" : "signup");
                  }}
                >
                  <Text style={styles.footerLink}>
                    {isSignUp ? "Sign in" : "Create an account"}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type AuthFieldProps = {
  icon: string;
  label: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  value: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address";
  textContentType?: "name" | "emailAddress";
};

function AuthField({
  icon,
  label,
  onChangeText,
  placeholder,
  value,
  autoCapitalize,
  keyboardType,
  textContentType,
}: AuthFieldProps) {
  return (
    <View style={styles.fieldWrap}>
      <View style={styles.fieldIcon}>
        <InputIcon kind={icon === "✉" ? "email" : "person"} />
      </View>
      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <TextInput
          accessibilityLabel={label}
          autoCapitalize={autoCapitalize}
          autoComplete={label === "Email address" ? "email" : "name"}
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9A9AA2"
          returnKeyType="next"
          style={styles.fieldInput}
          textContentType={textContentType}
          value={value}
        />
      </View>
    </View>
  );
}

function InputIcon({ kind }: { kind: "email" | "lock" | "person" }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      {kind === "person" ? (
        <>
          <Path
            d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
            stroke="#696974"
            strokeWidth={1.7}
          />
          <Path
            d="M4 21c.5-4 3.5-7 8-7s7.5 3 8 7"
            stroke="#696974"
            strokeWidth={1.7}
            strokeLinecap="round"
          />
        </>
      ) : kind === "email" ? (
        <>
          <Path
            d="M3.5 5.5h17v13h-17z"
            stroke="#696974"
            strokeWidth={1.7}
            strokeLinejoin="round"
          />
          <Path
            d="m4 7 8 6 8-6"
            stroke="#696974"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <Path
            d="M5 10h14v11H5zM8 10V7a4 4 0 0 1 8 0v3"
            stroke="#696974"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: 27,
    paddingTop: 4,
    paddingBottom: 22,
  },
  topBar: {
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: { width: 32, height: 40, justifyContent: "center" },
  backArrow: { color: colors.ink, fontFamily: "Manrope_500Medium", fontSize: 30, lineHeight: 34 },
  logo: {
    color: colors.ink,
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 22,
    letterSpacing: -1.3,
  },
  intro: { paddingTop: 20, paddingBottom: 17 },
  title: {
    color: colors.ink,
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 27,
    letterSpacing: -1.1,
    lineHeight: 29,
  },
  subtitle: {
    maxWidth: 310,
    marginTop: 8,
    color: colors.muted,
    fontFamily: "Manrope_500Medium",
    fontSize: 11,
    lineHeight: 16,
  },
  form: { gap: 8 },
  fieldWrap: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderRadius: 11,
    backgroundColor: colors.field,
  },
  fieldIcon: {
    width: 26,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  fieldContent: { flex: 1, justifyContent: "center" },
  fieldLabel: {
    color: colors.ink,
    fontFamily: "Manrope_700Bold",
    fontSize: 9,
    lineHeight: 13,
  },
  fieldInput: {
    height: 20,
    padding: 0,
    color: colors.ink,
    fontFamily: "Manrope_500Medium",
    fontSize: 10,
  },
  visibilityButton: { paddingLeft: 8, paddingVertical: 8 },
  visibilityIcon: { color: "#55555D", fontSize: 17 },
  codeContainer: { height: 54, justifyContent: "center" },
  codeBoxes: { flexDirection: "row", justifyContent: "space-between", gap: 7 },
  codeBox: {
    flex: 1,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.field,
  },
  codeBoxActive: { borderColor: colors.purple, borderWidth: 1.5 },
  codeDigit: { color: colors.ink, fontFamily: "Manrope_700Bold", fontSize: 18 },
  codeInput: {
    ...StyleSheet.absoluteFill,
    zIndex: 1,
    color: "transparent",
    opacity: 0.02,
    fontSize: 24,
  },
  resendButton: { alignSelf: "center", paddingVertical: 10 },
  resendText: { color: "#7453D6", fontFamily: "Manrope_700Bold", fontSize: 11 },
  error: {
    marginTop: 8,
    color: colors.error,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 11,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#E5F5EC",
  },
  noticeText: {
    flex: 1,
    color: colors.success,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 11,
  },
  noticeClose: { marginLeft: 10, color: colors.success, fontSize: 18 },
  primaryButton: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    borderRadius: 26,
    backgroundColor: colors.yellow,
  },
  primaryButtonText: { color: colors.ink, fontFamily: "Manrope_800ExtraBold", fontSize: 12 },
  primaryArrow: {
    position: "absolute",
    right: 14,
    color: colors.ink,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 20,
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
    marginBottom: 8,
  },
  separatorLine: { flex: 1, height: 1, backgroundColor: colors.border },
  separatorText: { color: "#A2A2A8", fontFamily: "Manrope_500Medium", fontSize: 9 },
  googleButton: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    shadowColor: "#1A1A20",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  googleMark: { marginRight: 10 },
  googleButtonText: {
    color: colors.ink,
    fontFamily: "Manrope_600SemiBold",
    fontSize: 10,
  },
  pressed: { opacity: 0.76 },
  actions: { gap: 0 },
  socialOptions: { marginTop: 0 },
  footer: { flexDirection: "row", justifyContent: "center" },
  footerText: { color: colors.muted, fontFamily: "Manrope_500Medium", fontSize: 9 },
  footerLink: { color: colors.ink, fontFamily: "Manrope_700Bold", fontSize: 9 },
});
