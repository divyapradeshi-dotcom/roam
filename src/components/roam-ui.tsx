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
  filled = false,
}: {
  filled?: boolean;
  name:
    | "search"
    | "home"
    | "cabin"
    | "beach"
    | "city"
    | "palm"
    | "pin"
    | "arrow"
    | "arrow-up"
    | "chevron"
    | "chevron-down"
    | "chevron-left"
    | "sparkle"
    | "calendar"
    | "person"
    | "sliders"
    | "heart"
    | "heart-fill"
    | "star"
    | "hot-tub"
    | "paw"
    | "pool"
    | "mountain"
    | "fireplace"
    | "wifi"
    | "waves"
    | "sauna"
    | "share"
    | "chat"
    | "policy"
    | "rosette"
    | "chevron-right"
    | "settings"
    | "card"
    | "suitcase"
    | "bell"
    | "help";
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
      {name === "home" && <Path d="m3 10 9-7 9 7v10h-6v-6H9v6H3z" fill={filled ? color : "none"} stroke={color} strokeWidth={strokeWidth} />}
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
      {name === "arrow-up" && <Path d="M12 19V5M5 12l7-7 7 7" {...common} />}
      {name === "chevron" && <Polyline points="9 5 16 12 9 19" {...common} />}
      {name === "chevron-down" && <Polyline points="6 9 12 15 18 9" {...common} />}
      {name === "chevron-left" && <Polyline points="15 19 8 12 15 5" {...common} />}
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
      {name === "heart-fill" && (
        <Path
          d="M20.8 8.8c0 4.2-8.8 11-8.8 11s-8.8-6.8-8.8-11A4.8 4.8 0 0 1 12 6.4a4.8 4.8 0 0 1 8.8 2.4Z"
          fill={color}
          stroke={color}
          strokeWidth={strokeWidth}
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
      {name === "waves" && (
        <>
          <Path d="M2 7c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0" {...common} />
        </>
      )}
      {name === "sauna" && (
        <>
          <Path d="M4 6h16v13H4zM8 6V3m8 3V3M7 11h10M7 15h10" {...common} />
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
      {name === "chevron-right" && <Polyline points="9 5 16 12 9 19" {...common} />}
      {name === "settings" && (
        <>
          <Circle cx="12" cy="12" r="3" {...common} />
          <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" {...common} />
        </>
      )}
      {name === "card" && (
        <>
          <Path d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" {...common} />
          <Path d="M2 10h20" {...common} />
          <Path d="M6 15h4" {...common} />
        </>
      )}
      {name === "suitcase" && (
        <>
          <Path d="M6 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" {...common} />
          <Path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" {...common} />
          <Path d="M12 12v3" {...common} />
        </>
      )}
      {name === "bell" && (
        <>
          <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" {...common} />
          <Path d="M13.73 21a2 2 0 0 1-3.46 0" {...common} />
        </>
      )}
      {name === "help" && (
        <>
          <Circle cx="12" cy="12" r="9" {...common} />
          <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" {...common} />
          <Circle cx="12" cy="17" r="0.5" fill={color} />
        </>
      )}

      {name === "share" && (
        <>
          <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" {...common} />
        </>
      )}
      {name === "chat" && (
        <Path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" {...common} />
      )}
      {name === "policy" && (
        <>
          <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" {...common} />
          <Polyline points="14 2 14 8 20 8" {...common} />
          <Path d="M16 13H8M16 17H8" {...common} />
        </>
      )}
      {name === "rosette" && (
        <>
          <Circle cx="12" cy="8" r="5" {...common} />
          <Path d="m9 13-2 8 5-2.5 5 2.5-2-8" {...common} />
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
