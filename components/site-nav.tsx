"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { NAV_LINKS, ROUTES, SITE } from "@/lib/site-config";

export function SiteNav(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-(--border) bg-(--nav-bg) px-[7vw] py-[22px] backdrop-blur-[8px]">
      <Link
        href={ROUTES.home}
        className="font-mono text-[14px] font-semibold tracking-[0.02em] text-(--text-primary)"
      >
        RS<span className="text-(--accent)">.</span>
      </Link>
      <div className="hidden gap-[36px] font-mono text-[13px] font-medium sm:flex">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              pathname === link.href
                ? "text-(--text-primary)"
                : "text-(--text-secondary)"
            }
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-4">
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
