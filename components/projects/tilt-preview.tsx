"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

const MAX_TILT_DEG = 5.5;
const HOVER_SCALE = 1.06;
const TILT_SPRING = { stiffness: 260, damping: 22 } as const;

interface TiltPreviewProps {
  /** Layout classes for the frame slot (heights, borders, grid overrides). */
  className?: string;
  children: React.ReactNode;
}

/**
 * 3D-tilting browser-window preview (the Joy of React project-window motif):
 * the window leans toward the cursor with a tracking glare highlight, and
 * scales up slightly so its edges never peek out of the card. Purely
 * motion-value driven — zero React re-renders while tracking.
 */
export function TiltPreview({ className, children }: TiltPreviewProps): React.JSX.Element {
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);
  const scale = useMotionValue(1);

  const rotateX = useSpring(useTransform(pointerY, [0, 1], [MAX_TILT_DEG, -MAX_TILT_DEG]), TILT_SPRING);
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-MAX_TILT_DEG, MAX_TILT_DEG]), TILT_SPRING);
  const smoothScale = useSpring(scale, TILT_SPRING);

  const glareX = useTransform(pointerX, (v) => v * 100);
  const glareY = useTransform(pointerY, (v) => v * 100);
  const glare = useMotionTemplate`radial-gradient(300px circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.16), transparent 60%)`;
  const glareOpacity = useSpring(useMotionValue(0), TILT_SPRING);

  const reducedMotion = (): boolean =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const handleMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    if (reducedMotion()) {
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width);
    pointerY.set((event.clientY - rect.top) / rect.height);
  };

  const handleEnter = (): void => {
    if (reducedMotion()) {
      return;
    }
    scale.set(HOVER_SCALE);
    glareOpacity.set(1);
  };

  const handleLeave = (): void => {
    pointerX.set(0.5);
    pointerY.set(0.5);
    scale.set(1);
    glareOpacity.set(0);
  };

  return (
    <div
      className={`${className ?? ""} [perspective:900px]`}
      onPointerMove={handleMove}
      onPointerEnter={handleEnter}
      onPointerLeave={handleLeave}
    >
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={{ rotateX, rotateY, scale: smoothScale }}
      >
        {children}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: glare, opacity: glareOpacity }}
        />
      </motion.div>
    </div>
  );
}
