"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { SearchChunk } from "@/lib/search/chunks";
import { dot, loadEmbedder, loadIndex } from "@/lib/search/client";
import { OPEN_SEARCH_EVENT } from "@/lib/search/config";
import type { IndexedChunk, SearchIndex } from "@/lib/search/config";
import { soundManager } from "@/lib/sound-manager";
import { useAnchorJump } from "@/lib/use-anchor-jump";

const RESULT_LIMIT = 8;
const EMBED_DEBOUNCE_MS = 120;
/** Semantic similarity dominates; keywords give exact matches a nudge. */
const SEMANTIC_WEIGHT = 0.85;
const KEYWORD_WEIGHT = 0.15;
/** Blended score below which a semantic match is noise, not a result.
    Measured: junk queries ("AI") top out ≈0.16 blended, real matches ≥0.26. */
const MIN_SEMANTIC_SCORE = 0.22;

type SearchMode = "keyword" | "warming" | "semantic";

const MODE_LABELS: Record<SearchMode, string> = {
  keyword: "keyword mode",
  warming: "warming up…",
  semantic: "semantic ready",
};

const PLACEHOLDER = "Ask my portfolio…";
const SUGGESTIONS = ["auth", "Docker", "clipboard sync", "Rutgers"] as const;
const EMPTY_MESSAGE = "No matches — try different words.";

interface ScoredChunk {
  chunk: IndexedChunk;
  score: number;
}

interface SemanticResults {
  query: string;
  results: ReadonlyArray<ScoredChunk>;
}

function tokenize(query: string): ReadonlyArray<string> {
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 1);
}

const WORD_SPLIT = /[^a-z0-9]+/;

/** Tokens must match at word starts — substring matching let "ai" hit words
    like "main" and surface projects with no AI in them at all. */
function keywordScore(
  tokens: ReadonlyArray<string>,
  chunk: SearchChunk,
): number {
  if (tokens.length === 0) {
    return 0;
  }
  const words = `${chunk.label} ${chunk.text}`.toLowerCase().split(WORD_SPLIT);
  let hits = 0;
  for (const token of tokens) {
    if (words.some((word) => word.startsWith(token))) {
      hits += 1;
    }
  }
  return hits / tokens.length;
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
              <svg
                className="palette-glass"
                viewBox="0 0 24 24"
                width="15"
                height="15"
                aria-hidden="true"
              >
                <circle
                  cx="10.5"
                  cy="10.5"
                  r="5.75"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="14.9"
                  y1="14.9"
                  x2="19.6"
                  y2="19.6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
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
              <div className="palette-hint">
                <div className="palette-eyebrow">Try asking</div>
                <div className="palette-suggestions">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="palette-suggestion"
                      // Keep focus in the input so typing continues seamlessly.
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() => {
                        soundManager.play("tick");
                        setQuery(suggestion);
                        setActiveIndex(0);
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="palette-foot">
              <span>
                <kbd className="palette-key">↑↓</kbd> navigate
              </span>
              <span>
                <kbd className="palette-key">↵</kbd> open
              </span>
              <span>
                <kbd className="palette-key">esc</kbd> close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
