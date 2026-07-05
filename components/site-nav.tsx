"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { SoundToggle } from "@/components/sound-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { NAV_LINKS, ROUTES, SITE } from "@/lib/site-config";

const DOT_SPRING = { type: "spring", stiffness: 500, damping: 12 } as const;

/** The accent period in "RS." boops on hover — a nod to joshwcomeau.com. */
function LogoDot(): React.JSX.Element {
  const [booped, setBooped] = useState(false);

  return (
    <motion.span
      className="inline-block text-(--accent)"
      animate={booped ? { y: -4, scale: 1.25 } : { y: 0, scale: 1 }}
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

export function SiteNav(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-(--border) bg-(--nav-bg) px-[7vw] py-[22px] backdrop-blur-[8px]">
      <Link
        href={ROUTES.home}
        className="font-mono text-[14px] font-semibold tracking-[0.02em] text-(--text-primary)"
      >
        RS
        <LogoDot />
      </Link>
      <div className="hidden gap-[36px] font-mono text-[13px] font-medium sm:flex">
        {NAV_LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <span key={link.href} className="relative">
              <Link
                href={link.href}
                className={active ? "text-(--text-primary)" : "text-(--text-secondary)"}
              >
                {link.label}
              </Link>
              {active && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute right-0 -bottom-[7px] left-0 h-[1.5px] rounded-full bg-(--accent)"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
            </span>
          );
        })}
      </div>
      <div className="flex items-center gap-3">
        <SoundToggle />
        <ThemeToggle />
        <a
          href={SITE.resumePath}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-[6px] border border-(--text-primary) px-[14px] py-2 font-mono text-[12px] font-medium text-(--text-primary)"
        >
          Resume ↓
        </a>
      </div>
    </nav>
  );
}
