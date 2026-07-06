"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { SearchChunk } from "@/lib/search/chunks";
import {
  EMBEDDING_DTYPE,
  OPEN_SEARCH_EVENT,
  SEARCH_INDEX_PATH,
  SEARCH_MODEL_ID,
} from "@/lib/search/config";
import type { IndexedChunk, SearchIndex } from "@/lib/search/config";
import { soundManager } from "@/lib/sound-manager";
import { useAnchorJump } from "@/lib/use-anchor-jump";

const RESULT_LIMIT = 8;
const EMBED_DEBOUNCE_MS = 120;
/** Semantic similarity dominates; keywords give exact matches a nudge. */
const SEMANTIC_WEIGHT = 0.85;
const KEYWORD_WEIGHT = 0.15;
/** Blended score below which a semantic match is noise, not a result. */
const MIN_SEMANTIC_SCORE = 0.18;

type SearchMode = "keyword" | "warming" | "semantic";

const MODE_LABELS: Record<SearchMode, string> = {
  keyword: "keyword mode",
  warming: "warming up…",
  semantic: "semantic ready",
};

const PLACEHOLDER = "Ask my portfolio…";
const HINT = "Try “auth”, “testing”, “clipboard sync”, or “Rutgers”.";
const EMPTY_MESSAGE = "No matches — try different words.";

class SearchIndexLoadError extends Error {
  constructor(status: number) {
    super(`search index request failed with status ${status}`);
    this.name = "SearchIndexLoadError";
  }
}

interface ScoredChunk {
  chunk: IndexedChunk;
  score: number;
}

interface SemanticResults {
  query: string;
  results: ReadonlyArray<ScoredChunk>;
}

type Embedder = (text: string) => Promise<ReadonlyArray<number>>;

/* Both caches live at module level so the index and model survive route
   changes and palette close/open cycles. */
let indexPromise: Promise<SearchIndex> | null = null;
let embedderPromise: Promise<Embedder> | null = null;

function loadIndex(): Promise<SearchIndex> {
  indexPromise ??= fetch(SEARCH_INDEX_PATH).then((response) => {
    if (!response.ok) {
      indexPromise = null;
      throw new SearchIndexLoadError(response.status);
    }
    return response.json() as Promise<SearchIndex>;
  });
  return indexPromise;
}

function loadEmbedder(): Promise<Embedder> {
  embedderPromise ??= (async (): Promise<Embedder> => {
    try {
      const { env, pipeline } = await import("@huggingface/transformers");
      env.allowLocalModels = false;
      const extractor = await pipeline("feature-extraction", SEARCH_MODEL_ID, {
        dtype: EMBEDDING_DTYPE,
      });
      return async (text: string): Promise<ReadonlyArray<number>> => {
        const output = await extractor(text, { pooling: "mean", normalize: true });
        return Array.from(output.data as Float32Array);
      };
    } catch (error) {
      embedderPromise = null;
      throw error;
    }
  })();
  return embedderPromise;
}

function tokenize(query: string): ReadonlyArray<string> {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

function keywordScore(
  tokens: ReadonlyArray<string>,
  chunk: SearchChunk,
): number {
  if (tokens.length === 0) {
    return 0;
  }
  const haystack = `${chunk.label} ${chunk.text}`.toLowerCase();
  let hits = 0;
  for (const token of tokens) {
    if (haystack.includes(token)) {
      hits += 1;
    }
  }
  return hits / tokens.length;
}

/** Both vectors are normalized, so the dot product IS the cosine similarity. */
function dot(a: ReadonlyArray<number>, b: ReadonlyArray<number>): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    sum += a[i] * b[i];
  }
  return sum;
}

export function CommandPalette(): React.JSX.Element {
  const jump = useAnchorJump();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [mode, setMode] = useState<SearchMode>("keyword");
  const [semantic, setSemantic] = useState<SemanticResults | null>(null);

  const openPalette = useCallback((): void => {
    soundManager.play("tick");
    setOpen(true);
    setQuery("");
    setActiveIndex(0);
    setSemantic(null);
    void loadIndex()
      .then((loaded) => setIndex(loaded))
      .catch(() => setIndex(null));
    setMode((current) => (current === "semantic" ? current : "warming"));
    loadEmbedder()
      .then(() => setMode("semantic"))
      .catch(() => setMode("keyword"));
  }, []);

  const closePalette = useCallback((): void => {
    soundManager.play("tick");
    setOpen(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (open) {
          closePalette();
        } else {
          openPalette();
        }
      } else if (event.key === "Escape" && open) {
        closePalette();
      }
    };
    const onOpenEvent = (): void => {
      if (!open) {
        openPalette();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener(OPEN_SEARCH_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(OPEN_SEARCH_EVENT, onOpenEvent);
    };
  }, [open, openPalette, closePalette]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const tokens = useMemo(() => tokenize(query), [query]);

  const keywordResults = useMemo((): ReadonlyArray<ScoredChunk> => {
    if (index === null || tokens.length === 0) {
      return [];
    }
    return index.chunks
      .map((chunk) => ({ chunk, score: keywordScore(tokens, chunk) }))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, RESULT_LIMIT);
  }, [index, tokens]);

  useEffect(() => {
    if (!open || mode !== "semantic" || index === null || tokens.length === 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      void (async (): Promise<void> => {
        try {
          const embed = await loadEmbedder();
          const queryVec = await embed(query);
          const results = index.chunks
            .map((chunk) => ({
              chunk,
              score:
                SEMANTIC_WEIGHT * dot(queryVec, chunk.vec) +
                KEYWORD_WEIGHT * keywordScore(tokens, chunk),
            }))
            .filter((result) => result.score >= MIN_SEMANTIC_SCORE)
            .sort((a, b) => b.score - a.score)
            .slice(0, RESULT_LIMIT);
          setSemantic({ query, results });
        } catch {
          // Model died mid-session — keyword results keep rendering.
        }
      })();
    }, EMBED_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [open, mode, index, query, tokens]);

  const results =
    semantic !== null && semantic.query === query
      ? semantic.results
      : keywordResults;
  const clampedActive =
    results.length === 0 ? 0 : Math.min(activeIndex, results.length - 1);

  const handleSelect = (chunk: SearchChunk): void => {
    soundManager.play("tick");
    setOpen(false);
    // Bare route + programmatic scroll — no #id in the URL bar.
    jump(chunk.route, chunk.anchor);
  };

  const onInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ): void => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex(
        results.length === 0
          ? 0
          : Math.min(clampedActive + 1, results.length - 1),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex(Math.max(clampedActive - 1, 0));
    } else if (event.key === "Enter") {
      const selected = results[clampedActive];
      if (selected !== undefined) {
        handleSelect(selected.chunk);
      }
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="palette-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={closePalette}
        >
          <motion.div
            className="palette-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Search my portfolio"
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 480, damping: 36 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="palette-head">
              <input
                autoFocus
                className="palette-input"
                placeholder={PLACEHOLDER}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={onInputKeyDown}
                aria-label="Search my portfolio"
              />
              <span className="palette-status" data-mode={mode}>
                {MODE_LABELS[mode]}
              </span>
            </div>
            {query.trim().length > 0 ? (
              <ul className="palette-list" role="listbox" aria-label="Search results">
                {results.length === 0 ? (
                  <li className="palette-empty">{EMPTY_MESSAGE}</li>
                ) : (
                  results.map((result, i) => (
                    <li key={result.chunk.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={i === clampedActive}
                        className={`palette-item ${i === clampedActive ? "active" : ""}`}
                        onClick={() => handleSelect(result.chunk)}
                        onPointerEnter={() => setActiveIndex(i)}
                      >
                        <span className="palette-item-label">
                          {result.chunk.label}
                        </span>
                        <span className="palette-item-text">
                          {result.chunk.text}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            ) : (
              <div className="palette-hint">{HINT}</div>
            )}
            <div className="palette-foot">
              <span>↑↓ navigate</span>
              <span>↵ open</span>
              <span>esc close</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
