import { SANITY_API_VERSION, SANITY_DATASET, SANITY_PROJECT_ID } from "./config";

export async function sanityQuery<T>(
  query: string,
  params: Record<string, unknown> = {},
  signal?: AbortSignal,
): Promise<T> {
  const url = new URL(
    `https://${SANITY_PROJECT_ID}.apicdn.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}`,
  );
  url.searchParams.set("query", query);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(`$${key}`, JSON.stringify(value));
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });

  if (!res.ok) {
    throw new Error(`Sanity query failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.result as T;
}

