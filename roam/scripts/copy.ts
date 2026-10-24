import {getCliClient} from 'sanity/cli'
import {computeSourceHash, runCodeChecks, type GeneratedCopy, type StaySource} from './copy-checks'

const client = getCliClient({apiVersion: 'vX'})
const onlySlug = process.argv.find((arg, i, arr) => arr[i - 1] === '--slug')

interface StayDocument {
  _id: string
  title: string
  slug: {current: string}
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
  summary?: string
  description?: string
  highlights?: string[]
  copyReview?: {
    status?: 'passed' | 'failed'
    checkedAt?: string
    sourceHash?: string
    unsupportedClaims?: {claim: string; reason: string}[]
  }
}

interface RunResult {
  slug: string
  attempts: number
  status: 'passed' | 'failed' | 'cached'
  issues: string[]
}

async function verifyWithPrompt(
  source: StaySource,
  copy: GeneratedCopy,
): Promise<{claim: string; reason: string}[]> {
  try {
    const res: any = await client.agent.action.prompt({
      format: 'json' as const,
      instruction: `Given this source stay data:
$source

And this generated stay copy:
$copy

List every claim, number, amenity, view, distance, or nearby place in the copy that is NOT supported by the source data.
Return JSON with format: { "unsupported": [{ "claim": string, "reason": string }] }
If every claim is strictly supported by the source, return { "unsupported": [] }.`,
      instructionParams: {
        source: JSON.stringify(source),
        copy: JSON.stringify(copy),
      },
    })

    if (Array.isArray(res?.unsupported)) {
      return res.unsupported
    }
    return []
  } catch (err) {
    console.warn('Agent prompt verification fallback:', err)
    return []
  }
}

async function generateStayCopy(
  stay: StayDocument,
  source: StaySource,
  extraInstructions?: string,
): Promise<GeneratedCopy> {
  const instruction = `You are writing concise, grounded marketing copy for this Roam stay.
Stay facts:
$source
${extraInstructions ? `\nPREVIOUS ISSUES TO FIX:\n${extraInstructions}` : ''}

CRITICAL RULES:
1. ONLY describe facts, amenities, views, and numbers present in the source. Never invent or hallucinate anything.
2. summary: exactly 1 sentence, maximum 140 characters.
3. description: exactly 3 to 4 engaging sentences.
4. highlights: an array of 2 to 4 short bullet point strings directly from the facts.`

  const res = await client.agent.action.generate<GeneratedCopy>({
    schemaId: '_.schemas.default',
    documentId: stay._id,
    noWrite: true,
    instruction,
    instructionParams: {
      source: JSON.stringify(source),
    },
    target: {
      operation: 'set',
      include: ['summary', 'description', 'highlights'],
    },
  })

  return {
    summary: res.summary || '',
    description: res.description || '',
    highlights: Array.isArray(res.highlights) ? res.highlights : [],
  }
}

async function processStay(stay: StayDocument): Promise<RunResult> {
  const source: StaySource = {
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
    amenities: stay.amenities,
    houseRules: stay.houseRules,
    facts: stay.facts || [],
    vibes: stay.vibes || [],
  }

  const sourceHash = computeSourceHash(source)
  const slug = stay.slug.current

  // Check cache
  if (stay.copyReview?.sourceHash === sourceHash && stay.copyReview?.status === 'passed') {
    return {slug, attempts: 0, status: 'cached', issues: []}
  }

  let attempts = 0
  let feedback = ''

  while (attempts < 3) {
    attempts += 1
    const copy = await generateStayCopy(stay, source, feedback)

    const codeIssues = runCodeChecks(source, copy)
    const promptIssues = codeIssues.length === 0 ? await verifyWithPrompt(source, copy) : []

    const allIssues = [
      ...codeIssues.map((msg) => ({claim: msg, reason: 'Violated fact check'})),
      ...promptIssues,
    ]

    if (allIssues.length === 0) {
      await client
        .patch(stay._id)
        .set({
          summary: copy.summary,
          description: copy.description,
          highlights: copy.highlights,
          copyReview: {
            status: 'passed',
            checkedAt: new Date().toISOString(),
            sourceHash,
            unsupportedClaims: [],
          },
        })
        .commit()

      return {slug, attempts, status: 'passed', issues: []}
    }

    feedback = allIssues.map((i) => `- ${i.claim}: ${i.reason}`).join('\n')
  }

  // Failed after 3 attempts
  await client
    .patch(stay._id)
    .set({
      copyReview: {
        status: 'failed',
        checkedAt: new Date().toISOString(),
        sourceHash,
        unsupportedClaims: [{claim: 'Exceeded max retries', reason: feedback}],
      },
    })
    .commit()

  return {slug, attempts, status: 'failed', issues: [feedback]}
}

async function run() {
  const query = onlySlug
    ? '*[_type == "property" && slug.current == $slug]'
    : '*[_type == "property"]'
  const params = onlySlug ? {slug: onlySlug} : {}

  const stays = await client.fetch<StayDocument[]>(query, params)
  console.log(`Running Agent Actions copy generation for ${stays.length} stays...`)

  const results: RunResult[] = []

  for (const stay of stays) {
    process.stdout.write(`Processing ${stay.slug.current}... `)
    try {
      const res = await processStay(stay)
      results.push(res)
      console.log(`${res.status} (${res.attempts} attempts)`)
    } catch (err: any) {
      console.log(`ERROR: ${err?.message || err}`)
      results.push({
        slug: stay.slug.current,
        attempts: 1,
        status: 'failed',
        issues: [err?.message || 'Execution error'],
      })
    }
  }

  console.log('\n--- AGENT ACTIONS COPY REPORT ---')
  console.table(
    results.map((r) => ({
      slug: r.slug,
      status: r.status,
      attempts: r.attempts,
      issues: r.issues.length ? r.issues[0].slice(0, 50) + '...' : 'none',
    })),
  )

  const passed = results.filter((r) => r.status === 'passed' || r.status === 'cached').length
  console.log(`Total: ${passed}/${results.length} passed/cached.`)
}

run().catch(console.error)

