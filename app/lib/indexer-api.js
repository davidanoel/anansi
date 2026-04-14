const DEFAULT_INDEXER_API_URL = "http://127.0.0.1:4000";

export function getIndexerApiUrl() {
  return (
    process.env.INDEXER_API_URL ||
    process.env.NEXT_PUBLIC_INDEXER_API_URL ||
    DEFAULT_INDEXER_API_URL
  ).replace(/\/$/, "");
}

export async function fetchIndexerJson(path, init = {}) {
  const url = `${getIndexerApiUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || `Indexer request failed (${response.status})`);
  }

  return payload;
}
