"use client";

import { motion } from "motion/react";
import type { Variants } from "motion/react";

const SPRING = { type: "spring", stiffness: 130, damping: 20 } as const;

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: SPRING },
};

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/** Fades and rises content in once it scrolls into view. */
export function Reveal({ children, className, delay = 0 }: RevealProps): React.JSX.Element {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ ...SPRING, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Parent that staggers its StaggerItem children as it enters the viewport. */
export function StaggerGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={containerVariants}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}
