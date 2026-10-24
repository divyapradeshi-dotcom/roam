import { useUser } from "@clerk/expo";
import { router } from "expo-router";
import { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, useReducedMotion } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { stayCategories, type StayCategoryFilter } from "@/data/properties";
import { useHomeStays } from "@/hooks/use-home-stays";
import { LineIcon, PressableFeedback, PropertyCard } from "@/components/roam-ui";
import { posthog } from "@/lib/posthog";

const categoryIcon = {
  "All Stays": "home",
  Cabins: "cabin",
  Beach: "beach",
  City: "city",
  Villas: "palm",
} as const;

export default function HomeScreen() {
  const { user } = useUser();
  const reduceMotion = useReducedMotion();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<StayCategoryFilter>("All Stays");
  const displayName = user?.firstName ?? "Joanna";

  const { stays, loading, error, retry } = useHomeStays(selectedCategory);
  const featured = stays[0];

  function openSearch(searchQuery = query, source = "home_search") {
    posthog?.capture("stay_search_submitted", {
      has_query: Boolean(searchQuery.trim()),
      source,
    });
    router.push({
      pathname: "/search",
      params: { q: searchQuery.trim() },
    });
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
          <View style={styles.topRow}>
            <Text style={styles.logo}>roam</Text>
            <Image
              accessibilityLabel={`${displayName}'s profile`}
              source={{
                uri: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&h=160&q=80",
              }}
              style={styles.avatar}
            />
          </View>

          <Text style={styles.greeting}>Hey, {displayName} 👋</Text>
          <View style={styles.titleRow}>
            <Text style={styles.heading}>Find your{"\n"}next stay</Text>
            <PressableFeedback
              accessibilityLabel="Open property search"
              onPress={() => openSearch("", "home_search_icon")}
              style={styles.searchIconButton}
            >
              <LineIcon name="search" size={27} />
            </PressableFeedback>
          </View>

          <View style={styles.searchBar}>
            <LineIcon name="sparkle" size={22} />
            <TextInput
              accessibilityLabel="Search stays"
              autoCapitalize="none"
              onChangeText={setQuery}
              onSubmitEditing={() => openSearch()}
              placeholder="quiet pet friendly cabin with hot tub"
              placeholderTextColor="#24222B"
              returnKeyType="search"
              style={styles.searchInput}
              value={query}
            />
            <PressableFeedback
              accessibilityLabel="See matching stays"
              onPress={() => openSearch()}
              style={styles.searchSubmit}
            >
              <LineIcon name="arrow" size={25} />
            </PressableFeedback>
          </View>

          <View style={styles.categories}>
            {stayCategories.map((category) => {
              const selected = category === selectedCategory;
              return (
                <PressableFeedback
                  key={category}
                  accessibilityLabel={`Show ${category}`}
                  onPress={() => {
                    if (category !== selectedCategory) {
                      posthog?.capture("stay_category_selected", { category });
                      setSelectedCategory(category);
                    }
                  }}
                  style={[styles.categoryChip, selected && styles.selectedChip]}
                >
                  <LineIcon
                    color="#111116"
                    name={categoryIcon[category]}
                    size={22}
                    strokeWidth={2.8}
                  />
                  <Text style={[styles.categoryText, selected && styles.selectedCategoryText]}>
                    {category}
                  </Text>
                </PressableFeedback>
              );
            })}
          </View>

          {loading && stays.length === 0 ? (
            <View style={styles.loadingContainer}>
              <View style={[styles.skeletonCard, { height: 370 }]} />
              <View style={[styles.skeletonCard, { height: 245, marginTop: 16 }]} />
              <View style={[styles.skeletonCard, { height: 245, marginTop: 14 }]} />
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
          ) : featured ? (
            <>
              <PressableFeedback
                accessibilityLabel={`Open details for ${featured.title}`}
                onPress={() => router.push({ pathname: "/stay/[slug]", params: { slug: featured.slug } } as any)}
              >
                <PropertyCard
                  image={featured.imageUrl}
                  location={featured.location}
                  title={featured.title}
                  rating={featured.rating}
                  price={featured.price}
                />
              </PressableFeedback>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>A little more to love</Text>
                <PressableFeedback
                  accessibilityLabel="See all stays"
                  onPress={() => openSearch("", "home_see_all")}
                  style={styles.seeAll}
                >
                  <Text style={styles.seeAllText}>See all</Text>
                  <LineIcon name="chevron" size={16} color="#777780" />
                </PressableFeedback>
              </View>
              {stays.slice(1, 4).map((stay) => (
                <PressableFeedback
                  key={stay.id}
                  accessibilityLabel={`Open details for ${stay.title}`}
                  onPress={() => router.push({ pathname: "/stay/[slug]", params: { slug: stay.slug } } as any)}
                  style={styles.secondaryCard}
                >
                  <PropertyCard
                    compact
                    image={stay.imageUrl}
                    location={stay.location}
                    title={stay.title}
                    rating={stay.rating}
                    price={stay.price}
                  />
                </PressableFeedback>
              ))}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No stays in this collection yet</Text>
              <Text style={styles.emptyCopy}>Try another category to find your next getaway.</Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  screenEntrance: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 112 },
  topRow: {
    height: 76,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 39,
    letterSpacing: -2.8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFE1A1",
  },
  greeting: {
    marginTop: 8,
    color: "#85858E",
    fontFamily: "Manrope_700Bold",
    fontSize: 17,
  },
  titleRow: {
    minHeight: 132,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heading: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 43,
    lineHeight: 45,
    letterSpacing: -2.3,
  },
  searchIconButton: {
    width: 72,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 34,
    backgroundColor: "#F3F3F5",
  },
  searchBar: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
    paddingLeft: 16,
    paddingRight: 8,
    borderRadius: 25,
    backgroundColor: "#BFA7FF",
  },
  searchInput: {
    flex: 1,
    minHeight: 54,
    paddingVertical: 8,
    color: "#17151D",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
  },
  searchSubmit: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
  },
  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
    marginBottom: 20,
  },
  categoryChip: {
    minHeight: 47,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 15,
    borderRadius: 24,
    backgroundColor: "#F2F2F3",
  },
  selectedChip: { backgroundColor: "#FFB800" },
  categoryText: {
    color: "#16161A",
    fontFamily: "Manrope_600SemiBold",
    fontSize: 14,
  },
  selectedCategoryText: { fontFamily: "Manrope_700Bold" },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 24,
    marginBottom: 13,
  },
  sectionTitle: {
    color: "#111116",
    fontFamily: "Manrope_800ExtraBold",
    fontSize: 19,
    letterSpacing: -0.6,
  },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { color: "#777780", fontFamily: "Manrope_600SemiBold", fontSize: 13 },
  secondaryCard: { marginBottom: 14 },
  loadingContainer: { marginTop: 4 },
  skeletonCard: {
    borderRadius: 24,
    backgroundColor: "#F3F3F5",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 54,
    borderRadius: 22,
    backgroundColor: "#F6F5F8",
  },
  emptyTitle: { color: "#111116", fontFamily: "Manrope_700Bold", fontSize: 17 },
  emptyCopy: {
    marginTop: 7,
    color: "#85858E",
    fontFamily: "Manrope_500Medium",
    fontSize: 13,
    textAlign: "center",
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
    fontSize: 14,
  },
});
