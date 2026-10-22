import { useMemo, useState } from "react";
import {
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type GestureResponderEvent,
  type PanResponderGestureState,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "@clerk/expo";
import { Redirect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const slides = [
  {
    image:
      "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1400&q=90",
    location: "Whistler, BC",
    title: "Find a stay that\nfits your story",
    description:
      "From mountain cabins to oceanfront villas, roam helps you find unforgettable stays for every kind of trip.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=90",
    location: "Lake Louise, AB",
    title: "Make room for\nnew memories",
    description:
      "Wake up somewhere wonderful, slow down, and make every part of the journey count.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1400&q=90",
    location: "Big Bear, CA",
    title: "Your next favorite\nplace is out there",
    description:
      "Find a little more of what you love, with stays chosen for the way you want to travel.",
  },
];

function shouldClaimHorizontalSwipe(
  _: GestureResponderEvent,
  gesture: PanResponderGestureState,
) {
  return Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2;
}

export default function OnboardingScreen() {
  const [activeSlide, setActiveSlide] = useState(0);
  const { isLoaded, isSignedIn } = useAuth();
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const slide = slides[activeSlide];
  const cardHeight = Math.min(
    410,
    height < 600 ? height * 0.68 : Math.max(340, height * 0.44),
  );

  function openAuth() {
    router.push({ pathname: "/auth", params: { mode: "signup" } });
  }

  function continueOnboarding() {
    if (activeSlide === slides.length - 1) {
      openAuth();
      return;
    }
    setActiveSlide((current) => current + 1);
  }

  const swipeResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: shouldClaimHorizontalSwipe,
        onMoveShouldSetPanResponderCapture: shouldClaimHorizontalSwipe,
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx < -48) {
            setActiveSlide((current) => Math.min(current + 1, slides.length - 1));
          } else if (gesture.dx > 48) {
            setActiveSlide((current) => Math.max(current - 1, 0));
          }
        },
      }),
    [],
  );

  if (!isLoaded) return null;
  if (isSignedIn) return <Redirect href="/home" />;

  return (
    <View style={styles.container} {...swipeResponder.panHandlers}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <Image
        key={slide.image}
        accessibilityLabel={`A scenic stay near ${slide.location}`}
        resizeMode="cover"
        source={{ uri: slide.image }}
        style={styles.heroImage}
      />
      <View style={[styles.topBar, { top: insets.top + 18 }]}>
        <Text style={styles.logo}>roam</Text>
        <Pressable
          accessibilityRole="button"
          onPress={openAuth}
          style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <View style={[styles.locationPill, { bottom: cardHeight + 18 }]}>
        <Text style={styles.locationPin}>⌖</Text>
        <Text style={styles.locationText}>{slide.location}</Text>
      </View>

      <View
        style={[
          styles.card,
          { height: cardHeight, width },
        ]}
      >
        <Svg
          viewBox={`0 0 390 ${cardHeight + 36}`}
          preserveAspectRatio="none"
          style={styles.cardShape}
        >
          <Path
            d={`M 0 42 C 0 17 16 0 42 0 C 115 0 165 8 225 3 C 290 -2 347 0 373 15 C 385 22 390 32 390 45 V ${cardHeight + 36} H 0 Z`}
            fill="#FFFFFF"
          />
        </Svg>
        <ScrollView
          style={styles.cardScroll}
          contentContainerStyle={[
            styles.cardContent,
            { paddingBottom: Math.max(insets.bottom, 18) + 12 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.pagination} accessibilityLabel={`Page ${activeSlide + 1} of 3`}>
            {slides.map((item, index) => (
              <View
                key={item.location}
                style={[styles.paginationDot, index === activeSlide && styles.activeDot]}
              />
            ))}
          </View>

          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.description}>{slide.description}</Text>

          <Pressable
            accessibilityRole="button"
            onPress={continueOnboarding}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>
              {activeSlide === 0
                ? "Get started"
                : activeSlide === slides.length - 1
                  ? "Create your account"
                  : "Continue"}
            </Text>
            <Text style={styles.primaryArrow}>→</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={openAuth}
            style={({ pressed }) => [styles.googleButton, pressed && styles.pressed]}
          >
            <Text style={styles.googleMark}>G</Text>
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, overflow: "hidden", backgroundColor: "#E5E9EF" },
  heroImage: StyleSheet.absoluteFill,
  topBar: {
    position: "absolute",
    left: 27,
    right: 27,
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 42,
    letterSpacing: -3.2,
  },
  skipButton: {
    minWidth: 68,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.86)",
  },
  skipText: { color: "#111116", fontFamily: "Manrope_600SemiBold", fontSize: 13 },
  locationPill: {
    position: "absolute",
    left: 27,
    zIndex: 1,
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.45)",
    borderRadius: 24,
    backgroundColor: "rgba(21,24,28,0.63)",
  },
  locationPin: {
    marginRight: 8,
    color: "#FFFFFF",
    fontFamily: "Manrope_700Bold",
    fontSize: 18,
  },
  locationText: { color: "#FFFFFF", fontFamily: "Manrope_600SemiBold", fontSize: 12 },
  card: {
    position: "absolute",
    bottom: 0,
    left: 0,
    overflow: "visible",
  },
  cardShape: {
    position: "absolute",
    top: -1,
    left: 0,
    width: "100%",
    height: "100%",
  },
  cardScroll: {
    zIndex: 1,
  },
  cardContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 28,
    paddingTop: 22,
  },
  pagination: { height: 8, flexDirection: "row", gap: 8, marginBottom: 18 },
  paginationDot: { width: 34, height: 6, borderRadius: 4, backgroundColor: "#F0F0F3" },
  activeDot: { backgroundColor: "#B291F5" },
  title: {
    color: "#101018",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 35,
    letterSpacing: -1.7,
    lineHeight: 39,
  },
  description: {
    marginTop: 10,
    marginBottom: 12,
    color: "#85879A",
    fontFamily: "Manrope_500Medium",
    fontSize: 15,
    lineHeight: 21,
  },
  primaryButton: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 32,
    backgroundColor: "#FFB000",
  },
  primaryButtonText: { color: "#111116", fontFamily: "Manrope_800ExtraBold", fontSize: 15 },
  primaryArrow: {
    position: "absolute",
    right: 22,
    color: "#111116",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 23,
  },
  googleButton: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 9,
    borderWidth: 1.5,
    borderColor: "#E7E7EC",
    borderRadius: 32,
    backgroundColor: "#FFFFFF",
  },
  googleMark: {
    marginRight: 13,
    color: "#4285F4",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 19,
  },
  googleButtonText: { color: "#15151B", fontFamily: "Manrope_600SemiBold", fontSize: 14 },
  pressed: { opacity: 0.78 },
});
