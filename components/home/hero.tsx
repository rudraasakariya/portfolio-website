"use client";

import { motion } from "motion/react";
import type { Variants } from "motion/react";
import Link from "next/link";

import { MagneticField } from "@/components/home/magnetic-field";
import { Magnetic } from "@/components/motion/magnetic";
import { HERO } from "@/lib/content/home";
import { ROUTES, SITE } from "@/lib/site-config";

const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 19 },
  },
};

/** Each name line slides up from behind a clipping mask. */
const lineReveal: Variants = {
  hidden: { y: "110%" },
  visible: {
    y: 0,
    transition: { type: "spring", stiffness: 110, damping: 21 },
  },
};

const portrait: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 18, delay: 0.35 },
  },
};

const portraitShadow: Variants = {
  hidden: { x: 0, y: 0, opacity: 0 },
  visible: {
    x: 0,
    y: 0,
    opacity: 0.9,
    transition: { type: "spring", stiffness: 90, damping: 16, delay: 0.55 },
  },
};

export function Hero(): React.JSX.Element {
  return (
    <motion.div
      className="relative mx-auto grid max-w-[1360px] items-center gap-[56px] px-[7vw] pt-[8vh] pb-[7vh] lg:grid-cols-[1.35fr_0.65fr]"
      initial="hidden"
      animate="visible"
      variants={container}
    >
      <div>
        <motion.div
          variants={rise}
          className="mb-[22px] inline-flex items-center gap-2 rounded-[20px] bg-(--accent-soft) py-[6px] pr-3 pl-2"
        >
          <span className="pulse-dot inline-block h-[7px] w-[7px] rounded-full bg-(--accent)" />
          <span className="font-mono text-[12px] font-medium tracking-[0.03em] text-(--accent)">
            {HERO.availability}
          </span>
        </motion.div>
        <h1 className="mb-[22px] text-[clamp(38px,5.6vw,64px)] leading-[1.04] font-semibold tracking-[-0.025em] text-(--text-primary)">
          <span className="block overflow-hidden pb-[0.08em]">
            <motion.span className="block" variants={lineReveal}>
              Rudraraj
            </motion.span>
          </span>
          <span className="block overflow-hidden pb-[0.08em]">
            <motion.span className="block" variants={lineReveal}>
              Sakariya
            </motion.span>
          </span>
        </h1>
        <motion.p variants={rise} className="mb-2 text-[20px] font-semibold text-(--accent)">
          {HERO.role}
        </motion.p>
        <motion.p
          variants={rise}
          className="mb-9 max-w-[480px] text-[18px] leading-[1.6] text-(--text-secondary)"
        >
          {HERO.valueProp}
        </motion.p>
        <motion.div variants={rise} className="flex flex-wrap gap-[14px]">
          <Magnetic>
            <Link
              href={ROUTES.contact}
              className="inline-block rounded-[8px] bg-(--text-primary) px-6 py-[13px] text-[14px] font-medium text-(--bg-page)"
            >
              Get in touch
            </Link>
          </Magnetic>
          <Magnetic>
            <a
              href={SITE.resumePath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-[8px] border border-(--border-strong) px-6 py-[13px] text-[14px] font-medium text-(--text-primary)"
            >
              Download résumé
            </a>
          </Magnetic>
          <a
            href={SITE.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-[6px] py-[13px] text-[14px] font-medium text-(--text-secondary) transition-colors duration-200 hover:text-(--text-primary)"
          >
            LinkedIn
          </a>
          <a
            href={SITE.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-[6px] py-[13px] text-[14px] font-medium text-(--text-secondary) transition-colors duration-200 hover:text-(--text-primary)"
          >
            GitHub
          </a>
        </motion.div>
      </div>

      <div className="relative">
        <motion.div
          variants={portraitShadow}
          className="absolute rounded-[16px] bg-(--accent) inset-[18px_-18px_-18px_18px]"
        />
        <motion.div
          variants={portrait}
          className="relative aspect-[1/1.05] overflow-hidden rounded-[16px] border border-(--border) bg-(--card-bg)"
        >
          <MagneticField />
        </motion.div>
      </div>
    </motion.div>
  );
}
