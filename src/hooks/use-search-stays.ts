import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sanityQuery } from "@/lib/sanity/fetch";
import { posthog } from "@/lib/posthog";
import { posthogLogs } from "@/lib/posthog-logs";
import { parseSearchQuery } from "@/lib/search/parse";
import {
  buildSearchQuery,
  formatStayResult,
  type ChipItem,
  type SearchQueryResult,
  type SearchSortOption,
  type SearchStayItem,
} from "@/lib/search/query";

const memoryCache = new Map<string, { total: number; stays: SearchStayItem[] }>();

function reportSearchTelemetry(hasQuery: boolean, total: number) {
  posthog?.capture("stay_search_submitted", {
    has_query: hasQuery,
    source: "search_results",
  });

  if (total > 0) {
    posthog?.capture("stay_search_completed", {
      has_query: hasQuery,
      result_count: total,
      has_results: true,
      source: "search_results",
    });
  } else {
    posthog?.capture("stay_search_completed", {
      has_query: hasQuery,
      result_count: 0,
      has_results: false,
      source: "search_results",
    });
    posthog?.capture("stay_search_empty", {
      has_query: hasQuery,
      result_count: 0,
      source: "search_results",
    });
  }
  posthogLogs.staySearchCompleted(hasQuery, total);
}

export function useSearchStays(
  queryText: string,
  sort: SearchSortOption = "best_match",
  toggledChipIds: Set<string>,
) {
  const parsed = useMemo(() => parseSearchQuery(queryText), [queryText]);

  // Compute available chips from the parsed query plus suggestions
  const { chips, effectiveParsed } = useMemo(() => {
    const list: ChipItem[] = [];

    // 1. Parsed type
    if (parsed.type) {
      const label =
        parsed.type === "cabin"
          ? "Cabins"
          : parsed.type === "beach"
            ? "Beach"
            : parsed.type === "city"
              ? "City"
              : "Villas";
      list.push({
        id: "type",
        label,
        kind: "type",
        selected: toggledChipIds.has("type"),
      });
    }

    // 2. Parsed price
    if (typeof parsed.maxPrice === "number") {
      list.push({
        id: `price:${parsed.maxPrice}`,
        label: `Under $${parsed.maxPrice}`,
        kind: "price",
        selected: toggledChipIds.has(`price:${parsed.maxPrice}`),
      });
    }

    // 3. Parsed guests
    if (typeof parsed.guests === "number") {
      list.push({
        id: `guests:${parsed.guests}`,
        label: `${parsed.guests}+ guests`,
        kind: "guests",
        selected: toggledChipIds.has(`guests:${parsed.guests}`),
      });
    }

    // 4. Parsed pets
    if (parsed.petsAllowed) {
      list.push({
        id: "pets",
        label: "Pet Friendly",
        kind: "pets",
        selected: toggledChipIds.has("pets"),
      });
    }

    // 5. Parsed amenities
    for (const a of parsed.amenities) {
      const label =
        a === "hotTub"
          ? "Hot Tub"
          : a === "pool"
            ? "Pool"
            : a === "fireplace"
              ? "Fireplace"
              : a === "oceanView"
                ? "Ocean View"
                : a;
      list.push({
        id: `amenity:${a}`,
        label,
        kind: "amenity",
        selected: toggledChipIds.has(`amenity:${a}`),
      });
    }

    // 6. Parsed quiet
    if (parsed.quiet) {
      list.push({
        id: "quiet",
        label: "Quiet",
        kind: "quiet",
        selected: toggledChipIds.has("quiet"),
      });
    }

    // Suggestions from fixed list if not already present
    const suggestions: { id: string; label: string; kind: ChipItem["kind"] }[] = [
      { id: "sug:price:300", label: "Under $300", kind: "price" },
      { id: "sug:pets", label: "Pet Friendly", kind: "pets" },
      { id: "sug:quiet", label: "Quiet", kind: "quiet" },
      { id: "sug:amenity:hotTub", label: "Hot Tub", kind: "amenity" },
      { id: "sug:amenity:pool", label: "Pool", kind: "amenity" },
      { id: "sug:amenity:fireplace", label: "Fireplace", kind: "amenity" },
    ];

    for (const sug of suggestions) {
      // Don't show price suggestion if a price is already set
      if (sug.kind === "price" && typeof parsed.maxPrice === "number") continue;
      // Don't show pets suggestion if already in query
      if (sug.kind === "pets" && parsed.petsAllowed) continue;
      // Don't show quiet if already in query
      if (sug.kind === "quiet" && parsed.quiet) continue;
      // Don't show amenity if already in query
      if (sug.id === "sug:amenity:hotTub" && parsed.amenities.includes("hotTub")) continue;
      if (sug.id === "sug:amenity:pool" && parsed.amenities.includes("pool")) continue;
      if (sug.id === "sug:amenity:fireplace" && parsed.amenities.includes("fireplace")) continue;

      list.push({
        id: sug.id,
        label: sug.label,
        kind: sug.kind,
        selected: toggledChipIds.has(sug.id),
      });

      if (list.length >= 6) break;
    }

    // Now derive effective parsed query based on which chips are selected
    const effective = { ...parsed };

    // Type chip
    if (parsed.type && !toggledChipIds.has("type")) {
      effective.type = undefined;
    }

    // Price chips
    if (toggledChipIds.has("sug:price:300")) {
      effective.maxPrice = 300;
    } else if (
      typeof parsed.maxPrice === "number" &&
      !toggledChipIds.has(`price:${parsed.maxPrice}`)
    ) {
      effective.maxPrice = undefined;
    }

    // Pets chips
    if (toggledChipIds.has("sug:pets")) {
      effective.petsAllowed = true;
    } else if (parsed.petsAllowed && !toggledChipIds.has("pets")) {
      effective.petsAllowed = false;
    }

    // Quiet chips
    if (toggledChipIds.has("sug:quiet")) {
      effective.quiet = true;
    } else if (parsed.quiet && !toggledChipIds.has("quiet")) {
      effective.quiet = false;
    }

    // Amenities chips
    const activeAmenities = [
      ...parsed.amenities.filter((a) => toggledChipIds.has(`amenity:${a}`)),
    ];
    if (toggledChipIds.has("sug:amenity:hotTub") && !activeAmenities.includes("hotTub")) {
      activeAmenities.push("hotTub");
    }
    if (toggledChipIds.has("sug:amenity:pool") && !activeAmenities.includes("pool")) {
      activeAmenities.push("pool");
    }
    if (toggledChipIds.has("sug:amenity:fireplace") && !activeAmenities.includes("fireplace")) {
      activeAmenities.push("fireplace");
    }
    effective.amenities = activeAmenities;

    return { chips: list, effectiveParsed: effective };
  }, [parsed, toggledChipIds]);

  const { query: groqQuery, params: groqParams } = useMemo(
    () => buildSearchQuery(effectiveParsed, sort),
    [effectiveParsed, sort],
  );

  const requestKey = useMemo(
    () => JSON.stringify({ q: groqQuery, p: groqParams }),
    [groqQuery, groqParams],
  );

  const cached = memoryCache.get(requestKey);
  const [data, setData] = useState<{ total: number; stays: SearchStayItem[] }>({
    total: 0,
    stays: [],
  });
  const [loading, setLoading] = useState<boolean>(!cached);
  const [error, setError] = useState<Error | null>(null);
  const lastLoggedKey = useRef<string | null>(null);

  const executeFetch = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const raw = await sanityQuery<SearchQueryResult>(groqQuery, groqParams, signal);
        const mapped: SearchStayItem[] = (raw.stays ?? []).map(formatStayResult);
        const resultData = { total: raw.total ?? mapped.length, stays: mapped };

        memoryCache.set(requestKey, resultData);
        setData(resultData);

        if (lastLoggedKey.current !== requestKey) {
          lastLoggedKey.current = requestKey;
          reportSearchTelemetry(Boolean(queryText.trim()), resultData.total);
        }
      } catch (err) {
        if (signal?.aborted) return;
        setError(err instanceof Error ? err : new Error("Search query failed"));
      } finally {
        setLoading(false);
      }
    },
    [groqQuery, groqParams, requestKey, queryText],
  );

  useEffect(() => {
    let ignore = false;
    const abortController = new AbortController();

    if (memoryCache.has(requestKey)) {
      if (lastLoggedKey.current !== requestKey) {
        lastLoggedKey.current = requestKey;
        const cachedItem = memoryCache.get(requestKey)!;
        reportSearchTelemetry(Boolean(queryText.trim()), cachedItem.total);
      }
    } else {
      sanityQuery<SearchQueryResult>(groqQuery, groqParams, abortController.signal)
        .then((raw) => {
          if (ignore) return;
          const mapped: SearchStayItem[] = (raw.stays ?? []).map(formatStayResult);
          const resultData = { total: raw.total ?? mapped.length, stays: mapped };

          memoryCache.set(requestKey, resultData);
          setData(resultData);
          setLoading(false);

          if (lastLoggedKey.current !== requestKey) {
            lastLoggedKey.current = requestKey;
            reportSearchTelemetry(Boolean(queryText.trim()), resultData.total);
          }
        })
        .catch((err) => {
          if (ignore || abortController.signal.aborted) return;
          setError(err instanceof Error ? err : new Error("Search query failed"));
          setLoading(false);
        });
    }

    return () => {
      ignore = true;
      abortController.abort();
    };
  }, [requestKey, groqQuery, groqParams, queryText]);

  const activeStays = cached?.stays ?? data.stays;
  const activeTotal = cached?.total ?? data.total;

  return {
    stays: activeStays,
    total: activeTotal,
    loading: loading && !cached,
    error,
    retry: () => executeFetch(),
    chips,
    effectiveParsed,
    requestKey,
  };
}

