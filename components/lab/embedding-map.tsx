"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { EMBEDDING_MAP } from "@/lib/content/lab";
import { dot, loadEmbedder, loadIndex, loadMap } from "@/lib/search/client";
import type { SearchIndex, SearchMap, SearchMapPoint } from "@/lib/search/config";
import { soundManager } from "@/lib/sound-manager";
import { useAnchorJump } from "@/lib/use-anchor-jump";

const EMBED_DEBOUNCE_MS = 150;
const NEIGHBOR_COUNT = 3;

/* Plot geometry in viewBox units. */
const VIEW_W = 640;
const VIEW_H = 400;
const PLOT_PAD = 44;

const QUERY_SPRING = { type: "spring", stiffness: 170, damping: 22 } as const;

type MapStatus = "idle" | "warming" | "ready" | "offline";

interface QueryPlacement {
  x: number;
  y: number;
  neighborIds: ReadonlyArray<string>;
}

function toPlotX(normalized: number): number {
  return PLOT_PAD + normalized * (VIEW_W - PLOT_PAD * 2);
}

function toPlotY(normalized: number): number {
  /* Flip so "up" reads as positive — SVG y grows downward. */
  return VIEW_H - PLOT_PAD - normalized * (VIEW_H - PLOT_PAD * 2);
}

/** Project a raw embedding into the map's normalized 2D space. */
function projectQuery(
  vec: ReadonlyArray<number>,
  map: SearchMap,
): { x: number; y: number } {
  let x = 0;
  let y = 0;
  for (let d = 0; d < vec.length; d += 1) {
    const centered = vec[d] - map.mean[d];
    x += centered * map.components[0][d];
    y += centered * map.components[1][d];
  }
  const spanX = map.range.x[1] - map.range.x[0] || 1;
  const spanY = map.range.y[1] - map.range.y[0] || 1;
  const clamp = (v: number): number => Math.min(1.04, Math.max(-0.04, v));
  return {
    x: clamp((x - map.range.x[0]) / spanX),
    y: clamp((y - map.range.y[0]) / spanY),
  };
}

function nearestNeighbors(
  queryVec: ReadonlyArray<number>,
  index: SearchIndex,
): ReadonlyArray<string> {
  return index.chunks
    .map((chunk) => ({ id: chunk.id, score: dot(queryVec, chunk.vec) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, NEIGHBOR_COUNT)
    .map((scored) => scored.id);
}

export function EmbeddingMap(): React.JSX.Element {
  const jump = useAnchorJump();
  const [map, setMap] = useState<SearchMap | null>(null);
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [status, setStatus] = useState<MapStatus>("idle");
  const [query, setQuery] = useState("");
  const [placement, setPlacement] = useState<QueryPlacement | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadMap()
      .then((loaded) => {
        if (!cancelled) {
          setMap(loaded);
        }
      })
      .catch(() => {
        /* Map missing — the section renders its frame without points. */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const warmUp = (): void => {
    if (status !== "idle") {
      return;
    }
    setStatus("warming");
    void loadIndex()
      .then((loaded) => setIndex(loaded))
      .catch(() => setIndex(null));
    loadEmbedder()
      .then(() => setStatus("ready"))
      .catch(() => setStatus("offline"));
  };

  useEffect(() => {
    if (status !== "ready" || map === null || index === null) {
      return;
    }
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }
    const timer = window.setTimeout(() => {
      void (async (): Promise<void> => {
        try {
          const embed = await loadEmbedder();
          const vec = await embed(trimmed);
          const spot = projectQuery(vec, map);
          setPlacement({
            ...spot,
            neighborIds: nearestNeighbors(vec, index),
          });
          soundManager.play("tick");
        } catch {
          /* Model died mid-session — the last placement stays visible. */
        }
      })();
    }, EMBED_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query, status, map, index]);

  const showPlacement = query.trim().length >= 2 ? placement : null;

  const neighborSet = useMemo(
    () => new Set(showPlacement?.neighborIds ?? []),
    [showPlacement],
  );

  /* Neighbors can be sibling chunks with identical labels sitting almost on
     top of each other — draw such a label once. */
  const labelledNeighborIds = useMemo(() => {
    if (map === null) {
      return new Set<string>();
    }
    const kept: Array<{ id: string; label: string; x: number; y: number }> = [];
    for (const point of map.points) {
      if (!neighborSet.has(point.id)) {
        continue;
      }
      const duplicate = kept.some(
        (placed) =>
          placed.label === point.label &&
          Math.abs(placed.x - point.x) < 0.45 &&
          Math.abs(placed.y - point.y) < 0.14,
      );
      if (!duplicate) {
        kept.push({ id: point.id, label: point.label, x: point.x, y: point.y });
      }
    }
    return new Set(kept.map((placed) => placed.id));
  }, [map, neighborSet]);

  const handlePointClick = (point: SearchMapPoint): void => {
    soundManager.play("tick");
    jump(point.route, point.anchor);
  };

  const statusLabel =
    status === "ready" ? EMBEDDING_MAP.readyLabel : EMBEDDING_MAP.warmingLabel;

  return (
    <div className="lab-frame">
      <div className="em-head">
        <input
          className="em-input"
          placeholder={EMBEDDING_MAP.placeholder}
          value={query}
          onFocus={warmUp}
          onChange={(event) => {
            warmUp();
            setQuery(event.target.value);
          }}
          aria-label="Embed a query into the map"
        />
        {(status === "warming" || status === "ready") && (
          <span className="palette-status" data-mode={status === "ready" ? "semantic" : "warming"}>
            {statusLabel}
          </span>
        )}
      </div>
      {status === "offline" && (
        <p className="em-offline">{EMBEDDING_MAP.offlineNote}</p>
      )}

      <svg
        className="em-svg"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label="2D map of every content embedding on this site"
      >
        {map?.points.map((point, pointIndex) => {
          const cx = toPlotX(point.x);
          const cy = toPlotY(point.y);
          const highlighted = neighborSet.has(point.id);
          const labelled =
            (highlighted && labelledNeighborIds.has(point.id)) ||
            hoveredId === point.id;
          /* Alternate label sides so clustered neighbors don't collide. */
          const labelY = pointIndex % 2 === 0 ? cy - 12 : cy + 22;
          return (
            <g
              key={point.id}
              className={`em-point ${highlighted ? "lit" : ""}`}
              onPointerEnter={() => {
                setHoveredId(point.id);
                soundManager.play("hover");
              }}
              onPointerLeave={() =>
                setHoveredId((current) => (current === point.id ? null : current))
              }
              onClick={() => handlePointClick(point)}
            >
              {/* Generous invisible hit area — the visible dot is small. */}
              <circle className="em-hit" cx={cx} cy={cy} r={13} />
              <circle className="em-dot" cx={cx} cy={cy} r={highlighted ? 6.5 : 4.5} />
              {labelled && (
                <text
                  className="em-label"
                  x={cx}
                  y={labelY}
                  textAnchor="middle"
                >
                  {point.label}
                </text>
              )}
            </g>
          );
        })}

        {showPlacement !== null && map !== null && (
          <g>
            {showPlacement.neighborIds.map((id) => {
              const neighbor = map.points.find((point) => point.id === id);
              if (neighbor === undefined) {
                return null;
              }
              return (
                <motion.line
                  key={id}
                  className="em-link"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    x1: toPlotX(showPlacement.x),
                    y1: toPlotY(showPlacement.y),
                  }}
                  transition={QUERY_SPRING}
                  x2={toPlotX(neighbor.x)}
                  y2={toPlotY(neighbor.y)}
                />
              );
            })}
            <motion.g
              className="em-query"
              initial={false}
              animate={{
                x: toPlotX(showPlacement.x),
                y: toPlotY(showPlacement.y),
              }}
              transition={QUERY_SPRING}
            >
              <circle className="em-query-halo" r={13} />
              <circle className="em-query-core" r={6} />
              <text className="em-label em-query-label" y={-18} textAnchor="middle">
                {EMBEDDING_MAP.queryLabel}
              </text>
            </motion.g>
          </g>
        )}
      </svg>
    </div>
  );
}
