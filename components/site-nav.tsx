"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, useState } from "react";

import { SoundToggle } from "@/components/sound-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { OPEN_SEARCH_EVENT } from "@/lib/search/config";
import { NAV_LINKS, ROUTES, SITE } from "@/lib/site-config";
import { soundManager } from "@/lib/sound-manager";

const DOT_SPRING = { type: "spring", stiffness: 500, damping: 12 } as const;
const SEGMENT_SPRING = { type: "spring", stiffness: 400, damping: 32 } as const;

/** The accent period in "RS." boops on hover — a nod to joshwcomeau.com. */
function LogoDot(): React.JSX.Element {
  const [booped, setBooped] = useState(false);

  return (
    <motion.span
      className="inline-block text-(--accent)"
      animate={booped ? { y: -3, scale: 1.25 } : { y: 0, scale: 1 }}
      transition={DOT_SPRING}
      onHoverStart={() => {
        setBooped(true);
        window.setTimeout(() => setBooped(false), 140);
      }}
    >
      .
    </motion.span>
  );
}

interface SegmentPosition {
  x: number;
  width: number;
}

export function SiteNav(): React.JSX.Element {
  const pathname = usePathname();
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());
  const [segment, setSegment] = useState<SegmentPosition | null>(null);

  // The active-segment pill is one persistent element moved with measured
  // offsets relative to the pill container — a cross-route layoutId would
  // measure in viewport space and fly in from the old scroll position.
  useLayoutEffect(() => {
    const measure = (): void => {
      const active = linkRefs.current.get(pathname);
      if (active === undefined) {
        setSegment(null);
        return;
      }
      setSegment({ x: active.offsetLeft, width: active.offsetWidth });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [pathname]);

  return (
    <nav className="sticky top-0 z-10 grid grid-cols-[1fr_auto_1fr] items-center border-b border-(--border) bg-(--nav-bg) px-[7vw] py-4 backdrop-blur-[8px]">
      <Link
        href={ROUTES.home}
        aria-label="Home"
        className="nav-chip justify-self-start font-mono text-[14px] font-semibold tracking-[0.02em]"
      >
        {/* Small left pad counterweights the dot so the monogram reads
            optically centered — dead-centering either RS or RS. both look off. */}
        <span className="inline-block pl-[3px]">
          RS
          <LogoDot />
        </span>
      </Link>

      <div className="nav-pill relative hidden justify-self-center sm:flex">
        {segment !== null && (
          <motion.span
            aria-hidden
            className="nav-segment"
            initial={false}
            animate={{ x: segment.x, width: segment.width }}
            transition={SEGMENT_SPRING}
          />
        )}
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            ref={(el) => {
              if (el === null) {
                linkRefs.current.delete(link.href);
              } else {
                linkRefs.current.set(link.href, el);
              }
            }}
            href={link.href}
            className={`relative z-[1] rounded-full px-[16px] py-[7px] font-mono text-[13px] font-medium transition-colors duration-200 ${
              pathname === link.href
                ? "text-(--text-primary)"
                : "text-(--text-secondary) hover:text-(--text-primary)"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3 justify-self-end">
        <button
          type="button"
          className="search-btn"
          aria-label="Search"
          title="Search (⌘K)"
          onClick={() => window.dispatchEvent(new CustomEvent(OPEN_SEARCH_EVENT))}
          onPointerEnter={() => soundManager.play("hover")}
        >
          <svg
            className="search-icon"
            viewBox="0 0 24 24"
            width="17"
            height="17"
            aria-hidden="true"
          >
            <circle
              cx="10.5"
              cy="10.5"
              r="5.75"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="10.5" cy="10.5" r="2.3" fill="currentColor" opacity="0.55" />
            <line
              x1="14.9"
              y1="14.9"
              x2="19.6"
              y2="19.6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <SoundToggle />
        <ThemeToggle />
        <a
          href={SITE.resumePath}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-(--border-strong) bg-(--card-bg) px-[16px] py-2 font-mono text-[12px] font-medium text-(--text-primary) shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
        >
          Resume ↓
        </a>
      </div>
    </nav>
  );
}
