import crypto from 'crypto'

export interface StaySource {
  title: string
  type: string
  city: string
  region?: string
  country: string
  neighborhood?: string
  maxGuests: number
  bedrooms: number
  beds: number
  bathrooms: number
  pricePerNight: number
  amenities?: string[]
  houseRules?: {petsAllowed?: boolean}
  facts: string[]
  vibes: string[]
}

export interface GeneratedCopy {
  summary: string
  description: string
  highlights: string[]
}

export function computeSourceHash(stay: StaySource): string {
  const content = JSON.stringify({
    title: stay.title,
    type: stay.type,
    city: stay.city,
    region: stay.region,
    country: stay.country,
    neighborhood: stay.neighborhood,
    maxGuests: stay.maxGuests,
    bedrooms: stay.bedrooms,
    beds: stay.beds,
    bathrooms: stay.bathrooms,
    pricePerNight: stay.pricePerNight,
    amenities: (stay.amenities || []).slice().sort(),
    petsAllowed: stay.houseRules?.petsAllowed ?? false,
    facts: (stay.facts || []).slice().sort(),
    vibes: (stay.vibes || []).slice().sort(),
  })
  return crypto.createHash('sha256').update(content).digest('hex')
}

export function runCodeChecks(stay: StaySource, copy: GeneratedCopy): string[] {
  const violations: string[] = []
  const allCopyText = `${copy.summary} ${copy.description} ${copy.highlights.join(' ')}`
  const lowerCopy = allCopyText.toLowerCase()

  // 1. Length checks
  if (!copy.summary || copy.summary.length > 140) {
    violations.push(`Summary length (${copy.summary?.length || 0}) exceeds 140 characters`)
  }
  if (!copy.description || copy.description.length < 40 || copy.description.length > 1200) {
    violations.push(`Description length (${copy.description?.length || 0}) is not between 40 and 1200 characters`)
  }
  if (!copy.highlights || copy.highlights.length > 4) {
    violations.push(`Highlights count (${copy.highlights?.length || 0}) exceeds maximum of 4`)
  }

  // 2. Pets check
  const petsAllowed = stay.houseRules?.petsAllowed ?? false
  const petWords = ['pet', 'pets', 'dog', 'dogs', 'cat', 'cats', 'furry']
  const mentionsPets = petWords.some((word) => new RegExp(`\\b${word}\\b`, 'i').test(allCopyText))
  if (mentionsPets && !petsAllowed) {
    violations.push('Mentions pets or dogs when pets are not allowed')
  }

  // 3. Amenity and view words check
  const amenityChecks: {word: string; key: string; keywords: string[]}[] = [
    {word: 'hot tub', key: 'hotTub', keywords: ['hot tub', 'jacuzzi']},
    {word: 'pool', key: 'pool', keywords: ['pool', 'swimming pool']},
    {word: 'sauna', key: 'sauna', keywords: ['sauna']},
    {word: 'fireplace', key: 'fireplace', keywords: ['fireplace', 'wood-burning stove', 'wood stove']},
    {word: 'fire pit', key: 'firePit', keywords: ['fire pit', 'firepit']},
    {word: 'ocean view', key: 'oceanView', keywords: ['ocean view', 'ocean-view', 'view of the ocean', 'facing the ocean']},
    {word: 'lake view', key: 'lakeView', keywords: ['lake view', 'lake-view', 'view of the lake']},
    {word: 'mountain view', key: 'mountainView', keywords: ['mountain view', 'mountain-view', 'mountain views']},
    {word: 'beach access', key: 'beachAccess', keywords: ['beach access', 'steps from the beach', 'direct beach']},
    {word: 'bbq', key: 'bbq', keywords: ['bbq', 'barbecue', 'grill']},
    {word: 'ev charger', key: 'evCharger', keywords: ['ev charger', 'electric vehicle']},
  ]

  const stayAmenities = stay.amenities || []
  const factsText = (stay.facts || []).join(' ').toLowerCase()

  for (const check of amenityChecks) {
    const hasAmenity = stayAmenities.includes(check.key) || check.keywords.some((kw) => factsText.includes(kw))
    if (!hasAmenity) {
      for (const kw of check.keywords) {
        if (new RegExp(`\\b${kw}\\b`, 'i').test(allCopyText)) {
          violations.push(`Mentions "${kw}" but amenity/fact is not present for this stay`)
          break
        }
      }
    }
  }

  // 4. Number check: any digits in copy should appear in the stay facts or fields
  const copyNumbers = allCopyText.match(/\b\d+\b/g) || []
  const allowedNumbers = new Set<string>([
    String(stay.maxGuests),
    String(stay.bedrooms),
    String(stay.beds),
    String(Math.floor(stay.bathrooms)),
    String(stay.pricePerNight),
  ])
  for (const fact of stay.facts) {
    const fn = fact.match(/\b\d+\b/g) || []
    fn.forEach((n) => allowedNumbers.add(n))
  }

  for (const num of copyNumbers) {
    if (!allowedNumbers.has(num)) {
      violations.push(`Number "${num}" in copy does not match any allowed stay numbers (${Array.from(allowedNumbers).join(', ')})`)
    }
  }

  return violations
}

