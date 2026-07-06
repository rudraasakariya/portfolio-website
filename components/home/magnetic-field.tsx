"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { soundManager } from "@/lib/sound-manager";

/** Logical canvas — matches the frame's 1 : 1.05 aspect ratio. */
const VIEW_W = 420;
const VIEW_H = 441;

const FIELD_STORAGE_KEY = "rs-portfolio-field";

interface FieldConfig {
  /** Grid pitch in viewBox units — smaller is denser. */
  spacing: number;
  /** 0–1: how strongly dashes align to the cursor. */
  magnetism: number;
  /** 0–1: ambient flow speed. */
  flow: number;
}

const DEFAULT_CONFIG: FieldConfig = { spacing: 26, magnetism: 0.65, flow: 0.5 };

interface Ripple {
  x: number;
  y: number;
  startedAt: number;
}

interface DashNode {
  el: SVGLineElement;
  x: number;
  y: number;
}

function loadConfig(): FieldConfig {
  if (typeof window === "undefined") {
    return DEFAULT_CONFIG;
  }
  try {
    const raw = localStorage.getItem(FIELD_STORAGE_KEY);
    if (raw === null) {
      return DEFAULT_CONFIG;
    }
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "spacing" in parsed &&
      "magnetism" in parsed &&
      "flow" in parsed &&
      typeof parsed.spacing === "number" &&
      typeof parsed.magnetism === "number" &&
      typeof parsed.flow === "number"
    ) {
      return {
        spacing: Math.min(36, Math.max(18, parsed.spacing)),
        magnetism: Math.min(1, Math.max(0, parsed.magnetism)),
        flow: Math.min(1, Math.max(0, parsed.flow)),
      };
    }
  } catch {
    // Corrupt or unavailable storage — fall through to defaults.
  }
  return DEFAULT_CONFIG;
}

function saveConfig(config: FieldConfig): void {
  try {
    localStorage.setItem(FIELD_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Preference just won't persist.
  }
}

/**
 * Tiny external store bound via useSyncExternalStore: hydration-safe (server
 * snapshot is the default config) and readable from the rAF loop without
 * re-subscribing effects on every slider move.
 */
let storeConfig: FieldConfig | null = null;
const storeListeners = new Set<() => void>();

const fieldStore = {
  subscribe(listener: () => void): () => void {
    storeListeners.add(listener);
    return () => storeListeners.delete(listener);
  },
  getSnapshot(): FieldConfig {
    storeConfig ??= loadConfig();
    return storeConfig;
  },
  getServerSnapshot(): FieldConfig {
    return DEFAULT_CONFIG;
  },
  update(partial: Partial<FieldConfig>): void {
    storeConfig = { ...fieldStore.getSnapshot(), ...partial };
    saveConfig(storeConfig);
    storeListeners.forEach((listener) => listener());
  },
};

/** Panel visibility survives route changes (module-level, session only). */
let lastPanelOpen = false;

/** Interpolate between angles along the shortest arc. */
function lerpAngle(from: number, to: number, t: number): number {
  const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + delta * t;
}

export function MagneticField(): React.JSX.Element {
  const config = useSyncExternalStore(
    fieldStore.subscribe,
    fieldStore.getSnapshot,
    fieldStore.getServerSnapshot,
  );
  const [panelOpen, setPanelOpenState] = useState(() => lastPanelOpen);

  const setPanelOpen = (open: boolean): void => {
    lastPanelOpen = open;
    setPanelOpenState(open);
  };

  const svgRef = useRef<SVGSVGElement>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const ripplesRef = useRef<Ripple[]>([]);

  const points = useMemo(() => {
    const cols = Math.ceil(VIEW_W / config.spacing);
    const rows = Math.ceil(VIEW_H / config.spacing);
    const offsetX = (VIEW_W - (cols - 1) * config.spacing) / 2;
    const offsetY = (VIEW_H - (rows - 1) * config.spacing) / 2;
    const result: Array<{ x: number; y: number }> = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        result.push({
          x: offsetX + col * config.spacing,
          y: offsetY + row * config.spacing,
        });
      }
    }
    return result;
  }, [config.spacing]);

  useEffect(() => {
    const svg = svgRef.current;
    if (svg === null) {
      return;
    }

    const nodes: DashNode[] = [];
    svg.querySelectorAll<SVGLineElement>("line[data-fd]").forEach((el) => {
      nodes.push({
        el,
        x: Number(el.dataset.x),
        y: Number(el.dataset.y),
      });
    });

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      // Static, calm diagonal field — no animation loop at all.
      for (const node of nodes) {
        node.el.setAttribute(
          "transform",
          `translate(${node.x} ${node.y}) rotate(45)`,
        );
        node.el.setAttribute("stroke-opacity", "0.35");
      }
      return;
    }

    let frame = 0;
    let running = false;

    const tick = (now: number): void => {
      // Hold still during the theme wipe — per-frame SVG churn competes with
      // the view transition for raster time and causes tile flashes.
      if (document.documentElement.classList.contains("theme-switching")) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const { magnetism, flow, spacing } = fieldStore.getSnapshot();
      const t = now / 1000;
      const pointer = pointerRef.current;
      const ripples = ripplesRef.current;
      const reach = 80 + magnetism * 130;

      for (const node of nodes) {
        let angle =
          (Math.sin(node.x * 0.016 + t * flow * 1.7) +
            Math.cos(node.y * 0.014 - t * flow * 1.25)) *
          0.9;
        let intensity = 0;

        if (pointer !== null) {
          const dx = pointer.x - node.x;
          const dy = pointer.y - node.y;
          const dist = Math.hypot(dx, dy);
          const falloff = Math.max(0, 1 - dist / reach);
          const mix = Math.min(1, falloff * falloff * (0.5 + magnetism));
          if (mix > 0) {
            angle = lerpAngle(angle, Math.atan2(dy, dx), mix);
            intensity = Math.max(intensity, mix);
          }
        }

        for (const ripple of ripples) {
          const age = (now - ripple.startedAt) / 1000;
          const radius = age * 300;
          const dist = Math.hypot(ripple.x - node.x, ripple.y - node.y);
          const band = Math.exp(-((dist - radius) ** 2) / (2 * 26 * 26));
          if (band > 0.01) {
            angle += band * Math.sin(age * 9) * 0.9 * (1 - age / 1.4);
            intensity = Math.max(intensity, band * (1 - age / 1.4));
          }
        }

        const degrees = (angle * 180) / Math.PI;
        const scale = 1 + intensity * 0.35;
        node.el.setAttribute(
          "transform",
          `translate(${node.x} ${node.y}) rotate(${degrees.toFixed(1)}) scale(${scale.toFixed(2)})`,
        );
        node.el.setAttribute(
          "stroke-opacity",
          (0.22 + intensity * 0.78).toFixed(2),
        );
        // Slightly longer dashes when the grid is sparser.
        void spacing;
      }

      ripplesRef.current = ripples.filter((r) => now - r.startedAt < 1400);
      frame = requestAnimationFrame(tick);
    };

    const start = (): void => {
      if (!running) {
        running = true;
        frame = requestAnimationFrame(tick);
      }
    };
    const stop = (): void => {
      running = false;
      cancelAnimationFrame(frame);
    };

    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0.05 },
    );
    observer.observe(svg);

    const onVisibility = (): void => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [points]);

  const toViewCoords = (
    event: React.PointerEvent<SVGSVGElement>,
  ): { x: number; y: number } => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * VIEW_W,
      y: ((event.clientY - rect.top) / rect.height) * VIEW_H,
    };
  };

  const updateConfig = (partial: Partial<FieldConfig>): void => {
    fieldStore.update(partial);
  };

  const randomize = (): void => {
    soundManager.play("tick");
    updateConfig({
      spacing: 18 + Math.round(Math.random() * 18),
      magnetism: Math.round(Math.random() * 100) / 100,
      flow: Math.round(Math.random() * 100) / 100,
    });
  };

  const reset = (): void => {
    soundManager.play("tick");
    updateConfig(DEFAULT_CONFIG);
  };

  const dashLength = config.spacing * 0.5;

  return (
    <div className="absolute inset-0">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        preserveAspectRatio="none"
        className="h-full w-full cursor-crosshair"
        role="img"
        aria-label="Interactive magnetic field art — dashes align to your cursor"
        onPointerMove={(event) => {
          pointerRef.current = toViewCoords(event);
        }}
        onPointerLeave={() => {
          pointerRef.current = null;
        }}
        onPointerDown={(event) => {
          ripplesRef.current = [
            ...ripplesRef.current.slice(-3),
            { ...toViewCoords(event), startedAt: performance.now() },
          ];
          soundManager.play("pluck");
        }}
      >
        {points.map((point) => (
          <line
            key={`${point.x}-${point.y}`}
            data-fd
            data-x={point.x}
            data-y={point.y}
            x1={-dashLength / 2}
            y1={0}
            x2={dashLength / 2}
            y2={0}
            transform={`translate(${point.x} ${point.y}) rotate(45)`}
            stroke="var(--accent)"
            strokeOpacity={0.25}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
        ))}
      </svg>

      <button
        type="button"
        aria-label={panelOpen ? "Close field settings" : "Open field settings"}
        aria-expanded={panelOpen}
        className="field-gear"
        data-open={panelOpen}
        onClick={() => {
          soundManager.play("tick");
          setPanelOpen(!panelOpen);
        }}
        onPointerEnter={() => soundManager.play("hover")}
      >
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path
            d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm8-.6-1.8-.5a6.6 6.6 0 0 0-.6-1.4l.9-1.6-1.9-1.9-1.6.9c-.5-.3-.9-.5-1.4-.6L13 1h-2l-.5 1.8c-.5.1-1 .3-1.4.6l-1.6-.9-1.9 1.9.9 1.6c-.3.4-.5.9-.6 1.4L4 7.9v2.2l1.8.5c.1.5.3 1 .6 1.4l-.9 1.6 1.9 1.9 1.6-.9c.4.3.9.5 1.4.6L11 17h2l.5-1.8c.5-.1 1-.3 1.4-.6l1.6.9 1.9-1.9-.9-1.6c.3-.4.5-.9.6-1.4l1.8-.5V7.9z"
            fill="currentColor"
            transform="translate(0 3)"
          />
        </svg>
      </button>

      {panelOpen && (
        <div className="field-panel">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[11px] font-semibold tracking-[0.08em] text-(--text-primary) uppercase">
              Field configurator
            </span>
            <button
              type="button"
              aria-label="Close field settings"
              className="cursor-pointer border-none bg-transparent p-0 font-mono text-[13px] text-(--text-muted)"
              onClick={() => {
                soundManager.play("tick");
                setPanelOpen(false);
              }}
            >
              ✕
            </button>
          </div>

          <label className="field-control">
            <span>Density</span>
            <input
              type="range"
              min={18}
              max={36}
              step={1}
              // Inverted so dragging right = denser, which feels natural.
              value={54 - config.spacing}
              onChange={(event) =>
                updateConfig({ spacing: 54 - Number(event.target.value) })
              }
              onPointerUp={() => soundManager.play("tick")}
            />
          </label>
          <label className="field-control">
            <span>Magnetism</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={config.magnetism}
              onChange={(event) =>
                updateConfig({ magnetism: Number(event.target.value) })
              }
              onPointerUp={() => soundManager.play("tick")}
            />
          </label>
          <label className="field-control">
            <span>Flow</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={config.flow}
              onChange={(event) => updateConfig({ flow: Number(event.target.value) })}
              onPointerUp={() => soundManager.play("tick")}
            />
          </label>

          <div className="mt-3 flex gap-2">
            <button type="button" className="field-action" onClick={randomize}>
              Random
            </button>
            <button type="button" className="field-action" onClick={reset}>
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
