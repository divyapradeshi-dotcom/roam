import type { Amenity, PropertyType } from "@/lib/stays";
import { formatPlaceLabel } from "@/lib/stays";
import type { ParsedQuery } from "./parse";

export type SearchSortOption = "best_match" | "price_asc" | "price_desc" | "top_rated";

export interface SearchStayItem {
  id: string;
  slug: string;
  title: string;
  type: PropertyType;
  city: string;
  region?: string;
  country: string;
  neighborhood?: string;
  location: string;
  price: number;
  rating: number;
  ratingText: string;
  reviewCount: number;
  amenities: Amenity[];
  petsAllowed: boolean;
  quiet: boolean;
  vibes?: string[];
  imageUrl: string;
  imageAlt?: string;
}

export interface SearchQueryResult {
  total: number;
  stays: SearchStayItem[];
}

export interface SearchTag {
  id: string;
  label: string;
  icon:
    | "hot-tub"
    | "paw"
    | "pool"
    | "fireplace"
    | "mountain"
    | "waves"
    | "beach"
    | "sauna"
    | "wifi"
    | "city"
    | "cabin"
    | "sparkle";
}

export interface ChipItem {
  id: string;
  label: string;
  kind: "type" | "price" | "guests" | "pets" | "quiet" | "amenity" | "vibe";
  selected: boolean;
}

const AMENITY_TAG_META: Record<
  string,
  { label: string; icon: SearchTag["icon"] }
> = {
  hotTub: { label: "Hot Tub", icon: "hot-tub" },
  pool: { label: "Pool", icon: "pool" },
  fireplace: { label: "Fireplace", icon: "fireplace" },
  firePit: { label: "Fire Pit", icon: "fireplace" },
  sauna: { label: "Sauna", icon: "sauna" },
  oceanView: { label: "Ocean View", icon: "waves" },
  lakeView: { label: "Lake View", icon: "mountain" },
  mountainView: { label: "Mountain View", icon: "mountain" },
  beachAccess: { label: "Beach Access", icon: "beach" },
  wifi: { label: "Wi-Fi", icon: "wifi" },
  workspace: { label: "Workspace", icon: "city" },
  kitchen: { label: "Kitchen", icon: "cabin" },
  ac: { label: "A/C", icon: "sparkle" },
  bbq: { label: "Barbecue", icon: "fireplace" },
};

const STANDOUT_AMENITIES: Amenity[] = [
  "hotTub",
  "pool",
  "sauna",
  "fireplace",
  "oceanView",
  "lakeView",
  "mountainView",
  "beachAccess",
  "firePit",
];

const FALLBACK_AMENITIES: Amenity[] = [
  "workspace",
  "wifi",
  "kitchen",
  "ac",
  "bbq",
  "evCharger",
];

export function buildSearchQuery(
  parsed: ParsedQuery,
  sort: SearchSortOption = "best_match",
): { query: string; params: Record<string, unknown> } {
  const filters: string[] = ['_type == "property"', "defined(slug.current)"];
  const params: Record<string, unknown> = {};

  if (parsed.type) {
    filters.push("type == $type");
    params.type = parsed.type;
  }

  if (typeof parsed.maxPrice === "number") {
    filters.push("pricePerNight <= $maxPrice");
    params.maxPrice = parsed.maxPrice;
  }

  if (typeof parsed.guests === "number") {
    filters.push("maxGuests >= $guests");
    params.guests = parsed.guests;
  }

  if (parsed.petsAllowed) {
    filters.push("houseRules.petsAllowed == true");
  }

  if (parsed.quiet) {
    filters.push("quiet == true");
  }

  if (parsed.amenities.length > 0) {
    filters.push("count(amenities[@ in $amenities]) == count($amenities)");
    params.amenities = parsed.amenities;
  }

  if (parsed.place) {
    if (parsed.placeAlt) {
      filters.push(
        "($place in [lower(city), lower(region), lower(country), lower(neighborhood)] || $placeAlt in [lower(city), lower(region), lower(country), lower(neighborhood)])",
      );
      params.place = parsed.place.toLowerCase();
      params.placeAlt = parsed.placeAlt.toLowerCase();
    } else {
      filters.push(
        "$place in [lower(city), lower(region), lower(country), lower(neighborhood)]",
      );
      params.place = parsed.place.toLowerCase();
    }
  }

  const filterExpression = filters.join(" && ");

  // Ranking with soft words
  let scorePipe = "";
  if (sort === "best_match" && parsed.softWords.length > 0) {
    const boosts: string[] = [];
    parsed.softWords.slice(0, 4).forEach((word, index) => {
      const key = `t${index}`;
      params[key] = word.toLowerCase();
      boosts.push(`boost(vibes match $${key}, 3)`);
      boosts.push(
        `boost([title, summary, description, highlights, neighborhood] match $${key}, 1)`,
      );
    });
    scorePipe = `| score(${boosts.join(", ")})`;
  }

  let orderClause = "order(rating desc, reviewCount desc)";
  if (sort === "price_asc") {
    orderClause = "order(pricePerNight asc, rating desc)";
  } else if (sort === "price_desc") {
    orderClause = "order(pricePerNight desc, rating desc)";
  } else if (sort === "top_rated") {
    orderClause = "order(rating desc, reviewCount desc)";
  } else if (sort === "best_match" && scorePipe) {
    orderClause = "order(_score desc, rating desc, reviewCount desc)";
  }

  const query = `{
    "total": count(*[${filterExpression}]),
    "stays": *[${filterExpression}] ${scorePipe} | ${orderClause}[0...50]{
      "id": _id,
      "slug": slug.current,
      title,
      type,
      city,
      region,
      country,
      neighborhood,
      "price": pricePerNight,
      rating,
      reviewCount,
      amenities,
      "petsAllowed": coalesce(houseRules.petsAllowed, false),
      "quiet": coalesce(quiet, false),
      vibes,
      "imageUrl": coalesce(photos[0].url, "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1400&q=85"),
      "imageAlt": photos[0].alt
    }
  }`;

  return { query, params };
}

export function matchTags(stay: SearchStayItem, parsed?: ParsedQuery): SearchTag[] {
  const tags: SearchTag[] = [];
  const added = new Set<string>();

  // 1. Matched amenities from query
  if (parsed?.amenities) {
    for (const a of parsed.amenities) {
      if (stay.amenities?.includes(a) && !added.has(a)) {
        const meta = AMENITY_TAG_META[a];
        if (meta) {
          tags.push({ id: a, label: meta.label, icon: meta.icon });
          added.add(a);
        }
      }
      if (tags.length >= 2) return tags;
    }
  }

  // 2. Matched pets from query
  if (parsed?.petsAllowed && stay.petsAllowed && !added.has("pets")) {
    tags.push({ id: "pets", label: "Pet Friendly", icon: "paw" });
    added.add("pets");
    if (tags.length >= 2) return tags;
  }

  // 3. First standout amenity
  for (const a of STANDOUT_AMENITIES) {
    if (stay.amenities?.includes(a) && !added.has(a)) {
      const meta = AMENITY_TAG_META[a];
      if (meta) {
        tags.push({ id: a, label: meta.label, icon: meta.icon });
        added.add(a);
      }
      break;
    }
  }
  if (tags.length >= 2) return tags;

  // 4. Pet Friendly if allowed
  if (stay.petsAllowed && !added.has("pets")) {
    tags.push({ id: "pets", label: "Pet Friendly", icon: "paw" });
    added.add("pets");
    if (tags.length >= 2) return tags;
  }

  // 5. Next standout amenity
  for (const a of STANDOUT_AMENITIES) {
    if (stay.amenities?.includes(a) && !added.has(a)) {
      const meta = AMENITY_TAG_META[a];
      if (meta) {
        tags.push({ id: a, label: meta.label, icon: meta.icon });
        added.add(a);
      }
      if (tags.length >= 2) return tags;
    }
  }

  // 6. Fallback amenities
  for (const a of FALLBACK_AMENITIES) {
    if (stay.amenities?.includes(a) && !added.has(a)) {
      const meta = AMENITY_TAG_META[a];
      if (meta) {
        tags.push({ id: a, label: meta.label, icon: meta.icon });
        added.add(a);
      }
      if (tags.length >= 2) return tags;
    }
  }

  return tags;
}

export function formatStayResult(raw: {
  id: string;
  slug: string;
  title: string;
  type: PropertyType;
  city: string;
  region?: string;
  country: string;
  neighborhood?: string;
  price: number;
  rating?: number;
  reviewCount?: number;
  amenities?: Amenity[];
  petsAllowed?: boolean;
  quiet?: boolean;
  vibes?: string[];
  imageUrl?: string;
  imageAlt?: string;
}): SearchStayItem {
  const ratingNum = typeof raw.rating === "number" ? raw.rating : 4.8;
  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    type: raw.type,
    city: raw.city,
    region: raw.region,
    country: raw.country,
    neighborhood: raw.neighborhood,
    location: formatPlaceLabel(raw.city, raw.region, raw.country),
    price: raw.price,
    rating: ratingNum,
    ratingText: ratingNum.toFixed(1),
    reviewCount: typeof raw.reviewCount === "number" ? raw.reviewCount : 124,
    amenities: raw.amenities ?? [],
    petsAllowed: Boolean(raw.petsAllowed),
    quiet: Boolean(raw.quiet),
    vibes: raw.vibes ?? [],
    imageUrl:
      raw.imageUrl ||
      "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1400&q=85",
    imageAlt: raw.imageAlt,
  };
}

