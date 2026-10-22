export type StayCategory = "Cabins" | "Beach" | "City" | "Villas";

export type Property = {
  id: string;
  title: string;
  location: string;
  category: StayCategory;
  rating: string;
  price: number;
  image: string;
  description: string;
  amenities: string[];
  ratingCount: number;
  petFriendly: boolean;
  quiet: boolean;
};

export const properties: Property[] = [
  {
    id: "modern-cabin",
    title: "Modern Cabin with Hot Tub",
    location: "Lake Arrowhead, CA",
    category: "Cabins",
    rating: "4.9",
    price: 289,
    image:
      "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1400&q=85",
    description:
      "A quiet, pet-friendly cedar cabin among the pines, with a private hot tub and fire pit.",
    amenities: ["Hot Tub", "Pet Friendly"],
    ratingCount: 342,
    petFriendly: true,
    quiet: true,
  },
  {
    id: "desert-retreat",
    title: "Desert Modern Retreat",
    location: "Joshua Tree, CA",
    category: "Villas",
    rating: "4.98",
    price: 315,
    image:
      "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85",
    description: "A sunlit designer home with a pool, mountain views, and wide-open skies.",
    amenities: ["Pool", "Mountain View"],
    ratingCount: 201,
    petFriendly: false,
    quiet: true,
  },
  {
    id: "ocean-house",
    title: "Oceanview Villa with Private Pool",
    location: "Malibu, CA",
    category: "Beach",
    rating: "4.96",
    price: 412,
    image:
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1400&q=85",
    description: "Wake up to the Pacific in this breezy home just steps from the sand.",
    amenities: ["Pool", "Ocean View"],
    ratingCount: 128,
    petFriendly: false,
    quiet: false,
  },
  {
    id: "brooklyn-loft",
    title: "Brooklyn Brownstone Loft",
    location: "Brooklyn, NY",
    category: "City",
    rating: "4.91",
    price: 189,
    image:
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85",
    description: "A bright, character-filled loft close to neighborhood cafés and the subway.",
    amenities: ["Wi-Fi", "City View"],
    ratingCount: 88,
    petFriendly: true,
    quiet: false,
  },
  {
    id: "lake-cabin",
    title: "A-Frame in the Redwoods",
    location: "Monte Rio, CA",
    category: "Cabins",
    rating: "4.94",
    price: 236,
    image:
      "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1400&q=85",
    description: "A quiet A-frame with a private dock, forest trails, and a wood-burning stove.",
    amenities: ["Fireplace", "Pet Friendly"],
    ratingCount: 96,
    petFriendly: true,
    quiet: true,
  },
  {
    id: "palm-villa",
    title: "Palm House Villa",
    location: "Palm Springs, CA",
    category: "Villas",
    rating: "4.93",
    price: 356,
    image:
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1400&q=85",
    description: "A relaxed mid-century stay with a private pool and mountain-view patio.",
    amenities: ["Pool", "Mountain View"],
    ratingCount: 164,
    petFriendly: false,
    quiet: true,
  },
];

export const stayCategories = ["All Stays", "Cabins", "Beach", "City", "Villas"] as const;
export type StayCategoryFilter = (typeof stayCategories)[number];

export function filterProperties(query: string, category?: StayCategoryFilter) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const searchTerms = normalizedQuery
    .replace(/[^a-z0-9]+/g, " ")
    .split(/\s+/)
    .filter((term) => term.length > 1 && !["and", "for", "the", "with", "near"].includes(term));

  return properties.filter((property) => {
    const matchesCategory =
      !category || category === "All Stays" || property.category === category;
    const searchableText = `${property.title} ${property.location} ${
      property.location.endsWith(", CA") ? "California" : ""
    } ${property.category} ${property.description} ${property.amenities.join(" ")}`
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, " ");
    const matchesQuery =
      !normalizedQuery ||
      searchableText.includes(normalizedQuery) ||
      (searchTerms.length > 0 &&
        searchTerms.every((term) => searchableText.includes(term)));
    return matchesCategory && matchesQuery;
  });
}
