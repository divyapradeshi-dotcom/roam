const crypto = require('crypto');

const POSTHOG_TOKEN = process.env.EXPO_PUBLIC_POSTHOG_PROJECT_TOKEN || 'phc_z25VG7UKoBRdkQkrnwCkYtBgifV5HGHXqzTiiLYb89nR';
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

async function sendPostHogBatch(events) {
  const payload = {
    api_key: POSTHOG_TOKEN,
    batch: events,
  };

  const res = await fetch(`${POSTHOG_HOST}/batch/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PostHog batch failed: ${res.status} ${text}`);
  }
  return res.json();
}

class GuestSimulator {
  constructor(guestName, email) {
    this.name = guestName;
    this.email = email;
    this.anonId = crypto.randomUUID();
    this.distinctId = email || this.anonId;
    this.events = [];
    // Spread sessions over the last 30 minutes with realistic spacing
    this.currentTime = Date.now() - Math.floor(Math.random() * 10 * 60 * 1000) - 20 * 60 * 1000;
  }

  tick(seconds = 3) {
    this.currentTime += seconds * 1000 + Math.floor(Math.random() * 1500);
    return new Date(this.currentTime).toISOString();
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
      timestamp: this.tick(2),
    });
  }

  identify() {
    this.events.push({
      event: '$identify',
      distinct_id: this.distinctId,
      properties: {
        $lib: 'posthog-react-native',
        $lib_version: '4.83.0',
        $anon_distinct_id: this.anonId,
        $set: {
          email: this.email,
          name: this.name,
        },
      },
      timestamp: this.tick(1),
    });
  }
}

async function runSimulation() {
  console.log('Building 20 realistic Roam guest sessions...\n');

  const sessions = [];

  // ==========================================
  // GROUP A: Stays Viewers Only (6 sessions)
  // ==========================================

  // Session 1: Emma Watson - Explores Cabins, views Modern Cabin, saves it
  {
    const s = new GuestSimulator('Emma Watson', 'emma.w@example.com');
    s.track('onboarding_completed');
    s.identify();
    s.track('authentication_completed', { authentication_method: 'email_code', authentication_flow: 'signup' });
    s.track('stay_category_selected', { category: 'Cabins' });
    s.track('stay_search_submitted', { has_query: true, source: 'home_search' });
    s.track('stay_search_submitted', { has_query: true, source: 'search_results' });
    s.track('stay_search_completed', { has_query: true, result_count: 3, has_results: true, source: 'search_results' });
    s.track('stay_viewed', { slug: 'modern-cabin-hot-tub', title: 'Modern Cabin with Hot Tub', type: 'cabin' });
    s.track('stay_saved', { property_id: 'modern-cabin-hot-tub', title: 'Modern Cabin with Hot Tub' });
    sessions.push({ id: 1, guest: s.name, type: 'view_only', actions: ['Search Cabins', 'View stay', 'Save stay'], simulator: s });
  }

  // Session 2: Marcus Thorne - Searches villas, views Seminyak Garden Villa, views host
  {
    const s = new GuestSimulator('Marcus Thorne', 'marcus.t@example.com');
    s.track('onboarding_completed');
    s.identify();
    s.track('authentication_completed', { authentication_method: 'password', authentication_flow: 'signin' });
    s.track('stay_search_submitted', { has_query: true, source: 'home_search' });
    s.track('stay_search_submitted', { has_query: true, source: 'search_results' });
    s.track('stay_search_completed', { has_query: true, result_count: 2, has_results: true, source: 'search_results' });
    s.track('stay_viewed', { slug: 'bali-garden-villa', title: 'Seminyak Garden Villa', type: 'villa' });
    s.track('stay_host_opened', { slug: 'bali-garden-villa' });
    sessions.push({ id: 2, guest: s.name, type: 'view_only', actions: ['Search villas', 'View stay', 'Open Host'], simulator: s });
  }

  // Session 3: Sophia Lin - Category Beach, filters Pet Friendly, views Sea Glass Bungalow
  {
    const s = new GuestSimulator('Sophia Lin', 'sophia.l@example.com');
    s.track('stay_category_selected', { category: 'Beach' });
    s.track('stay_filter_updated', { filter: 'Pet Friendly', action: 'applied', kind: 'amenity' });
    s.track('stay_search_submitted', { has_query: false, source: 'search_results' });
    s.track('stay_search_completed', { has_query: false, result_count: 4, has_results: true, source: 'search_results' });
    s.track('stay_viewed', { slug: 'sea-glass-bungalow', title: 'Sea Glass Bungalow', type: 'bungalow' });
    sessions.push({ id: 3, guest: s.name, type: 'view_only', actions: ['Beach category', 'Filter pets', 'View stay'], simulator: s });
  }

  // Session 4: Liam Keller - Cozy cottage search, views Harbor Light, shares stay
  {
    const s = new GuestSimulator('Liam Keller', 'liam.k@example.com');
    s.track('stay_search_submitted', { has_query: true, source: 'home_search' });
    s.track('stay_search_submitted', { has_query: true, source: 'search_results' });
    s.track('stay_search_completed', { has_query: true, result_count: 2, has_results: true, source: 'search_results' });
    s.track('stay_viewed', { slug: 'harbor-light-cottage', title: 'Harbor Light Cottage', type: 'cottage' });
    s.track('stay_shared', { slug: 'harbor-light-cottage' });
    sessions.push({ id: 4, guest: s.name, type: 'view_only', actions: ['Search cottage', 'View stay', 'Share stay'], simulator: s });
  }

  // Session 5: Olivia Patel - Browses all, sorts price low, views Blue Door Ocean Cottage, views policies
  {
    const s = new GuestSimulator('Olivia Patel', 'olivia.p@example.com');
    s.track('stay_category_selected', { category: 'All Stays' });
    s.track('stay_sort_changed', { sort_order: 'price_low' });
    s.track('stay_search_submitted', { has_query: false, source: 'search_results' });
    s.track('stay_search_completed', { has_query: false, result_count: 10, has_results: true, source: 'search_results' });
    s.track('stay_viewed', { slug: 'blue-door-ocean-cottage', title: 'Blue Door Ocean Cottage', type: 'cottage' });
    s.track('stay_policies_opened', { slug: 'blue-door-ocean-cottage', from: 'cancellation' });
    sessions.push({ id: 5, guest: s.name, type: 'view_only', actions: ['Sort price_low', 'View stay', 'Check cancellation policies'], simulator: s });
  }

  // Session 6: Noah Howard - Searches redwood cabin, views Redwood A-Frame
  {
    const s = new GuestSimulator('Noah Howard', 'noah.h@example.com');
    s.track('stay_search_submitted', { has_query: true, source: 'home_search' });
    s.track('stay_search_submitted', { has_query: true, source: 'search_results' });
    s.track('stay_search_completed', { has_query: true, result_count: 1, has_results: true, source: 'search_results' });
    s.track('stay_viewed', { slug: 'redwood-aframe', title: 'A-Frame in the Redwoods', type: 'cabin' });
    sessions.push({ id: 6, guest: s.name, type: 'view_only', actions: ['Search redwood', 'View stay'], simulator: s });
  }

  // ==========================================
  // GROUP B: View Stay & Direct Book (4 sessions)
  // ==========================================

  // Session 7: David Chen - Searches Modern Cabin with Hot Tub, views host, taps Book
  {
    const s = new GuestSimulator('David Chen', 'david.c@example.com');
    s.track('onboarding_completed');
    s.identify();
    s.track('authentication_completed', { authentication_method: 'password', authentication_flow: 'signin' });
    s.track('stay_search_submitted', { has_query: true, source: 'home_search' });
    s.track('stay_search_submitted', { has_query: true, source: 'search_results' });
    s.track('stay_search_completed', { has_query: true, result_count: 1, has_results: true, source: 'search_results' });
    s.track('stay_viewed', { slug: 'modern-cabin-hot-tub', title: 'Modern Cabin with Hot Tub', type: 'cabin' });
    s.track('stay_host_opened', { slug: 'modern-cabin-hot-tub' });
    s.track('stay_book_tapped', { slug: 'modern-cabin-hot-tub' });
    sessions.push({ id: 7, guest: s.name, type: 'direct_book', actions: ['Search cabin', 'View stay', 'Open Host', 'Tap Book'], simulator: s });
  }

  // Session 8: Maya Sharma - Filter pool, views Divya House Villa, taps Book
  {
    const s = new GuestSimulator('Maya Sharma', 'maya.s@example.com');
    s.track('stay_category_selected', { category: 'Villas' });
    s.track('stay_filter_updated', { filter: 'Pool', action: 'applied', kind: 'amenity' });
    s.track('stay_search_submitted', { has_query: false, source: 'search_results' });
    s.track('stay_search_completed', { has_query: false, result_count: 2, has_results: true, source: 'search_results' });
    s.track('stay_viewed', { slug: 'palm-house-villa', title: 'Divya House Villa', type: 'villa' });
    s.track('stay_book_tapped', { slug: 'palm-house-villa' });
    sessions.push({ id: 8, guest: s.name, type: 'direct_book', actions: ['Filter Pool', 'View stay', 'Tap Book'], simulator: s });
  }

  // Session 9: Ethan Reed - Views Sonoma Hillside House, checks policies, taps Book
  {
    const s = new GuestSimulator('Ethan Reed', 'ethan.r@example.com');
    s.track('stay_search_submitted', { has_query: true, source: 'home_search' });
    s.track('stay_search_submitted', { has_query: true, source: 'search_results' });
    s.track('stay_search_completed', { has_query: true, result_count: 1, has_results: true, source: 'search_results' });
    s.track('stay_viewed', { slug: 'sonoma-hillside-house', title: 'Sonoma Hillside House', type: 'house' });
    s.track('stay_policies_opened', { slug: 'sonoma-hillside-house', from: 'cancellation' });
    s.track('stay_book_tapped', { slug: 'sonoma-hillside-house' });
    sessions.push({ id: 9, guest: s.name, type: 'direct_book', actions: ['Search hillside', 'View stay', 'Check policies', 'Tap Book'], simulator: s });
  }

  // Session 10: Chloe Miller - Searches fireplace cabin, views Cedar Lookout Cabin, saves and taps Book
  {
    const s = new GuestSimulator('Chloe Miller', 'chloe.m@example.com');
    s.track('stay_search_submitted', { has_query: true, source: 'home_search' });
    s.track('stay_search_submitted', { has_query: true, source: 'search_results' });
    s.track('stay_search_completed', { has_query: true, result_count: 2, has_results: true, source: 'search_results' });
    s.track('stay_viewed', { slug: 'cedar-lookout-cabin', title: 'Cedar Lookout Cabin', type: 'cabin' });
    s.track('stay_saved', { property_id: 'cedar-lookout-cabin', title: 'Cedar Lookout Cabin' });
    s.track('stay_book_tapped', { slug: 'cedar-lookout-cabin' });
    sessions.push({ id: 10, guest: s.name, type: 'direct_book', actions: ['Search cabin', 'View stay', 'Save stay', 'Tap Book'], simulator: s });
  }

  // =========================================================================
  // GROUP C: View Stay, Open Ask, Drop-off Without Asking (2 sessions)
  // =========================================================================

  // Session 11: Aiden Brooks - Views Modern Cabin, opens Ask, reviews chips, drops off
  {
    const s = new GuestSimulator('Aiden Brooks', 'aiden.b@example.com');
    s.track('stay_search_submitted', { has_query: true, source: 'home_search' });
    s.track('stay_search_submitted', { has_query: true, source: 'search_results' });
    s.track('stay_search_completed', { has_query: true, result_count: 3, has_results: true, source: 'search_results' });
    s.track('stay_viewed', { slug: 'modern-cabin-hot-tub', title: 'Modern Cabin with Hot Tub', type: 'cabin' });
    s.track('stay_ask_opened', { slug: 'modern-cabin-hot-tub' });
    sessions.push({ id: 11, guest: s.name, type: 'ask_dropoff', actions: ['View stay', 'Open Ask', 'No question sent'], simulator: s });
  }

  // Session 12: Zoe Nguyen - Views Redwood A-Frame, opens Ask, browses, returns
  {
    const s = new GuestSimulator('Zoe Nguyen', 'zoe.n@example.com');
    s.track('stay_category_selected', { category: 'Cabins' });
    s.track('stay_viewed', { slug: 'redwood-aframe', title: 'A-Frame in the Redwoods', type: 'cabin' });
    s.track('stay_ask_opened', { slug: 'redwood-aframe' });
    sessions.push({ id: 12, guest: s.name, type: 'ask_dropoff', actions: ['Cabins category', 'View stay', 'Open Ask', 'No question sent'], simulator: s });
  }

  // =========================================================================
  // GROUP D: View Stay, Open Ask, Ask Question with Answer (5 sessions)
  // =========================================================================

  // Session 13: Lucas Diaz - Views Modern Cabin, asks Cancellation via chip (answered), taps Book
  {
    const s = new GuestSimulator('Lucas Diaz', 'lucas.d@example.com');
    s.track('stay_viewed', { slug: 'modern-cabin-hot-tub', title: 'Modern Cabin with Hot Tub', type: 'cabin' });
    s.track('stay_ask_opened', { slug: 'modern-cabin-hot-tub' });
    s.track('stay_ask_sent', {
      slug: 'modern-cabin-hot-tub',
      from: 'chip',
      topics: ['cancellation'],
      answered: true,
    });
    s.track('stay_book_tapped', { slug: 'modern-cabin-hot-tub' });
    sessions.push({ id: 13, guest: s.name, type: 'ask_answered_book', actions: ['View stay', 'Open Ask', 'Chip: Cancellation (Answered)', 'Tap Book'], simulator: s });
  }

  // Session 14: Isabella Flores - Blue Door Ocean Cottage, asks Pets via chip (answered), leaves
  {
    const s = new GuestSimulator('Isabella Flores', 'isabella.f@example.com');
    s.track('stay_search_submitted', { has_query: true, source: 'home_search' });
    s.track('stay_search_completed', { has_query: true, result_count: 2, has_results: true, source: 'search_results' });
    s.track('stay_viewed', { slug: 'blue-door-ocean-cottage', title: 'Blue Door Ocean Cottage', type: 'cottage' });
    s.track('stay_ask_opened', { slug: 'blue-door-ocean-cottage' });
    s.track('stay_ask_sent', {
      slug: 'blue-door-ocean-cottage',
      from: 'chip',
      topics: ['pets'],
      answered: true,
    });
    sessions.push({ id: 14, guest: s.name, type: 'ask_answered', actions: ['Search cottage', 'View stay', 'Open Ask', 'Chip: Pets (Answered)'], simulator: s });
  }

  // Session 15: Daniel Vance - Divya House Villa, types check-in question (answered), taps Book
  {
    const s = new GuestSimulator('Daniel Vance', 'daniel.v@example.com');
    s.track('onboarding_completed');
    s.identify();
    s.track('authentication_completed', { authentication_method: 'email_code', authentication_flow: 'signin' });
    s.track('stay_viewed', { slug: 'palm-house-villa', title: 'Divya House Villa', type: 'villa' });
    s.track('stay_ask_opened', { slug: 'palm-house-villa' });
    s.track('stay_ask_sent', {
      slug: 'palm-house-villa',
      from: 'input',
      topics: ['checkIn'],
      answered: true,
    });
    s.track('stay_book_tapped', { slug: 'palm-house-villa' });
    sessions.push({ id: 15, guest: s.name, type: 'ask_answered_book', actions: ['View stay', 'Open Ask', 'Input: check-in (Answered)', 'Tap Book'], simulator: s });
  }

  // Session 16: Ava Jackson - Sonoma Hillside House, chip House Rules (answered), taps Book
  {
    const s = new GuestSimulator('Ava Jackson', 'ava.j@example.com');
    s.track('stay_category_selected', { category: 'Villas' });
    s.track('stay_viewed', { slug: 'sonoma-hillside-house', title: 'Sonoma Hillside House', type: 'house' });
    s.track('stay_ask_opened', { slug: 'sonoma-hillside-house' });
    s.track('stay_ask_sent', {
      slug: 'sonoma-hillside-house',
      from: 'chip',
      topics: ['houseRules'],
      answered: true,
    });
    s.track('stay_book_tapped', { slug: 'sonoma-hillside-house' });
    sessions.push({ id: 16, guest: s.name, type: 'ask_answered_book', actions: ['View stay', 'Open Ask', 'Chip: House rules (Answered)', 'Tap Book'], simulator: s });
  }

  // Session 17: James King - Harbor Light Cottage, types payment question (answered), saves stay
  {
    const s = new GuestSimulator('James King', 'james.k@example.com');
    s.track('stay_viewed', { slug: 'harbor-light-cottage', title: 'Harbor Light Cottage', type: 'cottage' });
    s.track('stay_ask_opened', { slug: 'harbor-light-cottage' });
    s.track('stay_ask_sent', {
      slug: 'harbor-light-cottage',
      from: 'input',
      topics: ['payment'],
      answered: true,
    });
    s.track('stay_saved', { property_id: 'harbor-light-cottage', title: 'Harbor Light Cottage' });
    sessions.push({ id: 17, guest: s.name, type: 'ask_answered', actions: ['View stay', 'Open Ask', 'Input: payment (Answered)', 'Save stay'], simulator: s });
  }

  // =========================================================================
  // GROUP E: View Stay, Open Ask, Ask Question with No Answer (3 sessions)
  // =========================================================================

  // Session 18: Harper Green - Cedar Lookout Cabin, asks about EV charging (no answer), leaves
  {
    const s = new GuestSimulator('Harper Green', 'harper.g@example.com');
    s.track('stay_search_submitted', { has_query: true, source: 'home_search' });
    s.track('stay_search_completed', { has_query: true, result_count: 2, has_results: true, source: 'search_results' });
    s.track('stay_viewed', { slug: 'cedar-lookout-cabin', title: 'Cedar Lookout Cabin', type: 'cabin' });
    s.track('stay_ask_opened', { slug: 'cedar-lookout-cabin' });
    s.track('stay_ask_sent', {
      slug: 'cedar-lookout-cabin',
      from: 'input',
      topics: [],
      answered: false,
    });
    sessions.push({ id: 18, guest: s.name, type: 'ask_no_answer', actions: ['View stay', 'Open Ask', 'Input: EV charging (No answer)'], simulator: s });
  }

  // Session 19: Benjamin Scott - Modern Cabin, asks check-in (answered) then gym/peloton (no answer), books anyway
  {
    const s = new GuestSimulator('Benjamin Scott', 'benjamin.s@example.com');
    s.track('stay_viewed', { slug: 'modern-cabin-hot-tub', title: 'Modern Cabin with Hot Tub', type: 'cabin' });
    s.track('stay_ask_opened', { slug: 'modern-cabin-hot-tub' });
    s.track('stay_ask_sent', {
      slug: 'modern-cabin-hot-tub',
      from: 'input',
      topics: ['checkIn'],
      answered: true,
    });
    s.track('stay_ask_sent', {
      slug: 'modern-cabin-hot-tub',
      from: 'input',
      topics: [],
      answered: false,
    });
    s.track('stay_book_tapped', { slug: 'modern-cabin-hot-tub' });
    sessions.push({ id: 19, guest: s.name, type: 'ask_mixed_book', actions: ['View stay', 'Open Ask', 'Input: checkIn (Answered)', 'Input: peloton (No answer)', 'Tap Book'], simulator: s });
  }

  // Session 20: Mia Evans - Seminyak Garden Villa, asks about personal chef/maid (no answer), leaves
  {
    const s = new GuestSimulator('Mia Evans', 'mia.e@example.com');
    s.track('stay_category_selected', { category: 'Villas' });
    s.track('stay_viewed', { slug: 'bali-garden-villa', title: 'Seminyak Garden Villa', type: 'villa' });
    s.track('stay_ask_opened', { slug: 'bali-garden-villa' });
    s.track('stay_ask_sent', {
      slug: 'bali-garden-villa',
      from: 'input',
      topics: [],
      answered: false,
    });
    sessions.push({ id: 20, guest: s.name, type: 'ask_no_answer', actions: ['View stay', 'Open Ask', 'Input: private chef (No answer)'], simulator: s });
  }

  // Consolidate all events into batch
  const allEvents = [];
  for (const session of sessions) {
    allEvents.push(...session.simulator.events);
  }

  console.log(`Sending ${allEvents.length} events across 20 guest sessions to PostHog...`);
  const result = await sendPostHogBatch(allEvents);
  console.log('PostHog batch response:', result);

  // Print session summary table
  console.log('\n======================================================');
  console.log('SUMMARY OF 20 SIMULATED ROAM GUEST SESSIONS');
  console.log('======================================================');
  sessions.forEach(s => {
    console.log(`Session #${s.id.toString().padStart(2, ' ')} [${s.guest.padEnd(16, ' ')}] - Actions: ${s.actions.join(' -> ')}`);
  });

  // Calculate funnel metrics
  const totalSessions = sessions.length;
  const viewedStayCount = sessions.filter(s => s.simulator.events.some(e => e.event === 'stay_viewed')).length;
  const openedAskCount = sessions.filter(s => s.simulator.events.some(e => e.event === 'stay_ask_opened')).length;
  const gotAnswerCount = sessions.filter(s => s.simulator.events.some(e => e.event === 'stay_ask_sent' && e.properties.answered === true)).length;
  const gotNoAnswerCount = sessions.filter(s => s.simulator.events.some(e => e.event === 'stay_ask_sent' && e.properties.answered === false)).length;
  const bookedCount = sessions.filter(s => s.simulator.events.some(e => e.event === 'stay_book_tapped')).length;
  const savedCount = sessions.filter(s => s.simulator.events.some(e => e.event === 'stay_saved')).length;

  console.log('\n======================================================');
  console.log('FUNNEL STEP BREAKDOWN');
  console.log('======================================================');
  console.log(`Total Sessions Simulated:            ${totalSessions}`);
  console.log(`1. Stay Viewed:                       ${viewedStayCount} (${((viewedStayCount / totalSessions) * 100).toFixed(0)}%)`);
  console.log(`2. Stay Saved / Favorited:            ${savedCount} (${((savedCount / totalSessions) * 100).toFixed(0)}%)`);
  console.log(`3. Opened "Ask about this stay":      ${openedAskCount} (${((openedAskCount / totalSessions) * 100).toFixed(0)}%)`);
  console.log(`4. Asked Question (Answer Received):  ${gotAnswerCount} (${((gotAnswerCount / totalSessions) * 100).toFixed(0)}%)`);
  console.log(`5. Asked Question (No Answer / Fallback): ${gotNoAnswerCount} (${((gotNoAnswerCount / totalSessions) * 100).toFixed(0)}%)`);
  console.log(`6. Tapped "Book this stay":           ${bookedCount} (${((bookedCount / totalSessions) * 100).toFixed(0)}%)`);
  console.log('======================================================\n');
}

runSimulation().catch(err => {
  console.error('Simulation failed:', err);
  process.exit(1);
});

