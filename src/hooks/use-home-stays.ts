import { useCallback, useEffect, useState } from "react";
import { sanityQuery } from "@/lib/sanity/fetch";
import { HOME_STAYS_QUERY } from "@/lib/sanity/queries";
import { formatPlaceLabel, type PropertyType, type StayCardData } from "@/lib/stays";

interface SanityStayItem {
  id: string;
  slug: string;
  title: string;
  type: PropertyType;
  city: string;
  region?: string;
  country: string;
  rating: number;
  price: number;
  imageUrl?: string;
}

const memoryCache = new Map<string, StayCardData[]>();

export function useHomeStays(selectedCategory: string) {
  const categoryParam =
    selectedCategory === "Cabins"
      ? "cabin"
      : selectedCategory === "Beach"
        ? "beach"
        : selectedCategory === "City"
          ? "city"
          : selectedCategory === "Villas"
            ? "villa"
            : "all";

  const cached = memoryCache.get(categoryParam);
  const [data, setData] = useState<StayCardData[]>([]);
  const [loading, setLoading] = useState<boolean>(!cached);
  const [error, setError] = useState<Error | null>(null);

  const fetchStays = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await sanityQuery<SanityStayItem[]>(HOME_STAYS_QUERY, {
        type: categoryParam,
      });

      const mapped: StayCardData[] = raw.map((item) => ({
        id: item.id,
        slug: item.slug,
        title: item.title,
        type: item.type,
        city: item.city,
        region: item.region,
        country: item.country,
        location: formatPlaceLabel(item.city, item.region, item.country),
        rating: typeof item.rating === "number" ? item.rating.toFixed(1) : "4.9",
        price: item.price,
        imageUrl:
          item.imageUrl ||
          "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1400&q=85",
      }));

      memoryCache.set(categoryParam, mapped);
      setData(mapped);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load stays"));
    } finally {
      setLoading(false);
    }
  }, [categoryParam]);

  useEffect(() => {
    let ignore = false;
    if (!memoryCache.has(categoryParam)) {
      sanityQuery<SanityStayItem[]>(HOME_STAYS_QUERY, { type: categoryParam })
        .then((raw) => {
          if (ignore) return;
          const mapped: StayCardData[] = raw.map((item) => ({
            id: item.id,
            slug: item.slug,
            title: item.title,
            type: item.type,
            city: item.city,
            region: item.region,
            country: item.country,
            location: formatPlaceLabel(item.city, item.region, item.country),
            rating: typeof item.rating === "number" ? item.rating.toFixed(1) : "4.9",
            price: item.price,
            imageUrl:
              item.imageUrl ||
              "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1400&q=85",
          }));

          memoryCache.set(categoryParam, mapped);
          setData(mapped);
          setLoading(false);
        })
        .catch((err) => {
          if (ignore) return;
          setError(err instanceof Error ? err : new Error("Failed to load stays"));
          setLoading(false);
        });
    }

    return () => {
      ignore = true;
    };
  }, [categoryParam]);

  const stays = cached ?? data;

  return {
    stays,
    loading: loading && !cached,
    error,
    retry: fetchStays,
  };
}

