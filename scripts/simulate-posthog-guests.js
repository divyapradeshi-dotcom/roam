const crypto = require('crypto')

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY || 'sk_test_X7R0c3M2YAT3rvEB8TeTjcbCWLPzcUGDrZUEcKRyDK'
const POSTHOG_TOKEN = process.env.EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN || 'phc_z25VG7UKoBRdkQkrnwCkYtBgifV5HGHXqzTiiLYb89nR'
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function ensureClerkUser(email, firstName, lastName) {
  const listRes = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`, {
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  })
  if (listRes.ok) {
    const list = await listRes.json()
    if (list.length > 0) {
      return list[0].id
    }
  }

  const createRes = await fetch('https://api.clerk.com/v1/users', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email_address: [email],
      password: 'Password123!',
      first_name: firstName,
      last_name: lastName,
      skip_password_checks: true,
      skip_password_requirement: false,
    }),
  })

  if (!createRes.ok) {
    throw new Error(`Failed to create Clerk user ${email}: ${await createRes.text()}`)
  }

  const created = await createRes.json()
  return created.id
}

async function sendPostHogBatch(events) {
  const payload = {
    api_key: POSTHOG_TOKEN,
    batch: events,
  }

  const res = await fetch(`${POSTHOG_HOST}/batch/`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(`PostHog batch failed: ${res.status} ${await res.text()}`)
  }
}

class GuestSession {
  constructor(anonId) {
    this.anonId = anonId || crypto.randomUUID()
    this.distinctId = this.anonId
    this.events = []
    this.baseTime = Date.now() - 60000
    this.offset = 0
  }

  now() {
    this.offset += Math.floor(Math.random() * 2000) + 1500
    return new Date(this.baseTime + this.offset).toISOString()
  }

  track(event, properties = {}) {
    this.events.push({
      event,
      distinct_id: this.distinctId,
      properties: {
        $lib: 'posthog-react-native',
        $lib_version: '4.83.0',
        $os: 'Web',
        $app_name: 'roam-mobile',
        serviceName: 'roam-mobile',
        ...properties,
      },
      timestamp: this.now(),
    })
  }

  identify(userId, userProperties = {}) {
    this.distinctId = userId
    this.events.push({
      event: '$identify',
      distinct_id: userId,
      properties: {
        $lib: 'posthog-react-native',
        $lib_version: '4.83.0',
        $anon_distinct_id: this.anonId,
        $set: userProperties,
      },
      timestamp: this.now(),
    })
  }

  log(message, data = {}) {
    this.events.push({
      event: '$$log',
      distinct_id: this.distinctId,
      properties: {
        $lib: 'posthog-react-native',
        $lib_version: '4.83.0',
        level: 'info',
        message,
        serviceName: 'roam-mobile',
        ...data,
      },
      timestamp: this.now(),
    })
  }

  async flush() {
    await sendPostHogBatch(this.events)
  }
}

async function runGuestSimulations() {
  console.log('Initializing Clerk demo guest accounts...')

  const users = {
    demo1: {
      email: 'roam.demo1+clerk_test@example.com',
      firstName: 'Alex',
      lastName: 'Demo',
      id: await ensureClerkUser('roam.demo1+clerk_test@example.com', 'Alex', 'Demo'),
    },
    demo2: {
      email: 'roam.demo2+clerk_test@example.com',
      firstName: 'Sam',
      lastName: 'Demo',
      id: await ensureClerkUser('roam.demo2+clerk_test@example.com', 'Sam', 'Demo'),
    },
    demo3: {
      email: 'roam.demo3+clerk_test@example.com',
      firstName: 'Jordan',
      lastName: 'Demo',
      id: await ensureClerkUser('roam.demo3+clerk_test@example.com', 'Jordan', 'Demo'),
    },
    demo4: {
      email: 'roam.demo4+clerk_test@example.com',
      firstName: 'Casey',
      lastName: 'Demo',
      id: await ensureClerkUser('roam.demo4+clerk_test@example.com', 'Casey', 'Demo'),
    },
    demo5: {
      email: 'roam.demo5+clerk_test@example.com',
      firstName: 'Taylor',
      lastName: 'Demo',
      id: await ensureClerkUser('roam.demo5+clerk_test@example.com', 'Taylor', 'Demo'),
    },
    demo6: {
      email: 'roam.demo6+clerk_test@example.com',
      firstName: 'Riley',
      lastName: 'Demo',
      id: await ensureClerkUser('roam.demo6+clerk_test@example.com', 'Riley', 'Demo'),
    },
  }

  console.log('Clerk accounts verified. Starting PostHog guest sessions...\n')

  const sessions = [
    // 1. roam.demo1 (Sign Up)
    {
      name: 'User 1: roam.demo1 (Sign up)',
      execute: async () => {
        const u = users.demo1
        const s = new GuestSession()
        s.track('onboarding_completed')
        // Taps "Resend code" once
        s.log('verification code resent', {method: 'email_code', resend_count: 1})
        // Enters code 424242 -> sign up complete
        s.identify(u.id, {email: u.email, name: `${u.firstName} ${u.lastName}`})
        s.track('authentication_completed', {authentication_method: 'email_code', authentication_flow: 'signup'})
        s.log('authentication completed', {event: 'authentication_completed', authentication_method: 'email_code', authentication_flow: 'signup'})
        // Category chips
        for (const cat of ['Cabins', 'Beach', 'Villas', 'All Stays']) {
          s.track('stay_category_selected', {category: cat})
        }
        // Search 1: quiet pet friendly cabin with a hot tub
        s.track('stay_search_submitted', {has_query: true, source: 'home_search'})
        s.track('stay_search_submitted', {has_query: true, source: 'search_results'})
        s.log('stay search completed', {event: 'stay_search_completed', has_query: true, result_count: 3, source: 'search_results'})
        s.track('stay_filter_updated', {filter: 'Hot Tub', action: 'applied'})
        s.track('stay_filter_updated', {filter: 'Pet Friendly', action: 'applied'})
        s.track('stay_saved', {property_id: 'modern-cabin-hot-tub'})
        // Search 2: villa with pool for 6
        s.track('stay_search_submitted', {has_query: true, source: 'home_search'})
        s.track('stay_search_submitted', {has_query: true, source: 'search_results'})
        s.log('stay search completed', {event: 'stay_search_completed', has_query: true, result_count: 4, source: 'search_results'})
        s.track('stay_filter_updated', {filter: 'Pool', action: 'applied'})
        s.track('stay_saved', {property_id: 'oceanview-malibu-villa'})
        // Search 3: city loft under 150
        s.track('stay_search_submitted', {has_query: true, source: 'home_search'})
        s.track('stay_search_submitted', {has_query: true, source: 'search_results'})
        s.log('stay search completed', {event: 'stay_search_completed', has_query: true, result_count: 2, source: 'search_results'})
        s.track('stay_filter_updated', {filter: 'Under $300', action: 'applied'})
        s.track('stay_sort_changed', {sort_order: 'lowest_price'})
        // Sign out
        s.track('user_signed_out')
        await s.flush()
        return `${s.events.length} events sent (Sign-up, 4 category chips, 3 searches, 2 saves, sign-out)`
      },
    },

    // 2. roam.demo2 (Sign Up)
    {
      name: 'User 2: roam.demo2 (Sign up)',
      execute: async () => {
        const u = users.demo2
        const s = new GuestSession()
        s.track('onboarding_completed')
        s.log('verification code resent', {method: 'email_code', resend_count: 1})
        s.identify(u.id, {email: u.email, name: `${u.firstName} ${u.lastName}`})
        s.track('authentication_completed', {authentication_method: 'email_code', authentication_flow: 'signup'})
        s.log('authentication completed', {event: 'authentication_completed', authentication_method: 'email_code', authentication_flow: 'signup'})
        for (const cat of ['City', 'Beach', 'Cabins']) {
          s.track('stay_category_selected', {category: cat})
        }
        s.track('stay_search_submitted', {has_query: true, source: 'home_search'})
        s.track('stay_search_submitted', {has_query: true, source: 'search_results'})
        s.log('stay search completed', {event: 'stay_search_completed', has_query: true, result_count: 3, source: 'search_results'})
        s.track('stay_filter_updated', {filter: 'Hot Tub', action: 'applied'})
        s.track('stay_saved', {property_id: 'cedar-lookout-cabin'})
        s.track('stay_search_submitted', {has_query: true, source: 'home_search'})
        s.track('stay_search_submitted', {has_query: true, source: 'search_results'})
        s.log('stay search completed', {event: 'stay_search_completed', has_query: true, result_count: 4, source: 'search_results'})
        s.track('stay_filter_updated', {filter: 'Pool', action: 'applied'})
        s.track('stay_saved', {property_id: 'sonoma-vineyard-villa'})
        s.track('stay_search_submitted', {has_query: true, source: 'home_search'})
        s.track('stay_search_submitted', {has_query: true, source: 'search_results'})
        s.log('stay search completed', {event: 'stay_search_completed', has_query: true, result_count: 2, source: 'search_results'})
        s.track('stay_filter_updated', {filter: 'Under $300', action: 'applied'})
        s.track('stay_saved', {property_id: 'brooklyn-brownstone-loft'})
        s.track('user_signed_out')
        await s.flush()
        return `${s.events.length} events sent (Sign-up, 3 category chips, 3 searches, 3 saves, sign-out)`
      },
    },

    // 3. roam.demo3 (Sign Up)
    {
      name: 'User 3: roam.demo3 (Sign up)',
      execute: async () => {
        const u = users.demo3
        const s = new GuestSession()
        s.track('onboarding_completed')
        s.log('verification code resent', {method: 'email_code', resend_count: 1})
        s.identify(u.id, {email: u.email, name: `${u.firstName} ${u.lastName}`})
        s.track('authentication_completed', {authentication_method: 'email_code', authentication_flow: 'signup'})
        s.log('authentication completed', {event: 'authentication_completed', authentication_method: 'email_code', authentication_flow: 'signup'})
        for (const cat of ['Villas', 'City', 'All Stays']) {
          s.track('stay_category_selected', {category: cat})
        }
        s.track('stay_search_submitted', {has_query: true, source: 'home_search'})
        s.track('stay_search_submitted', {has_query: true, source: 'search_results'})
        s.log('stay search completed', {event: 'stay_search_completed', has_query: true, result_count: 3, source: 'search_results'})
        s.track('stay_filter_updated', {filter: 'Pet Friendly', action: 'applied'})
        s.track('stay_saved', {property_id: 'redwood-aframe'})
        s.track('stay_search_submitted', {has_query: true, source: 'home_search'})
        s.track('stay_search_submitted', {has_query: true, source: 'search_results'})
        s.log('stay search completed', {event: 'stay_search_completed', has_query: true, result_count: 4, source: 'search_results'})
        s.track('stay_filter_updated', {filter: 'Pool', action: 'applied'})
        s.track('stay_saved', {property_id: 'palm-house-villa'})
        s.track('stay_search_submitted', {has_query: true, source: 'home_search'})
        s.track('stay_search_submitted', {has_query: true, source: 'search_results'})
        s.log('stay search completed', {event: 'stay_search_completed', has_query: true, result_count: 2, source: 'search_results'})
        s.track('stay_sort_changed', {sort_order: 'lowest_price'})
        s.track('stay_saved', {property_id: 'mission-courtyard-home'})
        s.track('user_signed_out')
        await s.flush()
        return `${s.events.length} events sent (Sign-up, 3 category chips, 3 searches, 3 saves, sign-out)`
      },
    },

    // 4. Returning: roam.demo1
    {
      name: 'User 4: roam.demo1 (Sign in: password)',
      execute: async () => {
        const u = users.demo1
        const s = new GuestSession()
        s.identify(u.id, {email: u.email, name: `${u.firstName} ${u.lastName}`})
        s.track('authentication_completed', {authentication_method: 'password', authentication_flow: 'signin'})
        s.log('authentication completed', {event: 'authentication_completed', authentication_method: 'password', authentication_flow: 'signin'})
        s.track('stay_category_selected', {category: 'Beach'})
        s.track('stay_search_submitted', {has_query: true, source: 'home_search'})
        s.track('stay_search_submitted', {has_query: true, source: 'search_results'})
        s.log('stay search completed', {event: 'stay_search_completed', has_query: true, result_count: 5, source: 'search_results'})
        s.track('stay_filter_updated', {filter: 'Beach Access', action: 'applied'})
        s.track('stay_saved', {property_id: 'driftwood-cottage'})
        s.track('user_signed_out')
        await s.flush()
        return `${s.events.length} events sent (Password sign-in, Beach category, search, saved Driftwood Cottage, sign-out)`
      },
    },

    // 5. Returning: roam.demo2
    {
      name: 'User 5: roam.demo2 (Sign in: password)',
      execute: async () => {
        const u = users.demo2
        const s = new GuestSession()
        s.identify(u.id, {email: u.email, name: `${u.firstName} ${u.lastName}`})
        s.track('authentication_completed', {authentication_method: 'password', authentication_flow: 'signin'})
        s.log('authentication completed', {event: 'authentication_completed', authentication_method: 'password', authentication_flow: 'signin'})
        s.track('stay_category_selected', {category: 'Cabins'})
        s.track('stay_search_submitted', {has_query: true, source: 'home_search'})
        s.track('stay_search_submitted', {has_query: true, source: 'search_results'})
        s.log('stay search completed', {event: 'stay_search_completed', has_query: true, result_count: 4, source: 'search_results'})
        s.track('stay_filter_updated', {filter: 'Fireplace', action: 'applied'})
        s.track('stay_saved', {property_id: 'alpine-glass-cabin'})
        s.track('user_signed_out')
        await s.flush()
        return `${s.events.length} events sent (Password sign-in, Cabins category, search, saved Alpine Glass Cabin, sign-out)`
      },
    },

    // 6. Returning: roam.demo3
    {
      name: 'User 6: roam.demo3 (Sign in: password)',
      execute: async () => {
        const u = users.demo3
        const s = new GuestSession()
        s.identify(u.id, {email: u.email, name: `${u.firstName} ${u.lastName}`})
        s.track('authentication_completed', {authentication_method: 'password', authentication_flow: 'signin'})
        s.log('authentication completed', {event: 'authentication_completed', authentication_method: 'password', authentication_flow: 'signin'})
        s.track('stay_category_selected', {category: 'City'})
        s.track('stay_search_submitted', {has_query: true, source: 'home_search'})
        s.track('stay_search_submitted', {has_query: true, source: 'search_results'})
        s.log('stay search completed', {event: 'stay_search_completed', has_query: true, result_count: 3, source: 'search_results'})
        s.track('stay_filter_updated', {filter: 'Workspace', action: 'applied'})
        s.track('stay_saved', {property_id: 'soho-sunlit-apartment'})
        s.track('user_signed_out')
        await s.flush()
        return `${s.events.length} events sent (Password sign-in, City category, search, saved Soho Loft, sign-out)`
      },
    },

    // 7. Returning: roam.demo4
    {
      name: 'User 7: roam.demo4 (Sign in: password)',
      execute: async () => {
        const u = users.demo4
        const s = new GuestSession()
        s.identify(u.id, {email: u.email, name: `${u.firstName} ${u.lastName}`})
        s.track('authentication_completed', {authentication_method: 'password', authentication_flow: 'signin'})
        s.log('authentication completed', {event: 'authentication_completed', authentication_method: 'password', authentication_flow: 'signin'})
        s.track('stay_category_selected', {category: 'Villas'})
        s.track('stay_search_submitted', {has_query: true, source: 'home_search'})
        s.track('stay_search_submitted', {has_query: true, source: 'search_results'})
        s.log('stay search completed', {event: 'stay_search_completed', has_query: true, result_count: 6, source: 'search_results'})
        s.track('stay_filter_updated', {filter: 'Pool', action: 'applied'})
        s.track('stay_saved', {property_id: 'bali-garden-villa'})
        s.track('user_signed_out')
        await s.flush()
        return `${s.events.length} events sent (Password sign-in, Villas category, search, saved Bali Villa, sign-out)`
      },
    },

    // 8. Returning: roam.demo5
    {
      name: 'User 8: roam.demo5 (Sign in: password)',
      execute: async () => {
        const u = users.demo5
        const s = new GuestSession()
        s.identify(u.id, {email: u.email, name: `${u.firstName} ${u.lastName}`})
        s.track('authentication_completed', {authentication_method: 'password', authentication_flow: 'signin'})
        s.log('authentication completed', {event: 'authentication_completed', authentication_method: 'password', authentication_flow: 'signin'})
        s.track('stay_category_selected', {category: 'Beach'})
        s.track('stay_search_submitted', {has_query: true, source: 'home_search'})
        s.track('stay_search_submitted', {has_query: true, source: 'search_results'})
        s.log('stay search completed', {event: 'stay_search_completed', has_query: true, result_count: 4, source: 'search_results'})
        s.track('stay_filter_updated', {filter: 'Beach Access', action: 'applied'})
        s.track('stay_saved', {property_id: 'salt-air-surf-house'})
        s.track('user_signed_out')
        await s.flush()
        return `${s.events.length} events sent (Password sign-in, Beach category, search, saved Surf House, sign-out)`
      },
    },

    // 9. Returning: roam.demo1
    {
      name: 'User 9: roam.demo1 (Sign in: password)',
      execute: async () => {
        const u = users.demo1
        const s = new GuestSession()
        s.identify(u.id, {email: u.email, name: `${u.firstName} ${u.lastName}`})
        s.track('authentication_completed', {authentication_method: 'password', authentication_flow: 'signin'})
        s.log('authentication completed', {event: 'authentication_completed', authentication_method: 'password', authentication_flow: 'signin'})
        s.track('stay_category_selected', {category: 'All Stays'})
        s.track('stay_search_submitted', {has_query: true, source: 'home_search'})
        s.track('stay_search_submitted', {has_query: true, source: 'search_results'})
        s.log('stay search completed', {event: 'stay_search_completed', has_query: true, result_count: 5, source: 'search_results'})
        s.track('stay_filter_updated', {filter: 'Hot Tub', action: 'applied'})
        s.track('stay_saved', {property_id: 'sea-glass-bungalow'})
        s.track('user_signed_out')
        await s.flush()
        return `${s.events.length} events sent (Password sign-in, All Stays, search, saved Sea Glass Bungalow, sign-out)`
      },
    },

    // 10. Returning: roam.demo2
    {
      name: 'User 10: roam.demo2 (Sign in: password)',
      execute: async () => {
        const u = users.demo2
        const s = new GuestSession()
        s.identify(u.id, {email: u.email, name: `${u.firstName} ${u.lastName}`})
        s.track('authentication_completed', {authentication_method: 'password', authentication_flow: 'signin'})
        s.log('authentication completed', {event: 'authentication_completed', authentication_method: 'password', authentication_flow: 'signin'})
        s.track('stay_category_selected', {category: 'City'})
        s.track('stay_search_submitted', {has_query: true, source: 'home_search'})
        s.track('stay_search_submitted', {has_query: true, source: 'search_results'})
        s.log('stay search completed', {event: 'stay_search_completed', has_query: true, result_count: 3, source: 'search_results'})
        s.track('stay_filter_updated', {filter: 'Wi-Fi', action: 'applied'})
        s.track('stay_saved', {property_id: 'wicker-park-flat'})
        s.track('user_signed_out')
        await s.flush()
        return `${s.events.length} events sent (Password sign-in, City category, search, saved Wicker Park Flat, sign-out)`
      },
    },

    // 11. Returning: roam.demo6
    {
      name: 'User 11: roam.demo6 (Sign in: password)',
      execute: async () => {
        const u = users.demo6
        const s = new GuestSession()
        s.identify(u.id, {email: u.email, name: `${u.firstName} ${u.lastName}`})
        s.track('authentication_completed', {authentication_method: 'password', authentication_flow: 'signin'})
        s.log('authentication completed', {event: 'authentication_completed', authentication_method: 'password', authentication_flow: 'signin'})
        s.track('stay_category_selected', {category: 'Cabins'})
        s.track('stay_search_submitted', {has_query: true, source: 'home_search'})
        s.track('stay_search_submitted', {has_query: true, source: 'search_results'})
        s.log('stay search completed', {event: 'stay_search_completed', has_query: true, result_count: 4, source: 'search_results'})
        s.track('stay_filter_updated', {filter: 'Pet Friendly', action: 'applied'})
        s.track('stay_saved', {property_id: 'fernwood-river-cabin'})
        s.track('user_signed_out')
        await s.flush()
        return `${s.events.length} events sent (Password sign-in, Cabins category, search, saved River Cabin, sign-out)`
      },
    },

    // 12. Returning: roam.demo3
    {
      name: 'User 12: roam.demo3 (Sign in: password)',
      execute: async () => {
        const u = users.demo3
        const s = new GuestSession()
        s.identify(u.id, {email: u.email, name: `${u.firstName} ${u.lastName}`})
        s.track('authentication_completed', {authentication_method: 'password', authentication_flow: 'signin'})
        s.log('authentication completed', {event: 'authentication_completed', authentication_method: 'password', authentication_flow: 'signin'})
        s.track('stay_category_selected', {category: 'Villas'})
        s.track('stay_search_submitted', {has_query: true, source: 'home_search'})
        s.track('stay_search_submitted', {has_query: true, source: 'search_results'})
        s.log('stay search completed', {event: 'stay_search_completed', has_query: true, result_count: 5, source: 'search_results'})
        s.track('stay_filter_updated', {filter: 'Mountain View', action: 'applied'})
        s.track('stay_saved', {property_id: 'desert-modern-retreat'})
        s.track('user_signed_out')
        await s.flush()
        return `${s.events.length} events sent (Password sign-in, Villas category, search, saved Desert Retreat, sign-out)`
      },
    },

    // 13. Returning: roam.demo1
    {
      name: 'User 13: roam.demo1 (Sign in: password)',
      execute: async () => {
        const u = users.demo1
        const s = new GuestSession()
        s.identify(u.id, {email: u.email, name: `${u.firstName} ${u.lastName}`})
        s.track('authentication_completed', {authentication_method: 'password', authentication_flow: 'signin'})
        s.log('authentication completed', {event: 'authentication_completed', authentication_method: 'password', authentication_flow: 'signin'})
        for (const cat of ['Cabins', 'Villas', 'All Stays']) {
          s.track('stay_category_selected', {category: cat})
        }
        s.track('stay_search_submitted', {has_query: true, source: 'home_search'})
        s.track('stay_search_submitted', {has_query: true, source: 'search_results'})
        s.log('stay search completed', {event: 'stay_search_completed', has_query: true, result_count: 6, source: 'search_results'})
        s.track('stay_filter_updated', {filter: 'Pool', action: 'applied'})
        s.track('stay_saved', {property_id: 'sonoma-hillside-house'})
        s.track('user_signed_out')
        await s.flush()
        return `${s.events.length} events sent (Password sign-in, 3 category chips, search, saved Sonoma House, sign-out)`
      },
    },
  ]

  console.log(`Starting execution of ${sessions.length} sessions...\n`)

  for (let i = 0; i < sessions.length; i++) {
    const session = sessions[i]
    process.stdout.write(`[${i + 1}/${sessions.length}] Running ${session.name}... `)
    const summary = await session.execute()
    console.log(`Done. ${summary}`)

    if (i < sessions.length - 1) {
      console.log(`  Waiting 10s before next user session to allow event ingestion...`)
      await sleep(10000)
    }
  }

  console.log('\nAll 13 guest sessions completed and flushed to PostHog successfully!')
}

runGuestSimulations().catch(console.error)

