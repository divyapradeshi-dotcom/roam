export const HOME_STAYS_QUERY = `*[_type == "property" && defined(slug.current) && ($type == "all" || type == $type)] | order(rating desc, reviewCount desc)[0...30]{
  "id": _id,
  "slug": slug.current,
  title,
  type,
  city,
  region,
  country,
  rating,
  "price": pricePerNight,
  "imageUrl": photos[0].url
}`;

export const STAY_DETAILS_QUERY = `*[_type == "property" && slug.current == $slug][0]{
  "id": _id,
  title,
  "slug": slug.current,
  type,
  city,
  region,
  country,
  neighborhood,
  pricePerNight,
  cleaningFee,
  minNights,
  rating,
  reviewCount,
  amenities,
  quiet,
  houseRules,
  summary,
  description,
  highlights,
  vibes,
  facts,
  "photos": photos[]{url, alt},
  host->{
    name,
    "slug": slug.current,
    bio,
    isSuperhost,
    hostingSince,
    responseTime,
    languages
  },
  cancellationPolicy->{
    title,
    "slug": slug.current,
    kind,
    summary,
    body
  },
  "policies": *[_type == "policy" && kind != "cancellation"]{
    title,
    "slug": slug.current,
    kind,
    summary,
    body
  }
}`;
