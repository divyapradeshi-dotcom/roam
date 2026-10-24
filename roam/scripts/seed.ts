import {getCliClient} from 'sanity/cli'
import {hosts} from '../seed/hosts'
import {policies} from '../seed/policies'
import {generalPolicySlugs, stays, stayPhotos} from '../seed/stays'

const client = getCliClient({apiVersion: '2026-10-08'})
const dryRun = process.argv.includes('--dry-run')

type ExistingDocument = {_id: string; slug?: {current?: string}; seedKey?: string}

const results = {
  created: 0,
  updated: 0,
  unchanged: 0,
}

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, normalize(item)]),
    )
  }
  return value
}

function hasChanges(existing: Record<string, unknown>, fields: Record<string, unknown>) {
  return Object.entries(fields).some(
    ([key, value]) => JSON.stringify(normalize(existing[key])) !== JSON.stringify(normalize(value)),
  )
}

async function upsertBySlug(
  type: string,
  slug: string,
  fields: Record<string, unknown>,
  documents: ExistingDocument[],
) {
  const existing = documents.find((document) => document.slug?.current === slug) as
    | (ExistingDocument & Record<string, unknown>)
    | undefined

  if (!existing) {
    results.created += 1
    console.log(`${dryRun ? 'Would create' : 'Creating'} ${type}: ${slug}`)
    if (dryRun) return {_id: `dry-run-${type}-${slug}`}
    const created = await client.create({_type: type, ...fields})
    return {_id: created._id}
  }

  if (!hasChanges(existing, fields)) {
    results.unchanged += 1
    return {_id: existing._id}
  }

  results.updated += 1
  console.log(`${dryRun ? 'Would update' : 'Updating'} ${type}: ${slug}`)
  if (!dryRun) await client.patch(existing._id).set(fields).commit()
  return {_id: existing._id}
}

async function upsertBySeedKey(
  seedKey: string,
  fields: Record<string, unknown>,
  documents: ExistingDocument[],
) {
  const existing = documents.find((document) => document.seedKey === seedKey) as
    | (ExistingDocument & Record<string, unknown>)
    | undefined

  if (!existing) {
    results.created += 1
    if (!dryRun) await client.create({_type: 'review', ...fields})
    return
  }

  if (!hasChanges(existing, fields)) {
    results.unchanged += 1
    return
  }

  results.updated += 1
  if (!dryRun) await client.patch(existing._id).set(fields).commit()
}

async function seed() {
  const [existingPolicies, existingHosts, existingStays, existingReviews] = await Promise.all([
    client.fetch<ExistingDocument[]>('*[_type == "policy"]'),
    client.fetch<ExistingDocument[]>('*[_type == "host"]'),
    client.fetch<ExistingDocument[]>('*[_type == "property"]'),
    client.fetch<ExistingDocument[]>('*[_type == "review"]'),
  ])

  const policyIds = new Map<string, string>()
  for (const item of policies) {
    const result = await upsertBySlug(
      'policy',
      item.slug,
      {
        title: item.title,
        slug: {_type: 'slug', current: item.slug},
        kind: item.kind,
        summary: item.summary,
        body: item.body,
      },
      existingPolicies,
    )
    policyIds.set(item.slug, result._id)
  }

  const hostIds = new Map<string, string>()
  for (const item of hosts) {
    const result = await upsertBySlug(
      'host',
      item.slug,
      {
        name: item.name,
        slug: {_type: 'slug', current: item.slug},
        bio: item.bio,
        isSuperhost: item.isSuperhost,
        hostingSince: item.hostingSince,
        responseTime: item.responseTime,
        languages: item.languages,
      },
      existingHosts,
    )
    hostIds.set(item.slug, result._id)
  }

  const stayIds = new Map<string, {id: string; stay: (typeof stays)[number]}>()
  for (const [index, stay] of stays.entries()) {
    const hostId = hostIds.get(stay.hostSlug)
    const cancellationId = policyIds.get(stay.cancellationSlug)
    const sharedPolicyIds = generalPolicySlugs.map((slug) => policyIds.get(slug))

    if (!hostId || !cancellationId || sharedPolicyIds.some((id) => !id)) {
      throw new Error(`Missing seeded host or policy reference for stay "${stay.slug}"`)
    }

    const averageRating = Math.round(((5 + 5 + 4) / 3) * 10) / 10
    const fields = {
      title: stay.title,
      slug: {_type: 'slug', current: stay.slug},
      type: stay.type,
      city: stay.city,
      region: stay.region || undefined,
      country: stay.country,
      neighborhood: stay.neighborhood,
      location: {_type: 'geopoint', ...stay.coordinates},
      maxGuests: stay.maxGuests,
      bedrooms: stay.bedrooms,
      beds: stay.beds,
      bathrooms: stay.bathrooms,
      pricePerNight: stay.pricePerNight,
      cleaningFee: Math.round(35 + stay.pricePerNight * 0.08),
      weeklyDiscountPercent: index % 3 === 0 ? 10 : index % 3 === 1 ? 5 : 0,
      minNights: index % 5 === 0 ? 3 : 2,
      amenities: stay.amenities,
      quiet: stay.quiet,
      houseRules: {
        checkInTime: '15:00',
        checkOutTime: '11:00',
        quietHoursFrom: '22:00',
        quietHoursTo: '08:00',
        petsAllowed: stay.petsAllowed,
        maxPets: stay.petsAllowed ? 2 : 0,
        petFee: stay.petsAllowed ? 25 : 0,
        smokingAllowed: false,
        partiesAllowed: false,
        additionalRules: ['No smoking indoors', 'Please respect quiet hours'],
      },
      summary: stay.summary,
      description: stay.description,
      facts: stay.facts,
      vibes: stay.vibes,
      highlights: stay.facts.slice(0, 4),
      photos: stayPhotos(index, stay.title),
      host: {_type: 'reference', _ref: hostId},
      cancellationPolicy: {_type: 'reference', _ref: cancellationId},
      policies: sharedPolicyIds.map((id, policyIndex) => ({
        _key: `shared-${policyIndex}`,
        _type: 'reference',
        _ref: id,
      })),
      rating: averageRating,
      reviewCount: 3,
    }

    const result = await upsertBySlug('property', stay.slug, fields, existingStays)
    stayIds.set(stay.slug, {id: result._id, stay})
  }

  const reviewRows = [
    {key: 'first', name: 'Amelia', rating: 5, date: '2026-06-01'},
    {key: 'second', name: 'Marcus', rating: 5, date: '2026-04-01'},
    {key: 'third', name: 'Priya', rating: 4, date: '2026-02-01'},
  ]

  for (const [slug, {id, stay}] of stayIds) {
    for (const row of reviewRows) {
      const seedKey = `${slug}:${row.key}`
      const detail = stay.facts[row.key === 'first' ? 0 : 1] ?? stay.facts[0]
      const text =
        row.key === 'first'
          ? `We especially enjoyed ${detail.toLowerCase()}. The home was comfortable, and the listing matched what we found when we arrived.`
          : row.key === 'second'
            ? `${stay.neighborhood} was a lovely base for our trip. ${detail} made the stay feel thoughtful and easy.`
            : `A pleasant stay in ${stay.city}. We appreciated ${detail.toLowerCase()} and the clear arrival information.`

      await upsertBySeedKey(
        seedKey,
        {
          property: {_type: 'reference', _ref: id},
          guestName: row.name,
          rating: row.rating,
          stayedAt: row.date,
          text,
          seedKey,
        },
        existingReviews,
      )
    }
  }

  console.log(
    `Seed ${dryRun ? 'plan' : 'complete'}: ${stays.length} stays, ${hosts.length} shared hosts, ` +
      `${policies.length} shared policies, ${stays.length * 3} reviews. ` +
      `${results.created} created; ${results.updated} updated; ${results.unchanged} unchanged.`,
  )
  if (dryRun) console.log('Dry run: no writes were made.')
}

seed().catch((error: unknown) => {
  console.error('Roam seed failed:', error)
  process.exitCode = 1
})
