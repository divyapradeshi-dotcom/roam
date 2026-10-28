import { useLocalSearchParams, router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import Animated, { FadeIn, FadeInDown, useReducedMotion } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { LineIcon, PressableFeedback } from "@/components/roam-ui";
import { toggleFavorite, useIsFavorite } from "@/lib/favorites";
import { posthog } from "@/lib/posthog";
import { useSearchStays } from "@/hooks/use-search-stays";
import { parseSearchQuery } from "@/lib/search/parse";
import {
  matchTags,
  type ChipItem,
  type SearchSortOption,
  type SearchStayItem,
} from "@/lib/search/query";

const SORT_OPTIONS: { id: SearchSortOption; label: string }[] = [
  { id: "best_match", label: "Best match" },
  { id: "price_asc", label: "Price: low to high" },
  { id: "price_desc", label: "Price: high to low" },
  { id: "top_rated", label: "Top rated" },
];

function StayCard({
  stay,
  parsedQuery,
}: {
  stay: SearchStayItem;
  parsedQuery: ReturnType<typeof parseSearchQuery>;
}) {
  const isFav = useIsFavorite(stay.id);
  const tags = useMemo(() => matchTags(stay, parsedQuery), [stay, parsedQuery]);

  const onToggleSaved = () => {
    const nextState = toggleFavorite(stay.id);
    posthog?.capture(nextState ? "stay_saved" : "stay_unsaved", {
      property_id: stay.id,
      title: stay.title,
    });
  };

  return (
    <PressableFeedback
      accessibilityLabel={`Open details for ${stay.title}`}
      onPress={() => router.push({ pathname: "/stay/[slug]", params: { slug: stay.slug } } as any)}
      style={styles.cardContainer}
    >
      <Image
        accessibilityLabel={`${stay.title}, in ${stay.location}`}
        contentFit="cover"
        source={{ uri: stay.imageUrl }}
        style={styles.cardPhoto}
        transition={200}
      />
      <View style={styles.cardDetails}>
        <View style={styles.cardTopRow}>
          <Text numberOfLines={2} style={styles.cardTitle}>
            {stay.title}
          </Text>
          <PressableFeedback
            accessibilityLabel={isFav ? `Remove ${stay.title} from favorites` : `Save ${stay.title}`}
            onPress={onToggleSaved}
            style={[styles.heartButton, isFav && styles.heartButtonActive]}
          >
            <LineIcon
              color={isFav ? "#FF3B30" : "#111116"}
              name={isFav ? "heart-fill" : "heart"}
              size={20}
              strokeWidth={2.1}
            />
          </PressableFeedback>
        </View>

        <View style={styles.locationRow}>
          <LineIcon color="#92929C" name="pin" size={14} strokeWidth={2.4} />
          <Text numberOfLines={1} style={styles.locationText}>
            {stay.location}
          </Text>
        </View>

        <View style={styles.ratingRow}>
          <LineIcon color="#FFB000" name="star" size={16} />
          <Text style={styles.ratingScore}>{stay.ratingText}</Text>
          <Text style={styles.ratingCount}>({stay.reviewCount})</Text>
        </View>

        <View style={styles.tagsRow}>
          {tags.map((tag) => (
            <View key={tag.id} style={styles.tagPill}>
              <LineIcon color="#111116" name={tag.icon} size={14} strokeWidth={2.1} />
              <Text style={styles.tagText}>{tag.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.priceAmount}>${stay.price}</Text>
          <Text style={styles.priceSuffix}> / night</Text>
        </View>
      </View>
    </PressableFeedback>
  );
}

function SkeletonCard() {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.skeletonPhoto} />
      <View style={styles.cardDetails}>
        <View style={[styles.skeletonLine, { width: "80%", height: 18 }]} />
        <View style={[styles.skeletonLine, { width: "50%", height: 13, marginTop: 8 }]} />
        <View style={[styles.skeletonLine, { width: "35%", height: 13, marginTop: 8 }]} />
        <View style={[styles.skeletonLine, { width: "65%", height: 24, marginTop: 10 }]} />
        <View style={[styles.skeletonLine, { width: "40%", height: 18, marginTop: 10 }]} />
      </View>
    </View>
  );
}

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const initialQuery = typeof params.q === "string" ? params.q : "";

  return <SearchContent key={initialQuery} initialQuery={initialQuery} />;
}

function SearchContent({ initialQuery }: { initialQuery: string }) {
  const reduceMotion = useReducedMotion();
  const [inputText, setInputText] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [sort, setSort] = useState<SearchSortOption>("best_match");
  const [sortModalVisible, setSortModalVisible] = useState(false);

  // Initialize selected chip IDs from initialQuery
  const [toggledChipIds, setToggledChipIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    const initialParsed = parseSearchQuery(initialQuery);
    if (initialParsed.type) set.add("type");
    if (typeof initialParsed.maxPrice === "number") set.add(`price:${initialParsed.maxPrice}`);
    if (typeof initialParsed.guests === "number") set.add(`guests:${initialParsed.guests}`);
    if (initialParsed.petsAllowed) set.add("pets");
    if (initialParsed.quiet) set.add("quiet");
    for (const a of initialParsed.amenities) {
      set.add(`amenity:${a}`);
    }
    return set;
  });

  const { stays, total, loading, error, retry, chips, effectiveParsed, requestKey } =
    useSearchStays(activeQuery, sort, toggledChipIds);

  const currentSortLabel =
    SORT_OPTIONS.find((opt) => opt.id === sort)?.label ?? "Best match";

  const handleSearchSubmit = useCallback(() => {
    const trimmed = inputText.trim();
    setActiveQuery(trimmed);

    // Reset toggled chips to match new query
    const newlyParsed = parseSearchQuery(trimmed);
    const newSet = new Set<string>();
    if (newlyParsed.type) newSet.add("type");
    if (typeof newlyParsed.maxPrice === "number") newSet.add(`price:${newlyParsed.maxPrice}`);
    if (typeof newlyParsed.guests === "number") newSet.add(`guests:${newlyParsed.guests}`);
    if (newlyParsed.petsAllowed) newSet.add("pets");
    if (newlyParsed.quiet) newSet.add("quiet");
    for (const a of newlyParsed.amenities) {
      newSet.add(`amenity:${a}`);
    }
    setToggledChipIds(newSet);
  }, [inputText]);

  const handleChipPress = (chip: ChipItem) => {
    const nextSet = new Set(toggledChipIds);
    const turningOn = !nextSet.has(chip.id);

    if (turningOn) {
      nextSet.add(chip.id);
    } else {
      nextSet.delete(chip.id);
    }

    posthog?.capture("stay_filter_updated", {
      filter: chip.label,
      action: turningOn ? "applied" : "removed",
      kind: chip.kind,
    });

    setToggledChipIds(nextSet);
  };

  const handleSelectSort = (option: SearchSortOption) => {
    setSort(option);
    setSortModalVisible(false);
    posthog?.capture("stay_sort_changed", {
      sort_order: option,
    });
  };

  const handleClearAll = () => {
    setInputText("");
    setActiveQuery("");
    setToggledChipIds(new Set());
  };

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.navigate("/home");
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <Animated.View
        entering={reduceMotion ? FadeIn.duration(160) : FadeInDown.duration(200)}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar: Back Button + Search Bar Pill with Sliders */}
          <View style={styles.topRow}>
            <PressableFeedback
              accessibilityLabel="Go back to Home"
              onPress={goBack}
              style={styles.backButton}
            >
              <LineIcon color="#111116" name="chevron-left" size={22} strokeWidth={2.4} />
            </PressableFeedback>

            <View style={styles.searchBar}>
              <LineIcon color="#111116" name="search" size={22} strokeWidth={2.4} />
              <TextInput
                accessibilityLabel="Search stays"
                autoCapitalize="none"
                onChangeText={setInputText}
                onSubmitEditing={handleSearchSubmit}
                placeholder="Search stays"
                placeholderTextColor="#777780"
                returnKeyType="search"
                style={styles.searchInput}
                value={inputText}
              />
              {inputText.length > 0 && (
                <PressableFeedback
                  accessibilityLabel="Clear text"
                  onPress={() => setInputText("")}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearText}>×</Text>
                </PressableFeedback>
              )}
              <View
                accessibilityLabel="Filters"
                accessibilityState={{ disabled: true }}
                style={styles.filterButton}
              >
                <LineIcon color="#111116" name="sliders" size={22} strokeWidth={2.2} />
              </View>
            </View>
          </View>

          {/* Chips Row: Selected Constraints in Lavender, followed by Suggestions */}
          {chips.length > 0 && (
            <ScrollView
              horizontal
              contentContainerStyle={styles.chipsContainer}
              showsHorizontalScrollIndicator={false}
            >
              {chips.map((chip) => (
                <PressableFeedback
                  key={chip.id}
                  accessibilityLabel={`${chip.selected ? "Remove" : "Apply"} ${chip.label} filter`}
                  onPress={() => handleChipPress(chip)}
                  style={[styles.chip, chip.selected ? styles.chipSelected : styles.chipUnselected]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      chip.selected ? styles.chipTextSelected : styles.chipTextUnselected,
                    ]}
                  >
                    {chip.label}
                  </Text>
                </PressableFeedback>
              ))}
            </ScrollView>
          )}

          {/* Results Count & Sort Dropdown Row */}
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>
              {total} {total === 1 ? "stay" : "stays"}
            </Text>

            <PressableFeedback
              accessibilityLabel={`Change sort order; currently ${currentSortLabel}`}
              onPress={() => setSortModalVisible(true)}
              style={styles.sortButton}
            >
              <Text style={styles.sortLabel}>Sort by </Text>
              <Text style={styles.sortValue}>{currentSortLabel}</Text>
              <LineIcon color="#111116" name="chevron-down" size={15} strokeWidth={2.4} />
            </PressableFeedback>
          </View>

          {/* Main Results List / States */}
          {loading && stays.length === 0 ? (
            <View style={styles.listContainer}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : error && stays.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Unable to load stays</Text>
              <Text style={styles.emptyCopy}>{error.message}</Text>
              <PressableFeedback
                accessibilityLabel="Try loading stays again"
                onPress={retry}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Try again</Text>
              </PressableFeedback>
            </View>
          ) : stays.length > 0 ? (
            <View key={requestKey} style={styles.listContainer}>
              {stays.map((stay, index) => (
                <Animated.View
                  key={stay.id}
                  entering={
                    reduceMotion
                      ? FadeIn.duration(120)
                      : FadeInDown.duration(200).delay(Math.min(index * 35, 210))
                  }
                >
                  <StayCard parsedQuery={effectiveParsed} stay={stay} />
                </Animated.View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <LineIcon color="#92929A" name="search" size={32} />
              <Text style={styles.emptyTitle}>No stays match that yet</Text>
              <Text style={styles.emptyCopy}>
                Try changing your search or removing a filter.
              </Text>
              <PressableFeedback
                accessibilityLabel="Clear search and filters"
                onPress={handleClearAll}
                style={styles.clearAllButton}
              >
                <Text style={styles.clearAllText}>Clear search</Text>
              </PressableFeedback>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* Sort Menu Modal */}
      <Modal
        animationType="fade"
        onRequestClose={() => setSortModalVisible(false)}
        transparent
        visible={sortModalVisible}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setSortModalVisible(false)}
        >
          <Pressable
            style={styles.modalSheet}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.modalSheetHeader}>
              <Text style={styles.modalSheetTitle}>Sort by</Text>
              <PressableFeedback
                accessibilityLabel="Close sort menu"
                onPress={() => setSortModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Text style={styles.modalCloseText}>×</Text>
              </PressableFeedback>
            </View>

            {SORT_OPTIONS.map((option) => {
              const active = sort === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => handleSelectSort(option.id)}
                  style={[styles.sortOptionRow, active && styles.sortOptionRowActive]}
                >
                  <Text style={[styles.sortOptionText, active && styles.sortOptionTextActive]}>
                    {option.label}
                  </Text>
                  {active && <Text style={styles.sortOptionCheck}>✓</Text>}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 130,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backButton: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
    backgroundColor: "#F1F1F3",
  },
  searchBar: {
    flex: 1,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 16,
    paddingRight: 12,
    borderRadius: 25,
    backgroundColor: "#F1F1F3",
  },
  searchInput: {
    flex: 1,
    height: "100%",
    paddingVertical: 4,
    color: "#111116",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 16,
  },
  clearButton: {
    width: 24,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  clearText: {
    color: "#777780",
    fontFamily: "Manrope_500Medium",
    fontSize: 22,
  },
  filterButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.95,
  },
  chipsContainer: {
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  chip: {
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    borderRadius: 18,
  },
  chipSelected: {
    backgroundColor: "#BFA7FF",
  },
  chipUnselected: {
    backgroundColor: "#F1F1F3",
  },
  chipText: {
    fontSize: 13,
  },
  chipTextSelected: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
  },
  chipTextUnselected: {
    color: "#111116",
    fontFamily: "Manrope_600SemiBold",
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 12,
  },
  resultsCount: {
    color: "#111116",
    fontFamily: "Manrope_700Bold",
    fontSize: 17,
    letterSpacing: -0.4,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingVertical: 4,
  },
  sortLabel: {
    color: "#111116",
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
  },
  sortValue: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 13,
  },
  listContainer: {
    gap: 16,
    paddingTop: 4,
  },
  cardContainer: {
    flexDirection: "row",
    gap: 14,
    marginHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    minHeight: 152,
  },
  cardPhoto: {
    width: 148,
    height: 152,
    borderRadius: 16,
    backgroundColor: "#E8E7EB",
  },
  cardDetails: {
    flex: 1,
    paddingVertical: 2,
    paddingRight: 4,
    justifyContent: "space-between",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },
  cardTitle: {
    flex: 1,
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 16,
    lineHeight: 19.5,
    letterSpacing: -0.4,
  },
  heartButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "#F2F2F4",
    marginTop: -2,
  },
  heartButtonActive: {
    backgroundColor: "#FFF0F0",
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    flex: 1,
    color: "#85858E",
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  ratingScore: {
    color: "#111116",
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
  },
  ratingCount: {
    color: "#85858E",
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 14,
    backgroundColor: "#F2F2F4",
  },
  tagText: {
    color: "#29292E",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 10.5,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginTop: 4,
  },
  priceAmount: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 17,
  },
  priceSuffix: {
    color: "#85858E",
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
  },
  skeletonPhoto: {
    width: 148,
    height: 152,
    borderRadius: 16,
    backgroundColor: "#F1F1F3",
  },
  skeletonLine: {
    borderRadius: 6,
    backgroundColor: "#F1F1F3",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
    marginHorizontal: 16,
    borderRadius: 22,
    backgroundColor: "#F6F5F8",
    marginTop: 8,
  },
  emptyTitle: {
    marginTop: 12,
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 18,
  },
  emptyCopy: {
    marginTop: 6,
    color: "#85858E",
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    textAlign: "center",
  },
  clearAllButton: {
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#BFA7FF",
  },
  clearAllText: {
    color: "#111116",
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#111116",
  },
  retryText: {
    color: "#FFFFFF",
    fontFamily: "Manrope_700Bold",
    fontSize: 13,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(17, 17, 22, 0.35)",
  },
  modalSheet: {
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#FFFFFF",
  },
  modalSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalSheetTitle: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 20,
  },
  modalCloseButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "#F1F1F3",
  },
  modalCloseText: {
    color: "#111116",
    fontFamily: "Manrope_500Medium",
    fontSize: 22,
  },
  sortOptionRow: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EAEAEA",
  },
  sortOptionRowActive: {
    backgroundColor: "#FDFDFD",
  },
  sortOptionText: {
    color: "#111116",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 15,
  },
  sortOptionTextActive: {
    fontFamily: "Manrope_800ExtraBold",
    color: "#111116",
  },
  sortOptionCheck: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 16,
  },
});
