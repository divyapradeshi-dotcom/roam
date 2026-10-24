import type { Amenity, PropertyType } from "@/lib/stays";

export interface ParsedQuery {
  raw: string;
  type?: PropertyType;
  maxPrice?: number;
  guests?: number;
  petsAllowed?: boolean;
  quiet?: boolean;
  amenities: Amenity[];
  place?: string;
  placeAlt?: string;
  softWords: string[];
}

const US_STATES: Record<string, string> = {
  california: "ca",
  oregon: "or",
  washington: "wa",
  "new york": "ny",
  maine: "me",
  "north carolina": "nc",
  tennessee: "tn",
  colorado: "co",
  florida: "fl",
  texas: "tx",
  hawaii: "hi",
  arizona: "az",
  utah: "ut",
  nevada: "nv",
  massachusetts: "ma",
  vermont: "vt",
};

const KNOWN_PLACES = [
  "lake arrowhead",
  "big bear lake",
  "big bear",
  "monte rio",
  "malibu",
  "joshua tree",
  "palm springs",
  "san francisco",
  "santa cruz",
  "encinitas",
  "ojai",
  "la jolla",
  "sonoma",
  "palm desert",
  "healdsburg",
  "bend",
  "sisters",
  "brooklyn",
  "portland",
  "asheville",
  "gatlinburg",
  "mykonos",
  "santorini",
  "tokyo",
  "kyoto",
  "mexico city",
  "lisbon",
  "florence",
  "rome",
  "paris",
  "greece",
  "italy",
  "japan",
  "mexico",
  "portugal",
  "united states",
  "usa",
];

export const KNOWN_VIBES = [
  "quiet",
  "cozy",
  "secluded",
  "romantic",
  "peaceful",
  "luxury",
  "family",
  "lively",
  "walkable",
  "rustic",
  "modern",
  "views",
  "woodsy",
  "coastal",
  "sunny",
  "bright",
];

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "in",
  "near",
  "at",
  "for",
  "to",
  "on",
  "with",
  "and",
  "or",
  "of",
  "by",
  "night",
  "day",
  "per",
  "stay",
  "stays",
  "house",
  "home",
  "place",
  "getaway",
  "retreat",
  "spot",
  "rental",
  "rentals",
  "room",
  "rooms",
]);

export function parseSearchQuery(queryText: string): ParsedQuery {
  const raw = queryText.trim();
  let working = raw.toLowerCase();

  let type: PropertyType | undefined;
  let maxPrice: number | undefined;
  let guests: number | undefined;
  let petsAllowed: boolean | undefined;
  let quiet: boolean | undefined;
  const amenities: Amenity[] = [];
  let place: string | undefined;
  let placeAlt: string | undefined;
  const extractedWords = new Set<string>();

  // 1. Price
  const priceMatch = working.match(/(?:under|below|less than|max(?:imum)?|<)\s*\$?(\d+)/i);
  if (priceMatch) {
    maxPrice = parseInt(priceMatch[1], 10);
    working = working.replace(priceMatch[0], " ");
  }

  // 2. Guests
  const guestMatch = working.match(/(?:for|sleeps|accommodates?)\s*(\d+)|(\d+)\s*(?:guests?|people|persons?)/i);
  if (guestMatch) {
    const num = guestMatch[1] || guestMatch[2];
    guests = parseInt(num, 10);
    working = working.replace(guestMatch[0], " ");
  }

  // 3. Pets
  if (/(?:pet[- ]friendly|pets? allowed|dogs? allowed|with (?:dog|pet)s?)/i.test(working)) {
    petsAllowed = true;
    working = working.replace(/(?:pet[- ]friendly|pets? allowed|dogs? allowed|with (?:dog|pet)s?)/gi, " ");
  }

  // 4. Quiet
  if (/\bquiet\b/i.test(working)) {
    quiet = true;
    // Keep it in soft words or vibe ranking too
    extractedWords.add("quiet");
    working = working.replace(/\bquiet\b/gi, " ");
  }

  // 5. Amenities
  const checkAmenity = (pattern: RegExp, amenity: Amenity) => {
    if (pattern.test(working)) {
      if (!amenities.includes(amenity)) amenities.push(amenity);
      working = working.replace(pattern, " ");
    }
  };

  checkAmenity(/\bhot[- ]?tub\b|\bjacuzzi\b/gi, "hotTub");
  checkAmenity(/\bprivate pool\b|\bpools?\b/gi, "pool");
  checkAmenity(/\bfireplace\b|\bwood stove\b/gi, "fireplace");
  checkAmenity(/\bfire[- ]?pit\b/gi, "firePit");
  checkAmenity(/\bsauna\b/gi, "sauna");
  checkAmenity(/\bwi[- ]?fi\b|\binternet\b/gi, "wifi");
  checkAmenity(/\bkitchen\b/gi, "kitchen");
  checkAmenity(/\bworkspace\b|\bdesk\b/gi, "workspace");
  checkAmenity(/\bocean[- ]?views?\b|\bsea[- ]?views?\b/gi, "oceanView");
  checkAmenity(/\blake[- ]?views?\b/gi, "lakeView");
  checkAmenity(/\bmountain[- ]?views?\b/gi, "mountainView");
  checkAmenity(/\bbeach[- ]?access\b|\bbeachfront\b|\bcoast(?:al)?\b/gi, "beachAccess");
  checkAmenity(/\bbarbecue\b|\bbbq\b|\bgrill\b/gi, "bbq");
  checkAmenity(/\bev[- ]?charger\b/gi, "evCharger");
  checkAmenity(/\ba[\/.]?c\b|\bair conditioning\b/gi, "ac");

  // 6. Type
  if (/\bcabins?\b/i.test(working)) {
    type = "cabin";
    working = working.replace(/\bcabins?\b/gi, " ");
  } else if (/\bbeach(?:es)?\b|\bocean\b/i.test(working)) {
    type = "beach";
    working = working.replace(/\bbeach(?:es)?\b|\bocean\b/gi, " ");
  } else if (/\bcity\b|\blofts?\b|\bapartments?\b/i.test(working)) {
    type = "city";
    working = working.replace(/\bcity\b|\blofts?\b|\bapartments?\b/gi, " ");
  } else if (/\bvillas?\b/i.test(working)) {
    type = "villa";
    working = working.replace(/\bvillas?\b/gi, " ");
  }

  // 7. Place: "in/near <place>" or bare state / country / city
  for (const [stateName, stateCode] of Object.entries(US_STATES)) {
    const stateRegex = new RegExp(`(?:in|near)?\\s*\\b${stateName}\\b`, "i");
    if (stateRegex.test(working)) {
      place = stateCode;
      placeAlt = stateName;
      working = working.replace(stateRegex, " ");
      break;
    }
  }

  if (!place) {
    // Check 2-letter state codes after in/near (e.g. "in CA")
    const codeMatch = working.match(/(?:in|near)\s+([a-z]{2})\b/i);
    if (codeMatch) {
      place = codeMatch[1].toLowerCase();
      working = working.replace(codeMatch[0], " ");
    }
  }

  if (!place) {
    for (const known of KNOWN_PLACES) {
      const pRegex = new RegExp(`(?:in|near)?\\s*\\b${known}\\b`, "i");
      if (pRegex.test(working)) {
        place = known;
        working = working.replace(pRegex, " ");
        break;
      }
    }
  }

  // 8. Soft words / Vibes
  const tokens = working
    .split(/[^a-z0-9_-]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));

  for (const token of tokens) {
    extractedWords.add(token);
  }

  const softWords = Array.from(extractedWords);

  return {
    raw,
    type,
    maxPrice,
    guests,
    petsAllowed,
    quiet,
    amenities,
    place,
    placeAlt,
    softWords,
  };
}
