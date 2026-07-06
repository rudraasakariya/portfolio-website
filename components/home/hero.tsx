"use client";

import { motion } from "motion/react";
import type { Variants } from "motion/react";
import Link from "next/link";

import { MagneticField } from "@/components/home/magnetic-field";
import { Pebbles } from "@/components/home/pebbles";
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

/** The greeting slides up from behind a clipping mask. */
const lineReveal: Variants = {
  hidden: { y: "110%" },
  visible: {
    y: 0,
    transition: { type: "spring", stiffness: 110, damping: 21 },
  },
};

export function Hero(): React.JSX.Element {
  return (
    <section className="relative overflow-hidden">
      <Pebbles />
      <motion.div
        className="relative mx-auto grid w-full max-w-[1240px] items-center gap-14 px-[7vw] pt-[9vh] pb-[9vh] md:grid-cols-[1.05fr_0.95fr] md:gap-16"
        initial="hidden"
        animate="visible"
        variants={container}
      >
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
        <motion.div
          variants={rise}
          className="mb-7 inline-flex items-center gap-2 rounded-[20px] bg-(--accent-soft) py-[6px] pr-3 pl-2"
        >
          <span className="pulse-dot inline-block h-[7px] w-[7px] rounded-full bg-(--accent)" />
          <span className="font-mono text-[12px] font-medium tracking-[0.03em] text-(--accent)">
            {HERO.availability}
          </span>
        </motion.div>

        <h1 className="mb-4 text-[clamp(38px,5.6vw,64px)] leading-[1.06] font-semibold tracking-[-0.025em] text-(--text-primary)">
          <span className="block overflow-hidden pb-[0.08em]">
            <motion.span className="block" variants={lineReveal}>
              Hi, I&apos;m Rudraraj<span className="text-(--accent)">.</span>
            </motion.span>
          </span>
        </h1>

        <motion.div
          variants={rise}
          className="mb-5 inline-flex items-center gap-[6px] font-mono text-[13px] font-medium text-(--text-tertiary)"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path
              d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"
              fill="currentColor"
            />
          </svg>
          {SITE.location}
        </motion.div>

        <motion.p variants={rise} className="mb-2 text-[19px] font-semibold text-(--accent)">
          {HERO.role}
        </motion.p>
        <motion.p
          variants={rise}
          className="mb-10 max-w-[560px] text-[17px] leading-[1.65] text-(--text-secondary)"
        >
          {HERO.valueProp}
        </motion.p>

        <motion.div
          variants={rise}
          className="flex flex-wrap items-center justify-center gap-[14px] md:justify-start"
        >
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
              className="inline-block rounded-[8px] border border-(--border-strong) bg-(--card-bg) px-6 py-[13px] text-[14px] font-medium text-(--text-primary)"
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

        <motion.div variants={rise} className="relative">
          {/* Accent slab peeking out behind the frame — the old hero's offset
              card, translated into the redesign's soft rounded language. */}
          <div
            aria-hidden
            className="absolute inset-0 translate-x-[16px] translate-y-[16px] rounded-[24px] bg-(--accent)"
          />
          <div className="relative h-[340px] overflow-hidden rounded-[24px] border border-(--border-strong) bg-(--card-bg) md:h-[440px]">
            <MagneticField />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
