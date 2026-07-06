"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { useEffect } from "react";

interface PebbleSpec {
  left: string;
  top: string;
  size: number;
  /** Parallax depth 0–1: deeper pebbles drift further with the cursor. */
  depth: number;
  rotate: number;
  bobDelay: number;
}

const PEBBLES: ReadonlyArray<PebbleSpec> = [
  { left: "14%", top: "22%", size: 30, depth: 0.9, rotate: 18, bobDelay: 0 },
  { left: "8%", top: "58%", size: 18, depth: 0.5, rotate: -12, bobDelay: 0.8 },
  { left: "24%", top: "76%", size: 24, depth: 0.7, rotate: 30, bobDelay: 1.6 },
  { left: "38%", top: "14%", size: 16, depth: 0.4, rotate: -25, bobDelay: 0.4 },
  { left: "47%", top: "68%", size: 12, depth: 0.6, rotate: 8, bobDelay: 2.1 },
  { left: "60%", top: "18%", size: 14, depth: 0.5, rotate: 40, bobDelay: 1.2 },
  { left: "72%", top: "60%", size: 20, depth: 0.8, rotate: -32, bobDelay: 0.2 },
  { left: "84%", top: "28%", size: 28, depth: 1, rotate: 12, bobDelay: 1.9 },
  { left: "91%", top: "70%", size: 15, depth: 0.6, rotate: -8, bobDelay: 0.6 },
];

function Pebble({
  spec,
  pointerX,
  pointerY,
}: {
  spec: PebbleSpec;
  pointerX: ReturnType<typeof useSpring>;
  pointerY: ReturnType<typeof useSpring>;
}): React.JSX.Element {
  const range = 26 * spec.depth;
  const x = useTransform(pointerX, [-0.5, 0.5], [-range, range]);
  const y = useTransform(pointerY, [-0.5, 0.5], [-range * 0.7, range * 0.7]);

  return (
    <motion.span
      className="pebble"
      style={{
        left: spec.left,
        top: spec.top,
        width: spec.size,
        height: spec.size,
        rotate: spec.rotate,
        x,
        y,
        animationDelay: `${spec.bobDelay}s`,
      }}
    />
  );
}

/** Olivier-style floating pebbles that drift with the cursor by depth. */
export function Pebbles(): React.JSX.Element {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const pointerX = useSpring(rawX, { stiffness: 60, damping: 20 });
  const pointerY = useSpring(rawY, { stiffness: 60, damping: 20 });

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const onMove = (event: PointerEvent): void => {
      rawX.set(event.clientX / window.innerWidth - 0.5);
      rawY.set(event.clientY / window.innerHeight - 0.5);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [rawX, rawY]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {PEBBLES.map((spec) => (
        <Pebble key={`${spec.left}-${spec.top}`} spec={spec} pointerX={pointerX} pointerY={pointerY} />
      ))}
    </div>
  );
}
