import type { HouseRules, StayDetails } from "./stays";

export function formatTime(timeStr?: string): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  const minute = parts[1];
  const ampm = hour >= 12 ? "PM" : "AM";
  if (hour === 0) {
    hour = 12;
  } else if (hour > 12) {
    hour -= 12;
  }
  return `${hour}:${minute} ${ampm}`;
}

export function houseRuleLines(rules?: HouseRules): string[] {
  if (!rules) return ["Standard house rules apply."];
  const lines: string[] = [];

  if (rules.checkInTime) {
    lines.push(`Check-in after ${formatTime(rules.checkInTime)}`);
  }
  if (rules.checkOutTime) {
    lines.push(`Checkout before ${formatTime(rules.checkOutTime)}`);
  }
  if (rules.quietHoursFrom && rules.quietHoursTo) {
    lines.push(
      `Quiet hours ${formatTime(rules.quietHoursFrom)} to ${formatTime(rules.quietHoursTo)}`,
    );
  }

  if (rules.petsAllowed) {
    const details: string[] = [];
    if (rules.maxPets) details.push(`up to ${rules.maxPets}`);
    if (rules.petFee) details.push(`$${rules.petFee} pet fee per stay`);
    lines.push(
      `Pets allowed${details.length > 0 ? `, ${details.join(", ")}` : ""}`,
    );
  } else {
    lines.push("No pets");
  }

  lines.push(rules.smokingAllowed ? "Smoking allowed" : "No smoking");
  lines.push(
    rules.partiesAllowed ? "Parties or events allowed" : "No parties or events",
  );

  if (rules.additionalRules && Array.isArray(rules.additionalRules)) {
    for (const rule of rules.additionalRules) {
      if (rule && rule.trim()) lines.push(rule.trim());
    }
  }

  return lines;
}

export function stayTotalCalculation(stay: StayDetails): {
  nights: number;
  total: number;
  totalFormatted: string;
  subtitle: string;
} {
  const nights = Math.max(stay.minNights ?? 1, 1);
  const total = stay.pricePerNight * nights + (stay.cleaningFee ?? 0);
  const nightsText = nights === 1 ? "1 night" : `${nights} nights`;
  return {
    nights,
    total,
    totalFormatted: `$${total}`,
    subtitle: `$${total} total · ${nightsText}`,
  };
}

export function formatHostingSince(dateStr?: string): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();
    return `Hosting since ${month} ${year}`;
  } catch {
    return `Hosting since ${dateStr}`;
  }
}

export function formatResponseTime(code?: string): string {
  if (!code) return "";
  if (code === "withinAnHour") return "Responds within an hour";
  if (code === "withinAFewHours") return "Responds within a few hours";
  if (code === "withinADay") return "Responds within a day";
  return `Responds ${code}`;
}

export function formatLanguages(langs?: string[]): string {
  if (!langs || langs.length === 0) return "";
  if (langs.length === 1) return `Speaks ${langs[0]}`;
  if (langs.length === 2) return `Speaks ${langs[0]} and ${langs[1]}`;
  return `Speaks ${langs.slice(0, -1).join(", ")} and ${langs[langs.length - 1]}`;
}

