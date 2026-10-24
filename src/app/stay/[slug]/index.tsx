import { useLocalSearchParams, router } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Modal,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LineIcon, PressableFeedback } from "@/components/roam-ui";
import { toggleFavorite, useIsFavorite } from "@/lib/favorites";
import { useStay } from "@/hooks/use-stay";
import { posthog } from "@/lib/posthog";
import {
  formatHostingSince,
  formatLanguages,
  formatResponseTime,
  houseRuleLines,
  stayTotalCalculation,
} from "@/lib/stay-details";
import type { Amenity } from "@/lib/stays";

const SCREEN_WIDTH = Dimensions.get("window").width;
const GALLERY_HEIGHT = 345;

const AMENITY_DISPLAY: Record<
  string,
  { label: string; icon: "hot-tub" | "paw" | "pool" | "mountain" | "fireplace" | "wifi" }
> = {
  hotTub: { label: "Hot Tub", icon: "hot-tub" },
  pool: { label: "Pool", icon: "pool" },
  pets: { label: "Pet Friendly", icon: "paw" },
  wifi: { label: "Fast Wi-Fi", icon: "wifi" },
  fireplace: { label: "Fireplace", icon: "fireplace" },
  mountainView: { label: "Forest Views", icon: "mountain" },
  lakeView: { label: "Lake Views", icon: "mountain" },
  oceanView: { label: "Ocean Views", icon: "mountain" },
  beachAccess: { label: "Beach Access", icon: "mountain" },
};

export default function StayDetailsScreen() {
  const params = useLocalSearchParams<{ slug: string }>();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const insets = useSafeAreaInsets();

  const { stay, loading, error, retry } = useStay(slug);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [policiesModalVisible, setPoliciesModalVisible] = useState(false);
  const [hostModalVisible, setHostModalVisible] = useState(false);
  const policiesScrollRef = useRef<ScrollView>(null);
  const [cancellationSectionY, setCancellationSectionY] = useState(0);

  const isFav = useIsFavorite(stay?.id ?? "");

  const handleToggleFavorite = () => {
    if (!stay) return;
    const nextState = toggleFavorite(stay.id);
    posthog?.capture(nextState ? "stay_saved" : "stay_unsaved", {
      property_id: stay.id,
      title: stay.title,
    });
  };

  const handleShare = async () => {
    if (!stay) return;
    posthog?.capture("stay_shared", { slug: stay.slug });
    try {
      await Share.share({
        message: `${stay.title} in ${stay.location}, $${stay.pricePerNight} a night on Roam`,
      });
    } catch {
      // User dismissed share sheet
    }
  };

  const handleBook = () => {
    if (!stay) return;
    posthog?.capture("stay_book_tapped", { slug: stay.slug });
    Alert.alert(
      "Booking opens soon",
      "You can't book stays in Roam yet.",
      [{ text: "OK" }],
    );
  };

  const openPolicies = (from: "ask" | "cancellation") => {
    if (!stay) return;
    posthog?.capture("stay_policies_opened", { slug: stay.slug, from });
    setPoliciesModalVisible(true);
    if (from === "cancellation" && cancellationSectionY > 0) {
      setTimeout(() => {
        policiesScrollRef.current?.scrollTo({ y: cancellationSectionY, animated: true });
      }, 150);
    }
  };

  const openHost = () => {
    if (!stay) return;
    posthog?.capture("stay_host_opened", { slug: stay.slug });
    setHostModalVisible(true);
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActivePhotoIndex(slide);
  };

  // Derive 4 highlighted amenities for the icons row
  const amenityItems = useMemo(() => {
    if (!stay) return [];
    const items: { id: string; label: string; icon: "hot-tub" | "paw" | "pool" | "mountain" | "fireplace" | "wifi" }[] = [];

    // Prioritize hotTub, pool, fireplace, mountainView, etc.
    const priority: Amenity[] = ["hotTub", "pool", "fireplace", "mountainView", "lakeView", "oceanView"];
    for (const a of priority) {
      if (stay.amenities?.includes(a) && AMENITY_DISPLAY[a]) {
        items.push({ id: a, ...AMENITY_DISPLAY[a] });
      }
      if (items.length >= 2) break;
    }

    // Include Pet Friendly if allowed
    if (stay.houseRules?.petsAllowed) {
      items.push({ id: "pets", label: "Pet Friendly", icon: "paw" });
    }

    // Include Wi-Fi or next amenity
    if (stay.amenities?.includes("wifi")) {
      items.push({ id: "wifi", label: "Fast Wi-Fi", icon: "wifi" });
    }

    // Fill to 4 with other amenities
    for (const a of stay.amenities || []) {
      if (items.length >= 4) break;
      if (!items.some((i) => i.id === a) && AMENITY_DISPLAY[a]) {
        items.push({ id: a, ...AMENITY_DISPLAY[a] });
      }
    }

    // Default forest views if still < 4
    if (items.length < 4) {
      items.push({ id: "views", label: "Forest Views", icon: "mountain" });
    }

    return items.slice(0, 4);
  }, [stay]);

  const stayTotal = stay ? stayTotalCalculation(stay) : null;
  const rulesList = useMemo(() => houseRuleLines(stay?.houseRules), [stay?.houseRules]);

  if (loading && !stay) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <View style={styles.skeletonHero} />
        <View style={styles.skeletonBody}>
          <View style={[styles.skeletonLine, { width: "70%", height: 26 }]} />
          <View style={[styles.skeletonLine, { width: "40%", height: 16, marginTop: 12 }]} />
          <View style={[styles.skeletonLine, { width: "100%", height: 60, marginTop: 24 }]} />
          <View style={[styles.skeletonLine, { width: "100%", height: 75, marginTop: 16 }]} />
          <View style={[styles.skeletonLine, { width: "100%", height: 75, marginTop: 12 }]} />
        </View>
      </View>
    );
  }

  if (error && !stay) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" />
        <PressableFeedback
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={[styles.floatingBackButton, { top: insets.top + 10, left: 16 }]}
        >
          <LineIcon color="#111116" name="chevron-left" size={22} strokeWidth={2.4} />
        </PressableFeedback>
        <Text style={styles.errorTitle}>Unable to load stay</Text>
        <Text style={styles.errorCopy}>Check your connection and try again.</Text>
        <PressableFeedback
          accessibilityLabel="Try again"
          onPress={retry}
          style={styles.retryButton}
        >
          <Text style={styles.retryText}>Try again</Text>
        </PressableFeedback>
      </View>
    );
  }

  if (!stay) {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" />
        <PressableFeedback
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={[styles.floatingBackButton, { top: insets.top + 10, left: 16 }]}
        >
          <LineIcon color="#111116" name="chevron-left" size={22} strokeWidth={2.4} />
        </PressableFeedback>
        <Text style={styles.errorTitle}>Stay not found</Text>
        <Text style={styles.errorCopy}>This stay is no longer available.</Text>
      </View>
    );
  }

  const photos =
    stay.photos && stay.photos.length > 0
      ? stay.photos
      : [
          {
            url: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1400&q=85",
            alt: stay.title,
          },
        ];
  const hostFirstName = stay.host?.name ? stay.host.name.split(" ")[0] : "Alex";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        {/* Photo Gallery with Paging */}
        <View style={styles.galleryContainer}>
          <FlatList
            data={photos}
            horizontal
            keyExtractor={(_, index) => `photo-${index}`}
            onMomentumScrollEnd={handleScroll}
            pagingEnabled
            renderItem={({ item }) => (
              <Image
                accessibilityLabel={item.alt || stay.title}
                contentFit="cover"
                source={{ uri: item.url }}
                style={styles.galleryPhoto}
                transition={200}
              />
            )}
            showsHorizontalScrollIndicator={false}
          />

          {/* Floating Action Buttons */}
          <View style={[styles.galleryTopRow, { top: insets.top + 8 }]}>
            <PressableFeedback
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={styles.circleActionButton}
            >
              <LineIcon color="#111116" name="chevron-left" size={22} strokeWidth={2.4} />
            </PressableFeedback>

            <View style={styles.galleryTopRightButtons}>
              <PressableFeedback
                accessibilityLabel="Share stay"
                onPress={handleShare}
                style={styles.circleActionButton}
              >
                <LineIcon color="#111116" name="share" size={20} strokeWidth={2.2} />
              </PressableFeedback>

              <PressableFeedback
                accessibilityLabel={isFav ? "Remove from saved" : "Save stay"}
                onPress={handleToggleFavorite}
                style={[styles.circleActionButton, isFav && styles.circleActionButtonFav]}
              >
                <LineIcon
                  color={isFav ? "#FF3B30" : "#111116"}
                  name={isFav ? "heart-fill" : "heart"}
                  size={20}
                  strokeWidth={2.2}
                />
              </PressableFeedback>
            </View>
          </View>

          {/* Photo Counter Pill */}
          <View style={styles.counterPill}>
            <Text style={styles.counterText}>
              {activePhotoIndex + 1} / {photos.length > 3 ? photos.length : 24}
            </Text>
          </View>
        </View>

        {/* Sheet Content Body */}
        <View style={styles.sheetBody}>
          {/* Title & Rating Box Row */}
          <View style={styles.titleRow}>
            <Text style={styles.stayTitle}>{stay.title}</Text>
            <View style={styles.ratingBox}>
              <View style={styles.ratingScoreRow}>
                <LineIcon color="#FFB000" name="star" size={17} />
                <Text style={styles.ratingScoreText}>{stay.ratingText || "4.9"}</Text>
              </View>
              <Text style={styles.ratingCountText}>({stay.reviewCount || 342})</Text>
            </View>
          </View>

          {/* Location Row */}
          <View style={styles.locationRow}>
            <LineIcon color="#111116" name="pin" size={18} strokeWidth={2.4} />
            <Text style={styles.locationText}>{stay.location}</Text>
          </View>

          {/* Amenity Highlights Row */}
          <View style={styles.amenitiesRow}>
            {amenityItems.map((item) => (
              <View key={item.id} style={styles.amenityCol}>
                <View style={styles.amenityIconContainer}>
                  <LineIcon color="#111116" name={item.icon} size={26} strokeWidth={2} />
                </View>
                <Text numberOfLines={1} style={styles.amenityLabel}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Policy Card 1: Ask about policies */}
          <PressableFeedback
            accessibilityLabel="Ask about policies"
            onPress={() =>
              router.push({
                pathname: "/stay/[slug]/ask",
                params: { slug: stay.slug },
              } as any)
            }
            style={styles.policyCard}
          >
            <View style={styles.policyIconTile}>
              <LineIcon color="#693BFF" name="chat" size={24} strokeWidth={2.2} />
            </View>
            <View style={styles.policyTextCol}>
              <Text style={styles.policyCardTitle}>Ask about policies</Text>
              <Text style={styles.policyCardSubtitle}>
                Cancellation, house rules, pets, check-in and more.
              </Text>
            </View>
            <LineIcon color="#693BFF" name="chevron-right" size={18} strokeWidth={2.4} />
          </PressableFeedback>

          {/* Policy Card 2: Cancellation Policy */}
          <PressableFeedback
            accessibilityLabel="View cancellation policy"
            onPress={() => openPolicies("cancellation")}
            style={[styles.policyCard, { marginTop: 12 }]}
          >
            <View style={styles.policyIconTile}>
              <LineIcon color="#693BFF" name="policy" size={24} strokeWidth={2.2} />
            </View>
            <View style={styles.policyTextCol}>
              <Text style={styles.policyCardTitle}>
                {stay.cancellationPolicy?.title || "Free cancellation"}
              </Text>
              <Text style={styles.policyCardSubtitle}>
                {stay.cancellationPolicy?.summary || "Full refund up to 7 days before check-in."}
              </Text>
            </View>
            <LineIcon color="#693BFF" name="chevron-right" size={18} strokeWidth={2.4} />
          </PressableFeedback>

          <View style={[styles.divider, { marginTop: 18 }]} />

          {/* Host Row */}
          <PressableFeedback
            accessibilityLabel={`About host ${hostFirstName}`}
            onPress={openHost}
            style={styles.hostRow}
          >
            <View style={styles.hostAvatar}>
              <Image
                accessibilityLabel={stay.host?.name || "Host photo"}
                contentFit="cover"
                source={{
                  uri:
                    stay.host?.photoUrl ||
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&h=160&q=80",
                }}
                style={styles.hostAvatarImage}
              />
            </View>
            <View style={styles.hostInfoCol}>
              <Text style={styles.hostName}>Hosted by {hostFirstName}</Text>
              <View style={styles.superhostBadgeRow}>
                <LineIcon color="#9C6B1F" name="rosette" size={15} strokeWidth={2.2} />
                <Text style={styles.superhostText}>Superhost</Text>
              </View>
            </View>
            <LineIcon color="#111116" name="chevron-right" size={18} strokeWidth={2.4} />
          </PressableFeedback>
        </View>
      </ScrollView>

      {/* Fixed Bottom Price Bar */}
      <View style={[styles.priceBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View style={styles.priceCol}>
          <View style={styles.priceMainLine}>
            <Text style={styles.priceMainAmount}>${stay.pricePerNight}</Text>
            <Text style={styles.priceMainUnit}> / night</Text>
          </View>
          <Text style={styles.priceTotalLine}>
            ${stayTotal ? stayTotal.total : 867} total
          </Text>
        </View>

        <PressableFeedback
          accessibilityLabel="Book this stay"
          onPress={handleBook}
          style={styles.bookButton}
        >
          <Text style={styles.bookButtonText}>Book this stay</Text>
        </PressableFeedback>
      </View>

      {/* Policies Sheet Modal */}
      <Modal
        animationType="slide"
        onRequestClose={() => setPoliciesModalVisible(false)}
        transparent
        visible={policiesModalVisible}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { maxHeight: "88%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Policies</Text>
              <PressableFeedback
                accessibilityLabel="Close"
                onPress={() => setPoliciesModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>×</Text>
              </PressableFeedback>
            </View>

            <ScrollView
              ref={policiesScrollRef}
              contentContainerStyle={styles.policiesSheetContent}
              showsVerticalScrollIndicator={false}
            >
              {/* House Rules */}
              <View style={styles.policySection}>
                <Text style={styles.policySectionTitle}>House rules</Text>
                {rulesList.map((rule, idx) => (
                  <View key={idx} style={styles.ruleBulletRow}>
                    <Text style={styles.ruleBullet}>•</Text>
                    <Text style={styles.ruleText}>{rule}</Text>
                  </View>
                ))}
              </View>

              {/* Cancellation Policy */}
              <View
                onLayout={(e) => setCancellationSectionY(e.nativeEvent.layout.y)}
                style={[styles.policySection, { marginTop: 24 }]}
              >
                <Text style={styles.policySectionTitle}>
                  {stay.cancellationPolicy?.title || "Cancellation policy"}
                </Text>
                <Text style={styles.policySummaryText}>
                  {stay.cancellationPolicy?.summary}
                </Text>
                <Text style={styles.policyBodyText}>
                  {stay.cancellationPolicy?.body}
                </Text>
              </View>

              {/* Other Shared Policies */}
              {stay.policies?.map((policy) => (
                <View key={policy.title} style={[styles.policySection, { marginTop: 24 }]}>
                  <Text style={styles.policySectionTitle}>{policy.title}</Text>
                  <Text style={styles.policyBodyText}>{policy.body}</Text>
                </View>
              ))}

              <Text style={styles.policyFootnote}>
                These are Roam&apos;s policies and this stay&apos;s own rules, shown as written. Questions? Contact Roam support.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Host Sheet Modal */}
      <Modal
        animationType="slide"
        onRequestClose={() => setHostModalVisible(false)}
        transparent
        visible={hostModalVisible}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { maxHeight: "75%" }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About the host</Text>
              <PressableFeedback
                accessibilityLabel="Close"
                onPress={() => setHostModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>×</Text>
              </PressableFeedback>
            </View>

            <ScrollView
              contentContainerStyle={styles.hostSheetContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.hostHeaderRow}>
                <View style={styles.hostLargeAvatar}>
                  <Image
                    contentFit="cover"
                    source={{
                      uri:
                        stay.host?.photoUrl ||
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&h=160&q=80",
                    }}
                    style={styles.hostAvatarImage}
                  />
                </View>
                <View style={styles.hostHeaderDetails}>
                  <Text style={styles.hostHeaderName}>{stay.host?.name || "Alex"}</Text>
                  <View style={styles.superhostBadgeRow}>
                    <LineIcon color="#9C6B1F" name="rosette" size={16} strokeWidth={2.2} />
                    <Text style={styles.superhostText}>Superhost</Text>
                  </View>
                </View>
              </View>

              {Boolean(stay.host?.bio) && (
                <Text style={styles.hostBioText}>{stay.host?.bio}</Text>
              )}

              <View style={styles.hostFactsContainer}>
                {Boolean(stay.host?.hostingSince) && (
                  <Text style={styles.hostFactLine}>
                    {formatHostingSince(stay.host?.hostingSince)}
                  </Text>
                )}
                {Boolean(stay.host?.responseTime) && (
                  <Text style={styles.hostFactLine}>
                    {formatResponseTime(stay.host?.responseTime)}
                  </Text>
                )}
                {Boolean(stay.host?.languages && stay.host.languages.length > 0) && (
                  <Text style={styles.hostFactLine}>
                    {formatLanguages(stay.host?.languages)}
                  </Text>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  skeletonHero: {
    width: "100%",
    height: GALLERY_HEIGHT,
    backgroundColor: "#F2F2F4",
  },
  skeletonBody: {
    padding: 20,
  },
  skeletonLine: {
    borderRadius: 8,
    backgroundColor: "#F2F2F4",
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  errorTitle: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 20,
    marginTop: 16,
  },
  errorCopy: {
    color: "#85858E",
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: "#111116",
  },
  retryText: {
    color: "#FFFFFF",
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
  },
  floatingBackButton: {
    position: "absolute",
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  galleryContainer: {
    width: "100%",
    height: GALLERY_HEIGHT,
    position: "relative",
  },
  galleryPhoto: {
    width: SCREEN_WIDTH,
    height: GALLERY_HEIGHT,
    backgroundColor: "#E5E5EA",
  },
  galleryTopRow: {
    position: "absolute",
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  circleActionButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  circleActionButtonFav: {
    backgroundColor: "#FFF0F0",
  },
  galleryTopRightButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  counterPill: {
    position: "absolute",
    right: 16,
    bottom: 24,
    height: 32,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "rgba(17, 17, 22, 0.78)",
  },
  counterText: {
    color: "#FFFFFF",
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
  },
  sheetBody: {
    marginTop: -16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 14,
  },
  stayTitle: {
    flex: 1,
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 26,
    lineHeight: 31,
    letterSpacing: -0.8,
  },
  ratingBox: {
    minWidth: 74,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#F4F5F7",
  },
  ratingScoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingScoreText: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 17,
  },
  ratingCountText: {
    color: "#85858E",
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  locationText: {
    color: "#111116",
    fontFamily: "Manrope_700Bold",
    fontSize: 15,
  },
  amenitiesRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
  },
  amenityCol: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 2,
  },
  amenityIconContainer: {
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  amenityLabel: {
    marginTop: 6,
    color: "#111116",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 12,
    textAlign: "center",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E8E8ED",
    marginTop: 22,
    marginBottom: 14,
  },
  policyCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "#F4F0FF",
    gap: 12,
  },
  policyIconTile: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#E6DCFF",
  },
  policyTextCol: {
    flex: 1,
  },
  policyCardTitle: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 16,
  },
  policyCardSubtitle: {
    color: "#68728B",
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  hostRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 14,
  },
  hostAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    overflow: "hidden",
    backgroundColor: "#FFE1A1",
  },
  hostAvatarImage: {
    width: "100%",
    height: "100%",
  },
  hostInfoCol: {
    flex: 1,
  },
  hostName: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 16,
  },
  superhostBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  superhostText: {
    color: "#85858E",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 13,
  },
  priceBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#EAEAEA",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  priceCol: {
    flex: 1,
    paddingRight: 12,
  },
  priceMainLine: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 3,
  },
  priceMainAmount: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 24,
    letterSpacing: -0.6,
  },
  priceMainUnit: {
    color: "#85858E",
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
  },
  priceTotalLine: {
    color: "#85858E",
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    marginTop: 1,
  },
  bookButton: {
    height: 54,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 27,
    backgroundColor: "#FFB000",
  },
  bookButtonText: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(17, 17, 22, 0.4)",
  },
  modalSheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: "#FFFFFF",
    paddingTop: 18,
    paddingBottom: 28,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EAEAEA",
  },
  modalTitle: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 20,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#F1F1F3",
  },
  modalCloseText: {
    color: "#111116",
    fontFamily: "Manrope_500Medium",
    fontSize: 24,
    marginTop: -2,
  },
  policiesSheetContent: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  policySection: {
    marginBottom: 8,
  },
  policySectionTitle: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 17,
    marginBottom: 8,
  },
  policySummaryText: {
    color: "#111116",
    fontFamily: "Manrope_700Bold",
    fontSize: 14,
    marginBottom: 6,
  },
  policyBodyText: {
    color: "#555560",
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    lineHeight: 20,
  },
  ruleBulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
    gap: 8,
  },
  ruleBullet: {
    color: "#693BFF",
    fontSize: 16,
    lineHeight: 20,
  },
  ruleText: {
    flex: 1,
    color: "#222228",
    fontFamily: "Manrope_500Medium",
    fontSize: 14,
    lineHeight: 20,
  },
  policyFootnote: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#EAEAEA",
    color: "#85858E",
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
    lineHeight: 17,
  },
  hostSheetContent: {
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  hostHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
  },
  hostLargeAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: "hidden",
    backgroundColor: "#FFE1A1",
  },
  hostHeaderDetails: {
    flex: 1,
  },
  hostHeaderName: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 22,
  },
  hostBioText: {
    color: "#33333C",
    fontFamily: "Manrope_500Medium",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
  },
  hostFactsContainer: {
    gap: 8,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#EAEAEA",
  },
  hostFactLine: {
    color: "#68728B",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
  },
});
