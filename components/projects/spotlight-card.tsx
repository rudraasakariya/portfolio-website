"use client";

import { motion } from "motion/react";
import type { Variants } from "motion/react";

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 320,
      damping: 30,
      delay: index * 0.07,
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.97,
    transition: { duration: 0.14, ease: "easeIn" },
  },
};

interface SpotlightCardProps {
  className?: string;
  children: React.ReactNode;
  /** Stagger position when the card set enters after a filter change. */
  index?: number;
  /** Forwarded so AnimatePresence popLayout can measure the card. */
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * Project card shell: every filter change re-keys the cards, so the whole
 * set exits and enters with one uniform staggered pattern. Also lifts on
 * hover and feeds the cursor position to the CSS spotlight gradient
 * (.proj-card::after) via custom properties.
 */
export function SpotlightCard({
  className,
  children,
  index = 0,
  ref,
}: SpotlightCardProps): React.JSX.Element {
  const handleMove = (event: React.PointerEvent<HTMLDivElement>): void => {
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    element.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
    element.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
  };

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      custom={index}
      whileHover={{ y: -2 }}
      onPointerMove={handleMove}
      className={className}
    >
      {children}
    </motion.div>
  );
}
