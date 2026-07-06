"use client";

import { useEffect, useRef, useState } from "react";

import { RATE_LIMITER } from "@/lib/content/lab";
import { soundManager } from "@/lib/sound-manager";

/* Stage geometry in viewBox units. */
const VIEW_W = 640;
const VIEW_H = 240;
const LANE_Y = 104;
const GATE_X = 320;
const QUEUE_SPACING = 19;
const QUEUE_MAX = 10;
const DOT_POOL_SIZE = 64;
const DOT_RADIUS = 5;

const ARRIVE_SPEED = 130;
const DELIVER_SPEED = 170;
const DELIVER_ACCEL = 260;
const DROP_GRAVITY = 520;
const FADE_OUT_X = 570;

const COUNTER_UPDATE_MS = 250;
/** Delivered/s is measured over a sliding window. */
const RATE_WINDOW_MS = 3000;

const DEFAULTS = { arrival: 8, capacity: 6, refill: 5 } as const;
const SLIDER_RANGES = {
  arrival: { min: 1, max: 30 },
  capacity: { min: 1, max: 20 },
  refill: { min: 1, max: 20 },
} as const;

type DotState = "free" | "arriving" | "queued" | "delivered" | "dropped";

interface SimDot {
  state: DotState;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  slot: number;
}

interface SimConfig {
  arrival: number;
  capacity: number;
  refill: number;
}

interface Counters {
  deliveredPerSec: number;
  queued: number;
  droppedPct: number;
}

function createDot(): SimDot {
  return { state: "free", x: -20, y: LANE_Y, vx: 0, vy: 0, alpha: 0, slot: -1 };
}

export function RateLimiter(): React.JSX.Element {
  const [started, setStarted] = useState(false);
  const [config, setConfig] = useState<SimConfig>({ ...DEFAULTS });
  const [counters, setCounters] = useState<Counters>({
    deliveredPerSec: 0,
    queued: 0,
    droppedPct: 0,
  });
  const configRef = useRef<SimConfig>({ ...DEFAULTS });
  const svgRef = useRef<SVGSVGElement>(null);
  const dotRefs = useRef<Array<SVGCircleElement | null>>([]);
  const bucketFillRef = useRef<SVGRectElement>(null);

  const updateConfig = (partial: Partial<SimConfig>): void => {
    configRef.current = { ...configRef.current, ...partial };
    setConfig(configRef.current);
  };

  /* The whole simulation mounts only while running — idle costs nothing,
     and Stop tears everything down (a restart begins a fresh scene). */
  useEffect(() => {
    if (!started) {
      return;
    }
    const svg = svgRef.current;
    if (svg === null) {
      return;
    }
    const dotElements = dotRefs.current;
    /* Reduced motion: the sim still runs (counters stay live) but the DOM
       writes below are skipped, so the dot pool stays invisible. */
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");

    const dots: SimDot[] = Array.from({ length: DOT_POOL_SIZE }, createDot);
    const queue: SimDot[] = [];
    let tokens = configRef.current.capacity;
    let spawnAcc = 0;
    let totalSpawned = 0;
    let totalDropped = 0;
    const deliveredAt: number[] = [];

    let frame = 0;
    let running = false;
    let lastTime = 0;
    let lastCounterPush = 0;

    const takeFreeDot = (): SimDot | null =>
      dots.find((dot) => dot.state === "free") ?? null;

    const queueTailX = (): number => GATE_X - 26 - queue.length * QUEUE_SPACING;

    const admit = (dot: SimDot, now: number): void => {
      if (queue.length === 0 && tokens >= 1) {
        tokens -= 1;
        dot.state = "delivered";
        dot.vx = DELIVER_SPEED;
        deliveredAt.push(now);
      } else if (queue.length < QUEUE_MAX) {
        dot.state = "queued";
        dot.slot = queue.length;
        queue.push(dot);
      } else {
        dot.state = "dropped";
        dot.vy = 40;
        totalDropped += 1;
      }
    };

    const tick = (now: number): void => {
      const dt = Math.min(0.05, lastTime === 0 ? 0.016 : (now - lastTime) / 1000);
      lastTime = now;
      const { arrival, capacity, refill } = configRef.current;

      tokens = Math.min(capacity, tokens + refill * dt);

      spawnAcc += arrival * dt;
      while (spawnAcc >= 1) {
        spawnAcc -= 1;
        const dot = takeFreeDot();
        if (dot !== null) {
          dot.state = "arriving";
          dot.x = -10;
          dot.y = LANE_Y;
          dot.vx = ARRIVE_SPEED;
          dot.vy = 0;
          dot.alpha = 1;
          totalSpawned += 1;
        }
      }

      /* The queue head passes the gate whenever a token is available. */
      if (queue.length > 0 && tokens >= 1) {
        tokens -= 1;
        const head = queue.shift();
        if (head !== undefined) {
          head.state = "delivered";
          head.vx = DELIVER_SPEED;
          deliveredAt.push(now);
        }
        queue.forEach((dot, i) => {
          dot.slot = i;
        });
      }

      for (const dot of dots) {
        switch (dot.state) {
          case "arriving": {
            dot.x += dot.vx * dt;
            if (dot.x >= queueTailX()) {
              admit(dot, now);
            }
            break;
          }
          case "queued": {
            const target = GATE_X - 26 - dot.slot * QUEUE_SPACING;
            dot.x += (target - dot.x) * Math.min(1, dt * 10);
            break;
          }
          case "delivered": {
            dot.vx += DELIVER_ACCEL * dt;
            dot.x += dot.vx * dt;
            if (dot.x > FADE_OUT_X) {
              dot.alpha = Math.max(0, 1 - (dot.x - FADE_OUT_X) / 70);
            }
            if (dot.x > VIEW_W + 20) {
              dot.state = "free";
            }
            break;
          }
          case "dropped": {
            dot.vy += DROP_GRAVITY * dt;
            dot.y += dot.vy * dt;
            dot.x += 18 * dt;
            dot.alpha -= 1.6 * dt;
            if (dot.alpha <= 0 || dot.y > VIEW_H + 20) {
              dot.state = "free";
              dot.y = LANE_Y;
            }
            break;
          }
          case "free":
            break;
        }
      }

      if (!media.matches) {
        dots.forEach((dot, i) => {
          const el = dotElements[i];
          if (el === null || el === undefined) {
            return;
          }
          if (dot.state === "free") {
            el.setAttribute("opacity", "0");
            return;
          }
          el.setAttribute(
            "transform",
            `translate(${dot.x.toFixed(1)} ${dot.y.toFixed(1)})`,
          );
          el.setAttribute("opacity", dot.alpha.toFixed(2));
          el.setAttribute(
            "data-state",
            dot.state === "dropped" ? "dropped" : "flowing",
          );
        });
        const fill = bucketFillRef.current;
        if (fill !== null) {
          const level = Math.min(1, tokens / capacity);
          fill.setAttribute("y", String(58 + (1 - level) * 84));
          fill.setAttribute("height", String(level * 84));
        }
      }

      while (deliveredAt.length > 0 && now - deliveredAt[0] > RATE_WINDOW_MS) {
        deliveredAt.shift();
      }
      if (now - lastCounterPush > COUNTER_UPDATE_MS) {
        lastCounterPush = now;
        setCounters({
          deliveredPerSec: deliveredAt.length / (RATE_WINDOW_MS / 1000),
          queued: queue.length,
          droppedPct:
            totalSpawned === 0 ? 0 : (totalDropped / totalSpawned) * 100,
        });
      }

      frame = requestAnimationFrame(tick);
    };

    const start = (): void => {
      if (!running) {
        running = true;
        lastTime = 0;
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
      dotElements.forEach((el) => el?.setAttribute("opacity", "0"));
    };
  }, [started]);

  const toggleStarted = (): void => {
    soundManager.play("tick");
    setStarted((current) => !current);
  };

  const sliderRows: ReadonlyArray<{
    key: keyof SimConfig;
    label: string;
  }> = [
    { key: "arrival", label: RATE_LIMITER.sliders.arrival },
    { key: "capacity", label: RATE_LIMITER.sliders.capacity },
    { key: "refill", label: RATE_LIMITER.sliders.refill },
  ];

  return (
    <div className="lab-frame">
      <svg
        ref={svgRef}
        className="rl-svg"
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label="Token-bucket rate limiter: requests flow, queue, and drop live"
      >
        {/* Lanes */}
        <line className="rl-lane" x1={0} y1={LANE_Y} x2={GATE_X - 20} y2={LANE_Y} />
        <line
          className="rl-lane"
          x1={GATE_X + 20}
          y1={LANE_Y}
          x2={VIEW_W}
          y2={LANE_Y}
        />
        <text className="rl-lane-label" x={14} y={LANE_Y - 16}>
          {RATE_LIMITER.laneLabels.requests}
        </text>
        <text
          className="rl-lane-label"
          x={VIEW_W - 14}
          y={LANE_Y - 16}
          textAnchor="end"
        >
          {RATE_LIMITER.laneLabels.delivered}
        </text>
        <text
          className="rl-lane-label"
          x={GATE_X - 34}
          y={VIEW_H - 14}
          textAnchor="end"
        >
          {RATE_LIMITER.laneLabels.dropped} ↓
        </text>

        {/* Token bucket gate */}
        <rect className="rl-bucket" x={GATE_X - 14} y={56} width={28} height={88} rx={9} />
        <rect
          ref={bucketFillRef}
          className="rl-bucket-fill"
          x={GATE_X - 10}
          y={58}
          width={20}
          height={84}
          rx={6}
        />

        {/* Request dot pool — attributes are driven by the rAF loop. */}
        {Array.from({ length: DOT_POOL_SIZE }, (_, i) => (
          <circle
            key={i}
            ref={(el) => {
              dotRefs.current[i] = el;
            }}
            className="rl-dot"
            r={DOT_RADIUS}
            opacity={0}
          />
        ))}
      </svg>

      <div className="rl-meta">
        <button type="button" className="rl-toggle" onClick={toggleStarted}>
          {started ? RATE_LIMITER.stopLabel : RATE_LIMITER.startLabel}
        </button>
        <div className="rl-counters">
          <span>
            <strong>{counters.deliveredPerSec.toFixed(1)}</strong>{" "}
            {RATE_LIMITER.counters.delivered}
          </span>
          <span>
            <strong>{counters.queued}</strong> {RATE_LIMITER.counters.queued}
          </span>
          <span data-testid="rl-dropped">
            <strong>{counters.droppedPct.toFixed(0)}%</strong>{" "}
            {RATE_LIMITER.counters.dropped}
          </span>
        </div>

        <div className="rl-controls">
          {sliderRows.map(({ key, label }) => (
            <label key={key} className="rl-control">
              <span>
                {label} · {config[key]}
              </span>
              <input
                id={`rl-${key}`}
                type="range"
                min={SLIDER_RANGES[key].min}
                max={SLIDER_RANGES[key].max}
                step={1}
                value={config[key]}
                onChange={(event) =>
                  updateConfig({ [key]: Number(event.target.value) })
                }
                onPointerUp={() => soundManager.play("tick")}
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
