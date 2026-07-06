"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { Reveal } from "@/components/motion/reveal";
import { ARCH_NODES, ARCHITECTURE, REQUEST_CYCLE_ANCHOR } from "@/lib/content/architecture";
import type { ArchNodeId } from "@/lib/content/architecture";
import { soundManager } from "@/lib/sound-manager";

/* Diagram geometry, all in viewBox units. */
const VIEW_W = 920;
const VIEW_H = 260;
const NODE_W = 170;
const NODE_H = 64;
const NODE_Y = 28;
const NODE_XS = [10, 250, 490, 730] as const;
const LANE_Y = NODE_Y + NODE_H / 2; // 60 — request lane through node centers
const RETURN_Y = 196; // response lane

const NODE_CENTERS = NODE_XS.map((x) => x + NODE_W / 2);

/** The pulse's route: through the nodes, then the return lane home. */
const WAYPOINTS: ReadonlyArray<{ x: number; y: number }> = [
  { x: NODE_CENTERS[0], y: LANE_Y },
  { x: NODE_CENTERS[1], y: LANE_Y },
  { x: NODE_CENTERS[2], y: LANE_Y },
  { x: NODE_CENTERS[3], y: LANE_Y },
  { x: NODE_CENTERS[3], y: RETURN_Y },
  { x: NODE_CENTERS[0], y: RETURN_Y },
  { x: NODE_CENTERS[0], y: LANE_Y },
];

const PULSE_DURATION_MS = 3200;

/** Keyframe times proportional to segment length, so speed stays constant. */
const WAYPOINT_TIMES = ((): number[] => {
  const cumulative = [0];
  for (let i = 1; i < WAYPOINTS.length; i += 1) {
    const dx = WAYPOINTS[i].x - WAYPOINTS[i - 1].x;
    const dy = WAYPOINTS[i].y - WAYPOINTS[i - 1].y;
    cumulative.push(cumulative[i - 1] + Math.hypot(dx, dy));
  }
  const total = cumulative[cumulative.length - 1];
  return cumulative.map((d) => d / total);
})();

interface HopEvent {
  atMs: number;
  nodeId: ArchNodeId | null;
  caption: string;
}

/** Arrival moments for the three inner nodes plus the return-trip beat. */
const HOP_EVENTS: ReadonlyArray<HopEvent> = [
  { atMs: WAYPOINT_TIMES[1] * PULSE_DURATION_MS, nodeId: "middleware", caption: ARCH_NODES[1].hopCaption },
  { atMs: WAYPOINT_TIMES[2] * PULSE_DURATION_MS, nodeId: "service", caption: ARCH_NODES[2].hopCaption },
  { atMs: WAYPOINT_TIMES[3] * PULSE_DURATION_MS, nodeId: "database", caption: ARCH_NODES[3].hopCaption },
  { atMs: WAYPOINT_TIMES[4] * PULSE_DURATION_MS, nodeId: null, caption: ARCHITECTURE.returnCaption },
];

export function RequestCycle(): React.JSX.Element {
  const [running, setRunning] = useState(false);
  const [litNodes, setLitNodes] = useState<ReadonlyArray<ArchNodeId>>([]);
  const [caption, setCaption] = useState<string>(ARCHITECTURE.idleCaption);
  const [openDetail, setOpenDetail] = useState<ArchNodeId | null>(null);
  const [runId, setRunId] = useState(0);
  const timersRef = useRef<number[]>([]);

  const clearTimers = (): void => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => clearTimers, []);

  const handleSend = (): void => {
    if (running) {
      return;
    }
    clearTimers();
    soundManager.play("tick");

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      // No traveling pulse — light the whole path and land the result.
      setLitNodes(ARCH_NODES.map((node) => node.id));
      setCaption(ARCHITECTURE.responseCaption);
      soundManager.play("success");
      return;
    }

    setRunning(true);
    setRunId((id) => id + 1);
    setLitNodes(["client"]);
    setCaption(ARCH_NODES[0].hopCaption);

    for (const hop of HOP_EVENTS) {
      timersRef.current.push(
        window.setTimeout(() => {
          if (hop.nodeId !== null) {
            setLitNodes((lit) => [...lit, hop.nodeId as ArchNodeId]);
            soundManager.play("pluck");
          }
          setCaption(hop.caption);
        }, hop.atMs),
      );
    }
    timersRef.current.push(
      window.setTimeout(() => {
        setRunning(false);
        setCaption(ARCHITECTURE.responseCaption);
        soundManager.play("success");
      }, PULSE_DURATION_MS),
    );
  };

  const toggleDetail = (id: ArchNodeId): void => {
    soundManager.play("tick");
    setOpenDetail((current) => (current === id ? null : id));
  };

  const openNode = ARCH_NODES.find((node) => node.id === openDetail);

  return (
    <section id={REQUEST_CYCLE_ANCHOR} className="mx-auto max-w-[1240px] px-[7vw] pb-[8vh]">
      <Reveal>
        <div className="showcase-card">
          <div className="mb-7 flex flex-wrap items-start justify-between gap-5">
            <div>
              <div className="mb-3 font-mono text-[11px] font-medium tracking-[0.08em] text-(--text-muted) uppercase">
                {ARCHITECTURE.eyebrow}
              </div>
              <h2 className="m-0 mb-2 text-[26px] leading-[1.2] font-semibold tracking-[-0.02em] text-(--text-primary)">
                {ARCHITECTURE.heading}
              </h2>
              <p className="m-0 max-w-[560px] text-[15px] leading-[1.6] text-(--text-secondary)">
                {ARCHITECTURE.intro}
              </p>
            </div>
            <button
              type="button"
              className="rc-send"
              onClick={handleSend}
              disabled={running}
            >
              {running ? ARCHITECTURE.sendingLabel : ARCHITECTURE.sendLabel}
            </button>
          </div>

          <div className="overflow-x-auto">
            <svg
              className="rc-svg"
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              role="img"
              aria-label="Request path: client, auth middleware, service layer, PostgreSQL, and back"
            >
              <defs>
                <marker
                  id="rc-arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M0,0 L10,5 L0,10 z" fill="var(--border-strong)" />
                </marker>
                <filter id="rc-glow" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="6" />
                </filter>
              </defs>

              {/* Request lane */}
              {NODE_XS.slice(0, -1).map((x, i) => (
                <line
                  key={x}
                  className="rc-link"
                  x1={x + NODE_W + 2}
                  y1={LANE_Y}
                  x2={NODE_XS[i + 1] - 4}
                  y2={LANE_Y}
                  markerEnd="url(#rc-arrow)"
                />
              ))}

              {/* Response lane back to the client */}
              <path
                className="rc-link rc-return"
                d={`M${NODE_CENTERS[3]},${NODE_Y + NODE_H + 4} V${RETURN_Y} H${NODE_CENTERS[0]} V${NODE_Y + NODE_H + 8}`}
                markerEnd="url(#rc-arrow)"
              />
              <text
                className="rc-lane-label"
                x={(NODE_CENTERS[0] + NODE_CENTERS[3]) / 2}
                y={RETURN_Y - 8}
                textAnchor="middle"
              >
                response
              </text>

              {/* Nodes */}
              {ARCH_NODES.map((node, i) => (
                <g
                  key={node.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${node.label} — details`}
                  aria-expanded={openDetail === node.id}
                  className={`rc-node ${litNodes.includes(node.id) ? "lit" : ""}`}
                  onClick={() => toggleDetail(node.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleDetail(node.id);
                    }
                  }}
                >
                  <rect
                    x={NODE_XS[i]}
                    y={NODE_Y}
                    width={NODE_W}
                    height={NODE_H}
                    rx={14}
                  />
                  <text
                    className="rc-node-label"
                    x={NODE_CENTERS[i]}
                    y={NODE_Y + 28}
                    textAnchor="middle"
                  >
                    {node.label}
                  </text>
                  <text
                    className="rc-node-sub"
                    x={NODE_CENTERS[i]}
                    y={NODE_Y + 46}
                    textAnchor="middle"
                  >
                    {node.sublabel}
                  </text>
                </g>
              ))}

              {/* Traveling pulse */}
              {running && (
                <g key={runId} pointerEvents="none">
                  <motion.circle
                    r={13}
                    fill="var(--accent)"
                    opacity={0.4}
                    filter="url(#rc-glow)"
                    initial={{ cx: WAYPOINTS[0].x, cy: WAYPOINTS[0].y }}
                    animate={{
                      cx: WAYPOINTS.map((p) => p.x),
                      cy: WAYPOINTS.map((p) => p.y),
                    }}
                    transition={{
                      duration: PULSE_DURATION_MS / 1000,
                      times: [...WAYPOINT_TIMES],
                      ease: "linear",
                    }}
                  />
                  <motion.circle
                    r={5.5}
                    fill="var(--accent)"
                    initial={{ cx: WAYPOINTS[0].x, cy: WAYPOINTS[0].y }}
                    animate={{
                      cx: WAYPOINTS.map((p) => p.x),
                      cy: WAYPOINTS.map((p) => p.y),
                    }}
                    transition={{
                      duration: PULSE_DURATION_MS / 1000,
                      times: [...WAYPOINT_TIMES],
                      ease: "linear",
                    }}
                  />
                </g>
              )}
            </svg>
          </div>

          <div className="rc-caption" aria-live="polite">
            {caption}
          </div>
          <div className="rc-detail" aria-live="polite">
            {openNode !== undefined && (
              <>
                <span className="rc-detail-label">{openNode.label}</span>
                {openNode.detail}
              </>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
