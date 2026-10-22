import { useLocalSearchParams, router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, useReducedMotion } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import type { Property, StayCategory } from "@/data/properties";
import { filterProperties } from "@/data/properties";
import { LineIcon, PressableFeedback } from "@/components/roam-ui";

type SearchFilter = "Cabins" | "Under $300" | "Pet Friendly" | "Quiet";

const filters: SearchFilter[] = ["Cabins", "Under $300", "Pet Friendly", "Quiet"];
const amenityIcons: Record<string, "hot-tub" | "paw" | "pool" | "mountain" | "fireplace" | "wifi"> = {
  "Hot Tub": "hot-tub",
  "Pet Friendly": "paw",
  Pool: "pool",
  "Mountain View": "mountain",
  "Ocean View": "mountain",
  Fireplace: "fireplace",
  "City View": "mountain",
  "Wi-Fi": "wifi",
};

function inferCategory(query: string): StayCategory | undefined {
  const lowerQuery = query.toLocaleLowerCase();
  if (lowerQuery.includes("cabin")) return "Cabins";
  if (lowerQuery.includes("beach") || lowerQuery.includes("ocean")) return "Beach";
  if (lowerQuery.includes("city") || lowerQuery.includes("loft")) return "City";
  if (lowerQuery.includes("villa")) return "Villas";
  return undefined;
}

function StayResult({
  property,
  saved,
  onToggleSaved,
}: {
  property: Property;
  saved: boolean;
  onToggleSaved: (id: string) => void;
}) {
  return (
    <View style={styles.resultCard}>
      <Image
        accessibilityLabel={`${property.title}, in ${property.location}`}
        resizeMode="cover"
        source={{ uri: property.image }}
        style={styles.resultImage}
      />
      <View style={styles.resultDetails}>
        <View style={styles.resultTitleRow}>
          <Text numberOfLines={2} style={styles.propertyTitle}>{property.title}</Text>
          <PressableFeedback
            accessibilityLabel={saved ? `Remove ${property.title} from saved stays` : `Save ${property.title}`}
            onPress={() => onToggleSaved(property.id)}
            style={[styles.favoriteButton, saved && styles.favoriteButtonActive]}
          >
            <LineIcon
              color={saved ? "#E45555" : "#111116"}
              name="heart"
              size={22}
              strokeWidth={2.1}
            />
          </PressableFeedback>
        </View>

        <View style={styles.locationRow}>
          <LineIcon name="pin" size={15} color="#92929C" strokeWidth={2.4} />
          <Text numberOfLines={1} style={styles.locationText}>{property.location}</Text>
        </View>

        <View style={styles.ratingRow}>
          <LineIcon name="star" size={17} color="#FFB000" />
          <Text style={styles.ratingText}>{property.rating}</Text>
          <Text style={styles.ratingCount}>({property.ratingCount})</Text>
        </View>

        <ScrollView
          horizontal
          contentContainerStyle={styles.amenityList}
          showsHorizontalScrollIndicator={false}
        >
          {property.amenities.slice(0, 2).map((amenity) => (
            <View key={amenity} style={styles.amenityChip}>
              <LineIcon
                name={amenityIcons[amenity] ?? "pool"}
                size={15}
                strokeWidth={2.1}
              />
              <Text style={styles.amenityText}>{amenity}</Text>
            </View>
          ))}
        </ScrollView>

        <Text style={styles.priceText}>
          ${property.price}<Text style={styles.priceSuffix}> / night</Text>
        </Text>
      </View>
    </View>
  );
}

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const initialQuery = typeof params.q === "string" ? params.q : "";

  return <SearchResults key={initialQuery} initialQuery={initialQuery} />;
}

function SearchResults({ initialQuery }: { initialQuery: string }) {
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState(initialQuery);
  const [selectedFilters, setSelectedFilters] = useState<SearchFilter[]>(() => {
    const category = inferCategory(initialQuery);
    const inferred: SearchFilter[] = category === "Cabins" ? ["Cabins"] : [];
    const normalized = initialQuery.toLocaleLowerCase();
    if (normalized.includes("pet friendly")) inferred.push("Pet Friendly");
    if (normalized.includes("quiet")) inferred.push("Quiet");
    if (normalized.includes("under $300") || normalized.includes("under 300")) inferred.push("Under $300");
    return inferred;
  });
  const [sortAscending, setSortAscending] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [filtersVisible, setFiltersVisible] = useState(false);

  const results = useMemo(() => {
    const category = selectedFilters.includes("Cabins")
      ? "Cabins"
      : inferCategory(query);
    const filtered = filterProperties(query, category);
    return filtered
      .filter((property) => {
        if (selectedFilters.includes("Under $300") && property.price >= 300) return false;
        if (selectedFilters.includes("Pet Friendly") && !property.petFriendly) return false;
        if (selectedFilters.includes("Quiet") && !property.quiet) return false;
        return true;
      })
      .sort((a, b) => (sortAscending ? a.price - b.price : 0));
  }, [query, selectedFilters, sortAscending]);

  function toggleFilter(filter: SearchFilter) {
    setSelectedFilters((current) =>
      current.includes(filter)
        ? current.filter((item) => item !== filter)
        : [...current, filter],
    );
  }

  function toggleSaved(id: string) {
    setSavedIds((current) =>
      current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id],
    );
  }

  function goBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/home");
    }
  }

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
      <Animated.View
        entering={reduceMotion ? FadeIn.duration(160) : FadeInDown.duration(220)}
        style={styles.screenEntrance}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.searchHeader}>
            <PressableFeedback
              accessibilityLabel="Go back"
              onPress={goBack}
              style={styles.backButton}
            >
              <LineIcon name="chevron" size={24} strokeWidth={2.5} />
            </PressableFeedback>

            <View style={styles.searchField}>
              <LineIcon name="search" size={22} color="#111116" strokeWidth={2.4} />
              <TextInput
                accessibilityLabel="Search stays"
                autoCapitalize="none"
                onChangeText={setQuery}
                onSubmitEditing={() => setQuery(query.trim())}
                placeholder="Where do you want to go?"
                placeholderTextColor="#777780"
                returnKeyType="search"
                style={styles.searchInput}
                value={query}
              />
              {query.length > 0 && (
                <PressableFeedback
                  accessibilityLabel="Clear search"
                  onPress={() => setQuery("")}
                  style={styles.clearButton}
                >
                  <Text style={styles.clearText}>×</Text>
                </PressableFeedback>
              )}
              <PressableFeedback
                accessibilityLabel="Search filters"
                onPress={() => setFiltersVisible(true)}
                style={styles.filterButton}
              >
                <LineIcon name="sliders" size={22} strokeWidth={2.2} />
              </PressableFeedback>
            </View>
          </View>

          <ScrollView
            horizontal
            contentContainerStyle={styles.filterList}
            showsHorizontalScrollIndicator={false}
          >
            {filters.map((filter) => {
              const active = selectedFilters.includes(filter);
              return (
                <PressableFeedback
                  key={filter}
                  accessibilityLabel={`${active ? "Remove" : "Apply"} ${filter} filter`}
                  onPress={() => toggleFilter(filter)}
                  style={[styles.filterChip, active && styles.activeFilterChip]}
                >
                  <Text style={[styles.filterText, active && styles.activeFilterText]}>
                    {filter}
                  </Text>
                </PressableFeedback>
              );
            })}
          </ScrollView>

          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>{results.length} stays</Text>
            <PressableFeedback
              accessibilityLabel={`Change sort order; currently ${sortAscending ? "lowest price" : "best match"}`}
              onPress={() => setSortAscending((current) => !current)}
              style={styles.sortButton}
            >
              <Text style={styles.sortLabel}>Sort by </Text>
              <Text style={styles.sortValue}>{sortAscending ? "Lowest price" : "Best match"}</Text>
              <LineIcon name="chevron-down" size={16} strokeWidth={2.4} />
            </PressableFeedback>
          </View>

          {results.length > 0 ? (
            <View style={styles.resultList}>
              {results.map((property, index) => (
                <Animated.View
                  key={property.id}
                  entering={reduceMotion ? FadeIn.duration(140) : FadeInDown.duration(180).delay(index * 35)}
                >
                  <StayResult
                    property={property}
                    saved={savedIds.includes(property.id)}
                    onToggleSaved={toggleSaved}
                  />
                </Animated.View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <LineIcon name="search" size={30} color="#92929A" />
              <Text style={styles.emptyTitle}>No stays found</Text>
              <Text style={styles.emptyCopy}>Try changing your search or removing a filter.</Text>
              <PressableFeedback
                accessibilityLabel="Clear search and filters"
                onPress={() => {
                  setQuery("");
                  setSelectedFilters([]);
                }}
                style={styles.clearAllButton}
              >
                <Text style={styles.clearAllText}>Clear all</Text>
              </PressableFeedback>
            </View>
          )}
        </ScrollView>
      </Animated.View>
      <Modal
        animationType="fade"
        onRequestClose={() => setFiltersVisible(false)}
        transparent
        visible={filtersVisible}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setFiltersVisible(false)}>
          <Pressable style={styles.filterSheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.sheetHeading}>
              <Text style={styles.sheetTitle}>Filters</Text>
              <PressableFeedback
                accessibilityLabel="Close filters"
                onPress={() => setFiltersVisible(false)}
                style={styles.sheetClose}
              >
                <Text style={styles.sheetCloseText}>×</Text>
              </PressableFeedback>
            </View>
            {filters.map((filter) => {
              const active = selectedFilters.includes(filter);
              return (
                <Pressable
                  key={filter}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: active }}
                  onPress={() => toggleFilter(filter)}
                  style={styles.sheetFilterRow}
                >
                  <Text style={styles.sheetFilterText}>{filter}</Text>
                  <View style={[styles.checkbox, active && styles.checkboxActive]}>
                    {active ? <Text style={styles.checkboxMark}>✓</Text> : null}
                  </View>
                </Pressable>
              );
            })}
            <View style={styles.sheetActions}>
              <PressableFeedback
                accessibilityLabel="Clear all filters"
                onPress={() => setSelectedFilters([])}
                style={styles.clearFiltersButton}
              >
                <Text style={styles.clearFiltersText}>Clear all</Text>
              </PressableFeedback>
              <PressableFeedback
                accessibilityLabel="Apply filters"
                onPress={() => setFiltersVisible(false)}
                style={styles.applyFiltersButton}
              >
                <Text style={styles.applyFiltersText}>Show {results.length} stays</Text>
              </PressableFeedback>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  screenEntrance: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 116 },
  searchHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  backButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#F1F1F3",
    transform: [{ rotate: "180deg" }],
  },
  searchField: {
    minWidth: 0,
    height: 48,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 14,
    paddingRight: 5,
    borderRadius: 28,
    backgroundColor: "#F1F1F3",
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    height: 46,
    paddingVertical: 5,
    color: "#111116",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
  },
  clearButton: {
    width: 28,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  clearText: { color: "#777780", fontFamily: "Manrope_500Medium", fontSize: 23 },
  filterButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  filterList: { gap: 8, paddingTop: 14, paddingBottom: 3 },
  filterChip: {
    minHeight: 39,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: "#F1F1F3",
  },
  activeFilterChip: { backgroundColor: "#B99AFF" },
  filterText: { color: "#17171B", fontFamily: "Manrope_600SemiBold", fontSize: 13 },
  activeFilterText: { fontFamily: "Manrope_800ExtraBold" },
  resultsHeader: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  resultsCount: {
    color: "#111116",
    fontFamily: "Manrope_700Bold",
    fontSize: 17,
    letterSpacing: -0.4,
  },
  sortButton: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: 4 },
  sortLabel: { color: "#111116", fontFamily: "Manrope_500Medium", fontSize: 12 },
  sortValue: { color: "#111116", fontFamily: "Manrope_800ExtraBold", fontSize: 12 },
  resultList: { gap: 12 },
  resultCard: {
    minHeight: 176,
    flexDirection: "row",
    gap: 12,
    padding: 0,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },
  resultImage: {
    width: "39%",
    minHeight: 176,
    alignSelf: "stretch",
    borderRadius: 17,
    backgroundColor: "#E8E7EB",
  },
  resultDetails: { minWidth: 0, flex: 1, justifyContent: "center", paddingVertical: 4 },
  resultTitleRow: { minHeight: 44, flexDirection: "row", alignItems: "flex-start", gap: 4 },
  propertyTitle: {
    flex: 1,
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 16,
    lineHeight: 19,
    letterSpacing: -0.5,
  },
  favoriteButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -2,
    borderRadius: 20,
    backgroundColor: "#F2F2F4",
  },
  favoriteButtonActive: { backgroundColor: "#FFF0F0" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 1 },
  locationText: {
    flex: 1,
    color: "#85858E",
    fontFamily: "Manrope_500Medium",
    fontSize: 12,
  },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  ratingText: { color: "#111116", fontFamily: "Manrope_600SemiBold", fontSize: 13 },
  ratingCount: { color: "#85858E", fontFamily: "Manrope_500Medium", fontSize: 12 },
  amenityList: { alignItems: "center", gap: 6, paddingTop: 7 },
  amenityChip: {
    minHeight: 27,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: "#F2F2F4",
  },
  amenityText: {
    color: "#29292E",
    fontFamily: "Manrope_500Medium",
    fontSize: 10,
  },
  priceText: {
    marginTop: 5,
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 17,
  },
  priceSuffix: { color: "#85858E", fontFamily: "Manrope_500Medium", fontSize: 12 },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 45,
    borderRadius: 22,
    backgroundColor: "#F6F5F8",
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
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#B99AFF",
  },
  clearAllText: { color: "#111116", fontFamily: "Manrope_700Bold", fontSize: 12 },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(17, 17, 22, 0.32)",
  },
  filterSheet: {
    paddingTop: 18,
    paddingHorizontal: 22,
    paddingBottom: 28,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: "#FFFFFF",
  },
  sheetHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sheetTitle: { color: "#111116", fontFamily: "Manrope_800ExtraBold", fontSize: 21 },
  sheetClose: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#F1F1F3",
  },
  sheetCloseText: { color: "#111116", fontFamily: "Manrope_500Medium", fontSize: 22 },
  sheetFilterRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E8E8EB",
  },
  sheetFilterText: { color: "#111116", fontFamily: "Manrope_600SemiBold", fontSize: 14 },
  checkbox: {
    width: 23,
    height: 23,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#A6A6AD",
    borderRadius: 7,
  },
  checkboxActive: { borderColor: "#A98BFF", backgroundColor: "#A98BFF" },
  checkboxMark: { color: "#111116", fontFamily: "Manrope_800ExtraBold", fontSize: 14 },
  sheetActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 20,
  },
  clearFiltersButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: "#F1F1F3",
  },
  clearFiltersText: { color: "#111116", fontFamily: "Manrope_700Bold", fontSize: 13 },
  applyFiltersButton: {
    minHeight: 48,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#FFB800",
  },
  applyFiltersText: { color: "#111116", fontFamily: "Manrope_800ExtraBold", fontSize: 13 },
});
