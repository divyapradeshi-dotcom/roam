import type { StayDetails } from "./stays";
import { formatTime, houseRuleLines } from "./stay-details";

export type TopicKey =
  | "cancellation"
  | "checkIn"
  | "pets"
  | "houseRules"
  | "payment"
  | "damage"
  | "guestRefund";

export interface TopicDefinition {
  key: TopicKey;
  chip: string;
  question: string;
  keywords: string[];
}

export const TOPICS: TopicDefinition[] = [
  {
    key: "cancellation",
    chip: "Cancellation",
    question: "What's the cancellation policy?",
    keywords: ["cancel", "refund before"],
  },
  {
    key: "checkIn",
    chip: "Check-in",
    question: "When are check-in and checkout?",
    keywords: [
      "check in",
      "check-in",
      "checkin",
      "checkout",
      "check out",
      "arriv",
      "leave",
      "late",
      "early",
    ],
  },
  {
    key: "pets",
    chip: "Pets",
    question: "Can I bring my pet?",
    keywords: ["pet", "dog", "cat", "animal"],
  },
  {
    key: "houseRules",
    chip: "House rules",
    question: "What are the house rules?",
    keywords: ["rule", "smok", "part", "quiet", "noise", "event"],
  },
  {
    key: "payment",
    chip: "Payment",
    question: "How does payment work?",
    keywords: ["pay", "charge", "price", "cost", "fee", "card"],
  },
  {
    key: "damage",
    chip: "Damage",
    question: "What if something gets damaged?",
    keywords: ["damage", "deposit", "broke"],
  },
  {
    key: "guestRefund",
    chip: "Refunds",
    question: "What if the stay isn't as described?",
    keywords: ["refund", "as described", "issue", "problem"],
  },
];

export interface AnswerCardData {
  key: string;
  title: string;
  lines: string[];
  source?: {
    label: string;
    icon: "home" | "policy";
  };
  link?: {
    label: string;
    section?: string;
  };
}

export function matchTopics(text: string): TopicKey[] {
  const lower = text.toLowerCase();
  const matched: TopicKey[] = [];

  for (const topic of TOPICS) {
    for (const kw of topic.keywords) {
      if (lower.includes(kw)) {
        if (!matched.includes(topic.key)) {
          matched.push(topic.key);
        }
        break;
      }
    }
  }

  return matched;
}

export function answerFor(
  stay: StayDetails | null,
  topics: TopicKey[],
): AnswerCardData[] {
  if (!stay || topics.length === 0) {
    return [
      {
        key: "no-answer",
        title: "No answer in this stay's details",
        lines: [
          "Roam's policies and this stay's details don't cover this. Contact Roam support.",
        ],
      },
    ];
  }

  const cards: AnswerCardData[] = [];

  // Helper to find shared policy by kind
  const findPolicy = (kind: string) => {
    return (
      stay.policies?.find((p) => p.kind?.toLowerCase() === kind.toLowerCase()) ||
      stay.policies?.find((p) => p.slug?.toLowerCase().includes(kind.toLowerCase()))
    );
  };

  for (const topic of topics) {
    if (topic === "cancellation") {
      const policy = stay.cancellationPolicy;
      if (policy) {
        cards.push({
          key: `cancellation-${cards.length}`,
          title: policy.title || "Cancellation policy",
          source: { label: "Cancellation policy", icon: "policy" },
          lines: [
            policy.summary ||
              "Cancel up to 5 days before check-in for a full refund.",
          ],
          link: { label: "Read full policy", section: "cancellation" },
        });
      }
    } else if (topic === "checkIn") {
      const rules = stay.houseRules;
      const lines: string[] = [];
      if (rules?.checkInTime) {
        lines.push(`Check-in after ${formatTime(rules.checkInTime)}`);
      }
      if (rules?.checkOutTime) {
        lines.push(`Checkout before ${formatTime(rules.checkOutTime)}`);
      }
      if (rules?.quietHoursFrom && rules?.quietHoursTo) {
        lines.push(
          `Quiet hours ${formatTime(rules.quietHoursFrom)} to ${formatTime(rules.quietHoursTo)}`,
        );
      }
      if (lines.length === 0) {
        lines.push("Standard check-in after 3:00 PM and checkout before 11:00 AM.");
      }

      cards.push({
        key: `checkin-rules-${cards.length}`,
        title: "Check-in and checkout",
        source: { label: "This stay's house rules", icon: "home" },
        lines,
        link: { label: "See all policies", section: "rules" },
      });

      const checkInPolicy = findPolicy("checkIn");
      if (checkInPolicy?.summary) {
        cards.push({
          key: `checkin-policy-${cards.length}`,
          title: checkInPolicy.title || "Check-in and check-out",
          source: { label: "Roam policy", icon: "policy" },
          lines: [checkInPolicy.summary],
          link: { label: "Read full policy", section: "checkIn" },
        });
      }
    } else if (topic === "pets") {
      const rules = stay.houseRules;
      const petLine = rules?.petsAllowed
        ? `Pets allowed${rules.maxPets ? `, up to ${rules.maxPets}` : ""}${rules.petFee ? ` ($${rules.petFee} pet fee per stay)` : ""}`
        : "No pets";

      cards.push({
        key: `pets-rules-${cards.length}`,
        title: "Pets",
        source: { label: "This stay's house rules", icon: "home" },
        lines: [petLine],
        link: { label: "See all policies", section: "rules" },
      });

      const petPolicy = findPolicy("pets");
      if (petPolicy?.summary) {
        cards.push({
          key: `pets-policy-${cards.length}`,
          title: petPolicy.title || "Pets",
          source: { label: "Roam policy", icon: "policy" },
          lines: [petPolicy.summary],
          link: { label: "Read full policy", section: "pets" },
        });
      }
    } else if (topic === "houseRules") {
      const lines = houseRuleLines(stay.houseRules);
      cards.push({
        key: `rules-${cards.length}`,
        title: "House rules",
        source: { label: "This stay's house rules", icon: "home" },
        lines,
        link: { label: "See all policies", section: "rules" },
      });
    } else if (topic === "payment") {
      const policy = findPolicy("booking");
      if (policy?.summary) {
        cards.push({
          key: `payment-${cards.length}`,
          title: policy.title || "Booking and payment",
          source: { label: "Roam policy", icon: "policy" },
          lines: [policy.summary],
          link: { label: "Read full policy", section: "booking" },
        });
      }
    } else if (topic === "damage") {
      const policy = findPolicy("damage");
      if (policy?.summary) {
        cards.push({
          key: `damage-${cards.length}`,
          title: policy.title || "Damage and security",
          source: { label: "Roam policy", icon: "policy" },
          lines: [policy.summary],
          link: { label: "Read full policy", section: "damage" },
        });
      }
    } else if (topic === "guestRefund") {
      const policy = findPolicy("guestRefund");
      if (policy?.summary) {
        cards.push({
          key: `refund-${cards.length}`,
          title: policy.title || "Guest refunds",
          source: { label: "Roam policy", icon: "policy" },
          lines: [policy.summary],
          link: { label: "Read full policy", section: "guestRefund" },
        });
      }
    }
  }

  if (cards.length === 0) {
    return [
      {
        key: "no-answer",
        title: "No answer in this stay's details",
        lines: [
          "Roam's policies and this stay's details don't cover this. Contact Roam support.",
        ],
      },
    ];
  }

  return cards;
}

