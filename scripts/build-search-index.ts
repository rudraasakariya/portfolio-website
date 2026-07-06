/**
 * Embeds every search chunk and writes public/search-index.json, which is
 * committed (lockfile-style) so CI and Vercel builds never touch the model.
 * Runs as "prebuild"; skips embedding when the content hash is unchanged.
 *
 * Run directly with: npx tsx scripts/build-search-index.ts
 */
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildChunks } from "@/lib/search/chunks";
import {
  EMBEDDING_DIMS,
  EMBEDDING_DTYPE,
  SEARCH_INDEX_PATH,
  SEARCH_MODEL_ID,
} from "@/lib/search/config";
import type { IndexedChunk, SearchIndex } from "@/lib/search/config";

const OUTPUT_FILE = path.join(process.cwd(), "public", SEARCH_INDEX_PATH);
const VECTOR_PRECISION = 1e4;

class SearchIndexBuildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SearchIndexBuildError";
  }
}

async function readExistingIndex(): Promise<SearchIndex | null> {
  try {
    return JSON.parse(await readFile(OUTPUT_FILE, "utf8")) as SearchIndex;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  const chunks = buildChunks();
  const contentHash = createHash("sha256")
    .update(
      JSON.stringify({ model: SEARCH_MODEL_ID, dtype: EMBEDDING_DTYPE, chunks }),
    )
    .digest("hex");

  const existing = await readExistingIndex();
  if (existing !== null && existing.contentHash === contentHash) {
    console.info(
      `search index up to date (${chunks.length} chunks) — skipping embed`,
    );
    return;
  }

  console.info(
    `embedding ${chunks.length} chunks with ${SEARCH_MODEL_ID} (${EMBEDDING_DTYPE})…`,
  );
  const { pipeline } = await import("@huggingface/transformers");
  const extractor = await pipeline("feature-extraction", SEARCH_MODEL_ID, {
    dtype: EMBEDDING_DTYPE,
  });
  const output = await extractor(
    chunks.map((chunk) => chunk.text),
    { pooling: "mean", normalize: true },
  );
  const vectors = output.tolist() as number[][];

  if (vectors.length !== chunks.length) {
    throw new SearchIndexBuildError(
      `expected ${chunks.length} vectors, got ${vectors.length}`,
    );
  }
  if (vectors.some((vec) => vec.length !== EMBEDDING_DIMS)) {
    throw new SearchIndexBuildError(
      `model returned a vector that is not ${EMBEDDING_DIMS}-dimensional`,
    );
  }

  const indexedChunks: IndexedChunk[] = chunks.map((chunk, i) => ({
    ...chunk,
    vec: vectors[i].map((v) => Math.round(v * VECTOR_PRECISION) / VECTOR_PRECISION),
  }));
  const index: SearchIndex = {
    model: SEARCH_MODEL_ID,
    dims: EMBEDDING_DIMS,
    contentHash,
    chunks: indexedChunks,
  };

  await writeFile(OUTPUT_FILE, `${JSON.stringify(index)}\n`, "utf8");
  console.info(`wrote ${OUTPUT_FILE} (${chunks.length} chunks)`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
