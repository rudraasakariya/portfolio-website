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
  SEARCH_MAP_PATH,
  SEARCH_MODEL_ID,
} from "@/lib/search/config";
import type {
  IndexedChunk,
  SearchIndex,
  SearchMap,
  SearchMapPoint,
} from "@/lib/search/config";

const OUTPUT_FILE = path.join(process.cwd(), "public", SEARCH_INDEX_PATH);
const MAP_OUTPUT_FILE = path.join(process.cwd(), "public", SEARCH_MAP_PATH);
const VECTOR_PRECISION = 1e4;
const POWER_ITERATIONS = 60;

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


async function readExistingMap(): Promise<SearchMap | null> {
  try {
    return JSON.parse(await readFile(MAP_OUTPUT_FILE, "utf8")) as SearchMap;
  } catch {
    return null;
  }
}

function round4(value: number): number {
  return Math.round(value * VECTOR_PRECISION) / VECTOR_PRECISION;
}

function normalizeVec(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

/** Top principal component of centered rows via power iteration. */
function principalComponent(rows: ReadonlyArray<ReadonlyArray<number>>): number[] {
  const dims = rows[0].length;
  let v = normalizeVec(new Array<number>(dims).fill(1));
  for (let iter = 0; iter < POWER_ITERATIONS; iter += 1) {
    const next = new Array<number>(dims).fill(0);
    for (const row of rows) {
      let score = 0;
      for (let d = 0; d < dims; d += 1) {
        score += row[d] * v[d];
      }
      for (let d = 0; d < dims; d += 1) {
        next[d] += score * row[d];
      }
    }
    v = normalizeVec(next);
  }
  return v;
}

/** 2D PCA map of the index — deterministic, no dependencies. */
function buildSearchMap(index: SearchIndex): SearchMap {
  const dims = index.dims;
  const vectors = index.chunks.map((chunk) => chunk.vec as number[]);
  const mean = new Array<number>(dims).fill(0);
  for (const vec of vectors) {
    for (let d = 0; d < dims; d += 1) {
      mean[d] += vec[d] / vectors.length;
    }
  }
  const centered = vectors.map((vec) => vec.map((v, d) => v - mean[d]));

  const first = principalComponent(centered);
  const deflated = centered.map((row) => {
    let score = 0;
    for (let d = 0; d < dims; d += 1) {
      score += row[d] * first[d];
    }
    return row.map((v, d) => v - score * first[d]);
  });
  const second = principalComponent(deflated);

  const raw = centered.map((row) => {
    let x = 0;
    let y = 0;
    for (let d = 0; d < dims; d += 1) {
      x += row[d] * first[d];
      y += row[d] * second[d];
    }
    return { x, y };
  });
  const xs = raw.map((p) => p.x);
  const ys = raw.map((p) => p.y);
  const range: SearchMap["range"] = {
    x: [round4(Math.min(...xs)), round4(Math.max(...xs))],
    y: [round4(Math.min(...ys)), round4(Math.max(...ys))],
  };
  const spanX = range.x[1] - range.x[0] || 1;
  const spanY = range.y[1] - range.y[0] || 1;

  const points: SearchMapPoint[] = index.chunks.map((chunk, i) => ({
    id: chunk.id,
    label: chunk.label,
    x: round4((raw[i].x - range.x[0]) / spanX),
    y: round4((raw[i].y - range.y[0]) / spanY),
    route: chunk.route,
    anchor: chunk.anchor,
  }));

  return {
    contentHash: index.contentHash,
    mean: mean.map(round4),
    components: [first.map(round4), second.map(round4)],
    range,
    points,
  };
}

async function writeMapIfStale(index: SearchIndex): Promise<void> {
  const existing = await readExistingMap();
  if (existing !== null && existing.contentHash === index.contentHash) {
    console.info("search map up to date — skipping PCA");
    return;
  }
  const map = buildSearchMap(index);
  await writeFile(MAP_OUTPUT_FILE, `${JSON.stringify(map)}\n`, "utf8");
  console.info(`wrote ${MAP_OUTPUT_FILE} (${map.points.length} points)`);
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
    await writeMapIfStale(existing);
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
  await writeMapIfStale(index);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
