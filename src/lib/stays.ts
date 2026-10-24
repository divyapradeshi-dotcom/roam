export type PropertyType = "cabin" | "beach" | "city" | "villa";

export type Amenity =
  | "hotTub"
  | "pool"
  | "fireplace"
  | "firePit"
  | "sauna"
  | "wifi"
  | "kitchen"
  | "workspace"
  | "parking"
  | "washer"
  | "ac"
  | "oceanView"
  | "lakeView"
  | "beachAccess"
  | "mountainView"
  | "bbq"
  | "evCharger"
  | "bikes"
  | "heating";

export interface StayCardData {
  id: string;
  slug: string;
  title: string;
  type?: PropertyType;
  city: string;
  region?: string;
  country: string;
  location: string;
  rating: string;
  price: number;
  imageUrl: string;
}

export interface StayPhoto {
  url: string;
  alt?: string;
}

export interface StayHost {
  name: string;
  slug?: string;
  bio?: string;
  isSuperhost?: boolean;
  hostingSince?: string;
  responseTime?: string;
  languages?: string[];
  photoUrl?: string;
}

export interface HouseRules {
  checkInTime?: string;
  checkOutTime?: string;
  quietHoursFrom?: string;
  quietHoursTo?: string;
  petsAllowed?: boolean;
  maxPets?: number;
  petFee?: number;
  smokingAllowed?: boolean;
  partiesAllowed?: boolean;
  additionalRules?: string[];
}

export interface PolicyItem {
  title: string;
  slug?: string;
  kind?: string;
  summary?: string;
  body?: string;
}

export interface StayDetails {
  id: string;
  title: string;
  slug: string;
  type: PropertyType;
  city: string;
  region?: string;
  country: string;
  neighborhood?: string;
  location: string;
  pricePerNight: number;
  cleaningFee?: number;
  minNights: number;
  rating: number;
  ratingText: string;
  reviewCount: number;
  amenities: Amenity[];
  quiet?: boolean;
  houseRules?: HouseRules;
  summary?: string;
  description?: string;
  highlights?: string[];
  vibes?: string[];
  facts?: string[];
  photos: StayPhoto[];
  host?: StayHost;
  cancellationPolicy?: PolicyItem;
  policies?: PolicyItem[];
}

export function formatPlaceLabel(city: string, region?: string, country?: string): string {
  if (region && region.trim()) {
    return `${city}, ${region.trim()}`;
  }
  if (country && country.trim()) {
    return `${city}, ${country.trim()}`;
  }
  return city;
}
