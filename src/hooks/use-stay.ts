import { useCallback, useEffect, useRef, useState } from "react";
import { sanityQuery } from "@/lib/sanity/fetch";
import { STAY_DETAILS_QUERY } from "@/lib/sanity/queries";
import { formatPlaceLabel, type StayDetails } from "@/lib/stays";
import { posthog } from "@/lib/posthog";

const stayCache = new Map<string, StayDetails>();

export function useStay(slug?: string) {
  const cached = slug ? stayCache.get(slug) : undefined;
  const [stay, setStay] = useState<StayDetails | null>(cached ?? null);
  const [loading, setLoading] = useState<boolean>(!cached);
  const [error, setError] = useState<Error | null>(null);
  const reportedSlug = useRef<string | null>(null);

  const fetchStay = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const raw = await sanityQuery<any>(STAY_DETAILS_QUERY, { slug });
      if (!raw) {
        setStay(null);
        return;
      }

      const ratingVal = typeof raw.rating === "number" ? raw.rating : 4.8;
      const formatted: StayDetails = {
        id: raw.id,
        title: raw.title,
        slug: raw.slug,
        type: raw.type,
        city: raw.city,
        region: raw.region,
        country: raw.country,
        neighborhood: raw.neighborhood,
        location: formatPlaceLabel(raw.city, raw.region, raw.country),
        pricePerNight: raw.pricePerNight,
        cleaningFee: raw.cleaningFee,
        minNights: raw.minNights ?? 1,
        rating: ratingVal,
        ratingText: ratingVal.toFixed(1),
        reviewCount: typeof raw.reviewCount === "number" ? raw.reviewCount : 124,
        amenities: raw.amenities ?? [],
        quiet: raw.quiet,
        houseRules: raw.houseRules,
        summary: raw.summary,
        description: raw.description,
        highlights: raw.highlights,
        vibes: raw.vibes,
        facts: raw.facts,
        photos:
          raw.photos && raw.photos.length > 0
            ? raw.photos
            : [
                {
                  url: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1400&q=85",
                  alt: raw.title,
                },
              ],
        host: raw.host,
        cancellationPolicy: raw.cancellationPolicy,
        policies: raw.policies,
      };

      stayCache.set(slug, formatted);
      setStay(formatted);

      if (reportedSlug.current !== slug) {
        reportedSlug.current = slug;
        posthog?.capture("stay_viewed", {
          slug: formatted.slug,
          title: formatted.title,
          type: formatted.type,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load stay"));
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    let ignore = false;
    const abort = new AbortController();

    if (stayCache.has(slug)) {
      if (reportedSlug.current !== slug) {
        reportedSlug.current = slug;
        const cachedStay = stayCache.get(slug)!;
        posthog?.capture("stay_viewed", {
          slug: cachedStay.slug,
          title: cachedStay.title,
          type: cachedStay.type,
        });
      }
    } else {
      sanityQuery<any>(STAY_DETAILS_QUERY, { slug }, abort.signal)
        .then((raw) => {
          if (ignore) return;
          if (!raw) {
            setStay(null);
            setLoading(false);
            return;
          }
          const ratingVal = typeof raw.rating === "number" ? raw.rating : 4.8;
          const formatted: StayDetails = {
            id: raw.id,
            title: raw.title,
            slug: raw.slug,
            type: raw.type,
            city: raw.city,
            region: raw.region,
            country: raw.country,
            neighborhood: raw.neighborhood,
            location: formatPlaceLabel(raw.city, raw.region, raw.country),
            pricePerNight: raw.pricePerNight,
            cleaningFee: raw.cleaningFee,
            minNights: raw.minNights ?? 1,
            rating: ratingVal,
            ratingText: ratingVal.toFixed(1),
            reviewCount: typeof raw.reviewCount === "number" ? raw.reviewCount : 124,
            amenities: raw.amenities ?? [],
            quiet: raw.quiet,
            houseRules: raw.houseRules,
            summary: raw.summary,
            description: raw.description,
            highlights: raw.highlights,
            vibes: raw.vibes,
            facts: raw.facts,
            photos:
              raw.photos && raw.photos.length > 0
                ? raw.photos
                : [
                    {
                      url: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1400&q=85",
                      alt: raw.title,
                    },
                  ],
            host: raw.host,
            cancellationPolicy: raw.cancellationPolicy,
            policies: raw.policies,
          };

          stayCache.set(slug, formatted);
          setStay(formatted);
          setLoading(false);

          if (reportedSlug.current !== slug) {
            reportedSlug.current = slug;
            posthog?.capture("stay_viewed", {
              slug: formatted.slug,
              title: formatted.title,
              type: formatted.type,
            });
          }
        })
        .catch((err) => {
          if (ignore || abort.signal.aborted) return;
          setError(err instanceof Error ? err : new Error("Failed to load stay"));
          setLoading(false);
        });
    }

    return () => {
      ignore = true;
      abort.abort();
    };
  }, [slug]);

  const activeStay = cached ?? stay;

  return {
    stay: activeStay,
    loading: loading && !cached,
    error,
    retry: fetchStay,
  };
}

