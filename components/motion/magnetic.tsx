"use client";

import { motion, useMotionValue, useSpring } from "motion/react";

interface MagneticProps {
  children: React.ReactNode;
  className?: string;
  /** How strongly the element follows the cursor (0–1). */
  strength?: number;
}

/**
 * Magnetic hover: the wrapped element is gently pulled toward the cursor with
 * a spring, and springs back on leave. Squishes slightly while pressed.
 */
export function Magnetic({
  children,
  className,
  strength = 0.25,
}: MagneticProps): React.JSX.Element {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 320, damping: 22 });
  const springY = useSpring(y, { stiffness: 320, damping: 22 });

  const handleMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
  };

  const reset = (): void => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      className={`inline-block ${className ?? ""}`}
      style={{ x: springX, y: springY }}
      whileTap={{ scale: 0.96 }}
      onPointerMove={handleMove}
      onPointerLeave={reset}
    >
      {children}
    </motion.div>
  );
}
