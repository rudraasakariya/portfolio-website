"use client";

import { motion } from "motion/react";

const CARD_SPRING = { type: "spring", stiffness: 320, damping: 30 } as const;

interface SpotlightCardProps {
  className?: string;
  children: React.ReactNode;
  /** Forwarded so AnimatePresence popLayout can measure the card. */
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * Project card shell: participates in FLIP layout animations when the filter
 * changes, lifts on hover, and feeds the cursor position to the CSS spotlight
 * gradient (.proj-card::after) via custom properties.
 */
export function SpotlightCard({ className, children, ref }: SpotlightCardProps): React.JSX.Element {
  const handleMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    element.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    element.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={CARD_SPRING}
      whileHover={{ y: -2 }}
      onPointerMove={handleMove}
      className={className}
    >
      {children}
    </motion.div>
  );
}
