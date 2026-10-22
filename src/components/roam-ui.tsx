import type { ReactNode } from "react";
import { Image, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, Ellipse, Path, Polyline } from "react-native-svg";

const ink = "#111116";

export function PressableFeedback({
  children,
  onPress,
  style,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      onPress={onPress}
      pressRetentionOffset={16}
      style={({ pressed }) => [style, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

export function LineIcon({
  name,
  size = 22,
  color = ink,
  strokeWidth = 2,
}: {
  name:
    | "search"
    | "home"
    | "cabin"
    | "beach"
    | "city"
    | "palm"
    | "pin"
    | "arrow"
    | "chevron"
    | "chevron-down"
    | "sparkle"
    | "calendar"
    | "person"
    | "sliders"
    | "heart"
    | "star"
    | "hot-tub"
    | "paw"
    | "pool"
    | "mountain"
    | "fireplace"
    | "wifi";
  size?: number;
  color?: string;
  strokeWidth?: number;
}) {
  const common = {
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === "search" && (
        <>
          <Circle cx="10.8" cy="10.8" r="6.7" {...common} />
          <Path d="m16 16 4.2 4.2" {...common} />
        </>
      )}
      {name === "home" && <Path d="m3 10 9-7 9 7v10h-6v-6H9v6H3z" {...common} />}
      {name === "cabin" && (
        <>
          <Path d="m12 3 7 10h-4l4 6H5l4-6H5z" {...common} />
          <Path d="M12 19v2" {...common} />
        </>
      )}
      {name === "beach" && (
        <>
          <Path d="M4 16c2-3 4-3 6 0s4 3 6 0 4-3 6 0" {...common} />
          <Path d="M8 12c1-4 4-7 9-7-1 5-4 8-8 8" {...common} />
          <Path d="M9 13 6 8" {...common} />
        </>
      )}
      {name === "city" && (
        <>
          <Path d="M4 21V5h10v16M14 10h6v11M2 21h20" {...common} />
          <Path d="M7 8h1m3 0h1M7 12h1m3 0h1M7 16h1m3 0h1m5-2h1m-1 4h1" {...common} />
        </>
      )}
      {name === "palm" && (
        <>
          <Path d="M12 9v12M9 21h6" {...common} />
          <Path d="M12 9c-2-5-6-6-9-5 2 3 5 5 9 5Zm0 0c1-5 4-7 8-7-1 4-4 7-8 7Zm0 0c3-3 7-3 10-1-3 3-6 4-10 1Zm0 0c-3-3-7-3-9-1 2 3 5 4 9 1Z" {...common} />
        </>
      )}
      {name === "pin" && (
        <>
          <Path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" {...common} />
          <Circle cx="12" cy="10" r="2" {...common} />
        </>
      )}
      {name === "arrow" && <Path d="M7 17 17 7M8 7h9v9" {...common} />}
      {name === "chevron" && <Polyline points="9 5 16 12 9 19" {...common} />}
      {name === "chevron-down" && <Polyline points="6 9 12 15 18 9" {...common} />}
      {name === "sliders" && (
        <>
          <Path d="M4 6h6m4 0h6M4 12h2m4 0h10M4 18h8m4 0h4" {...common} />
          <Circle cx="12" cy="6" r="2" {...common} fill="#FFFFFF" />
          <Circle cx="8" cy="12" r="2" {...common} fill="#FFFFFF" />
          <Circle cx="14" cy="18" r="2" {...common} fill="#FFFFFF" />
        </>
      )}
      {name === "heart" && (
        <Path
          d="M20.8 8.8c0 4.2-8.8 11-8.8 11s-8.8-6.8-8.8-11A4.8 4.8 0 0 1 12 6.4a4.8 4.8 0 0 1 8.8 2.4Z"
          {...common}
        />
      )}
      {name === "star" && (
        <Path
          d="m12 2.8 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3-4.6-4.5 6.3-.9z"
          fill={color}
          stroke="none"
        />
      )}
      {name === "hot-tub" && (
        <>
          <Path d="M4 11h16l-1 9H5l-1-9Zm-1 0h18M7 15h.01M12 15h.01M17 15h.01M8 8c-1-1 1-2 0-3m4 3c-1-1 1-2 0-3m4 3c-1-1 1-2 0-3" {...common} />
        </>
      )}
      {name === "paw" && (
        <>
          <Path d="M7 13c-2 0-3 2-3 4 0 2 2 3 4 2l2-1h4l2 1c2 1 4 0 4-2 0-2-1-4-3-4-2 0-2-3-5-3s-3 3-5 3Z" {...common} />
          <Ellipse cx="6" cy="8" rx="1.5" ry="2" {...common} fill={color} />
          <Ellipse cx="10" cy="5.5" rx="1.5" ry="2" {...common} fill={color} />
          <Ellipse cx="14" cy="5.5" rx="1.5" ry="2" {...common} fill={color} />
          <Ellipse cx="18" cy="8" rx="1.5" ry="2" {...common} fill={color} />
        </>
      )}
      {name === "pool" && (
        <>
          <Path d="M3 17c2 0 2-2 4-2s2 2 5 2 3-2 5-2 2 2 4 2M3 21c2 0 2-2 4-2s2 2 5 2 3-2 5-2 2 2 4 2M7 12V5h5v7m0-4h5v4M10 8h.01m5 0h.01" {...common} />
        </>
      )}
      {name === "mountain" && (
        <Path d="m2.5 19 7-12 4 6 2-3 6 9z" {...common} />
      )}
      {name === "fireplace" && (
        <Path d="M13 2c1 5-4 6-2 10 1-1 2-2 2-4 4 3 6 6 4 10a6 6 0 0 1-11-2c0-3 2-5 4-7 0 3 1 4 2 4 2-4-1-7 1-11Z" {...common} />
      )}
      {name === "wifi" && (
        <>
          <Path d="M3 9a14 14 0 0 1 18 0M6 12a9 9 0 0 1 12 0m-9 3a4 4 0 0 1 6 0" {...common} />
          <Circle cx="12" cy="19" r="1" fill={color} />
        </>
      )}
      {name === "sparkle" && (
        <>
          <Path d="m9 3 1.4 5.6L16 10l-5.6 1.4L9 17l-1.4-5.6L2 10l5.6-1.4L9 3Z" {...common} />
          <Path d="m18 14 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z" {...common} />
        </>
      )}
      {name === "calendar" && (
        <>
          <Path d="M4 7h16v14H4zM8 3v4m8-4v4M4 11h16" {...common} />
        </>
      )}
      {name === "person" && (
        <>
          <Circle cx="12" cy="8" r="4" {...common} />
          <Path d="M4 21v-2a8 8 0 0 1 16 0v2z" {...common} />
        </>
      )}
    </Svg>
  );
}

export function PropertyCard({
  image,
  location,
  title,
  rating,
  price,
  compact = false,
}: {
  image: string;
  location: string;
  title: string;
  rating: string;
  price: number;
  compact?: boolean;
}) {
  return (
    <View style={[styles.propertyCard, compact ? styles.compactCard : undefined]}>
      <Image
        accessibilityLabel={`${title}, in ${location}`}
        resizeMode="cover"
        source={{ uri: image }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.imageShade} />
      <View style={styles.ratingPill}>
        <Text style={styles.star}>★</Text>
        <Text style={styles.rating}>{rating}</Text>
      </View>
      <View style={styles.propertyCopy}>
        <View style={styles.locationLine}>
          <LineIcon name="pin" size={16} color="#FFFFFF" strokeWidth={2.5} />
          <Text numberOfLines={1} style={styles.locationText}>{location}</Text>
        </View>
        <Text numberOfLines={2} style={styles.propertyTitle}>{title}</Text>
        <Text style={styles.priceText}>${price} <Text style={styles.priceSuffix}>/ night</Text></Text>
      </View>
      {!compact && (
        <View style={styles.cardArrow}>
          <LineIcon name="chevron" size={24} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.82 },
  propertyCard: {
    height: 370,
    overflow: "hidden",
    borderRadius: 24,
    backgroundColor: "#D7D7DC",
  },
  compactCard: { height: 245 },
  imageShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(7, 10, 17, 0.12)",
    borderRadius: 24,
  },
  ratingPill: {
    position: "absolute",
    top: 15,
    right: 15,
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.96)",
  },
  star: { color: ink, fontSize: 17 },
  rating: { color: ink, fontFamily: "Manrope_800ExtraBold", fontSize: 15 },
  propertyCopy: {
    position: "absolute",
    right: 20,
    bottom: 20,
    left: 20,
    paddingRight: 48,
  },
  locationLine: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 7 },
  locationText: {
    flexShrink: 1,
    color: "#FFFFFF",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 4,
  },
  propertyTitle: {
    color: "#FFFFFF",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 25,
    lineHeight: 30,
    letterSpacing: -0.9,
    textShadowColor: "rgba(0,0,0,0.42)",
    textShadowRadius: 6,
  },
  priceText: {
    marginTop: 6,
    color: "#FFFFFF",
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 4,
  },
  priceSuffix: { fontFamily: "Manrope_500Medium" },
  cardArrow: {
    position: "absolute",
    right: 16,
    bottom: 18,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },
});
