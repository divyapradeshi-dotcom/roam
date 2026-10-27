Based on the PostHog funnel data and session simulations, here is the diagnosis of our current implementation and the recommended change to make the guest journey smoother.

1. Diagnosis: What Implementation We Have Today

In our current stay details screen (src/app/stay/[slug]/index.tsx):

Basic rules are hidden behind modals & chat: Directly below the 4 amenity icons, the screen jumps straight into two purple cards:
"Ask about policies" (stay_ask_opened)
"Free cancellation" (opens policies sheet)
High-friction discovery: To find basic stay logistics (e.g. check-in times, checkout times, pet policy, quiet hours, or house rules), guests are forced to leave the page and enter a chat conversation or open the policies modal.
2. What the PostHog Data Revealed
Metric / Finding	PostHog Signal	UX Problem
50% of stay viewers open Ask	stay_ask_opened (10/20 sessions)	Unusually high reliance on chat for basic listing information.
20% drop-off in Ask	Opened Ask → 0 messages sent (Sessions 11 & 12)	Guests opened chat expecting instant answers, saw a blank chat interface, and bounced back without booking.
Repetitive basic queries	Topics asked: checkIn, pets, houseRules	Guests had to type or tap chips for static data that should be visible upfront on the listing.
Lost bookings on unknown questions	Sessions 18 & 20 received answered: false fallback	When guests used Ask for niche queries (EV charger, private chef) and got no answer, they abandoned the booking.
3. The Recommended Change: Add "Good to know" & Refine "Ask"

To remove this friction and streamline the path to booking, we implement the changes specified in prompts/11-good-to-know.md:

[Stay Header & Photos]
        ↓
[Amenity Highlights] (Hot Tub, Pet Friendly, Fast Wi-Fi, Forest Views)
        ↓
[✨ NEW: "Good to know" Section]
   🕒 Check-in after 3:00 PM · Checkout before 11:00 AM
   🌙 Quiet hours 10:00 PM – 8:00 AM
   🐾 Pets allowed
   🚭 No smoking
   🎉 No parties or events
   🔗 "Show all rules" (opens full policies modal with `from: "good_to_know"`)
        ↓
[Updated Ask Card: "Ask about this stay"]
  "Cancellation, house rules, pets, check-in and more."
Key Implementation Changes:

Surface Essential Rules Upfront ("Good to know"):

Directly render key rules (check-in, checkout, quiet hours, pets, smoking, parties) using houseRuleLines(stay.houseRules) before the action cards.
Add rule icons: clock, moon, smoking, party, pets.
Add a "Show all rules" link that triggers stay_policies_opened with { from: "good_to_know" }.

Rename the Ask Card to "Ask about this stay":

Change the title from "Ask about policies" to "Ask about this stay" to match the chat screen title and reposition Ask as an AI assistant for nuanced questions rather than the only way to read standard check-in and pet rules.
4. Expected Impact on User Flow
Zero-click access to logistics: Guests see check-in/out times and pet rules in < 2 seconds without navigating away or typing into chat.
Eliminates chat drop-offs: Prevents guests who just want basic house rules from bouncing out of an empty chat.
Increases booking conversion: Reduces cognitive load and taps needed to reach "Book this stay".

.............................................................
Replace Jev in this project with Open AI through the AI SDK. Read the current AI SDK docs on structured output first.

Keep every decision Jev makes in the same place, with the same options defined in code, but return it as structured output validated against a schema. Use a confidence of low, medium or high instead of a probability, and return any probability thresholds to those labels. If a response doesn't match the schema, fall back the same way we do when Jev isn't confident.

Then rerun our test searches and Knowledge Base questions, list every result that changed, and update AGENTS.md with the model, how outputs are validated, the fallback, and where the key lives.

Ask me before changing anything else.
------------------------------------------------------------------
I want to add <feature> to Roam.

Before writing any code, read AGENTS.md and inspect the parts of the app this feature touches.
Explain:
- what problem this feature solves
- what data it needs
- where that data should live
- whether we need any new service
- the tradeoffs if we do
- any security or privacy concerns
- how we should measure whether the feature worked (PostHog)
Research the latest documentation for anything that may have changed, then ask me any important questions before writing the plan.