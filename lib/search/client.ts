"use client";

import {
  EMBEDDING_DTYPE,
  SEARCH_INDEX_PATH,
  SEARCH_MAP_PATH,
  SEARCH_MODEL_ID,
} from "@/lib/search/config";
import type { SearchIndex, SearchMap } from "@/lib/search/config";

export type Embedder = (text: string) => Promise<ReadonlyArray<number>>;

class SearchAssetLoadError extends Error {
  constructor(asset: string, status: number) {
    super(`${asset} request failed with status ${status}`);
    this.name = "SearchAssetLoadError";
  }
}

/* Module-level singletons: the palette, the embedding map, and anything else
   share ONE model instance and ONE copy of each fetched asset per session. */
let indexPromise: Promise<SearchIndex> | null = null;
let mapPromise: Promise<SearchMap> | null = null;
let embedderPromise: Promise<Embedder> | null = null;

export function loadIndex(): Promise<SearchIndex> {
  indexPromise ??= fetch(SEARCH_INDEX_PATH).then((response) => {
    if (!response.ok) {
      indexPromise = null;
      throw new SearchAssetLoadError("search index", response.status);
    }
    return response.json() as Promise<SearchIndex>;
  });
  return indexPromise;
}

export function loadMap(): Promise<SearchMap> {
  mapPromise ??= fetch(SEARCH_MAP_PATH).then((response) => {
    if (!response.ok) {
      mapPromise = null;
      throw new SearchAssetLoadError("search map", response.status);
    }
    return response.json() as Promise<SearchMap>;
  });
  return mapPromise;
}

export function loadEmbedder(): Promise<Embedder> {
  embedderPromise ??= (async (): Promise<Embedder> => {
    try {
      const { env, pipeline } = await import("@huggingface/transformers");
      env.allowLocalModels = false;
      const extractor = await pipeline("feature-extraction", SEARCH_MODEL_ID, {
        dtype: EMBEDDING_DTYPE,
      });
      return async (text: string): Promise<ReadonlyArray<number>> => {
        const output = await extractor(text, {
          pooling: "mean",
          normalize: true,
        });
        return Array.from(output.data as Float32Array);
      };
    } catch (error) {
      embedderPromise = null;
      throw error;
    }
  })();
  return embedderPromise;
}

/** Both vectors are normalized, so the dot product IS the cosine similarity. */
export function dot(
  a: ReadonlyArray<number>,
  b: ReadonlyArray<number>,
): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    sum += a[i] * b[i];
  }
  return sum;
}
