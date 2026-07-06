"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { NAV_LINKS, SITE } from "@/lib/site-config";
import { soundManager } from "@/lib/sound-manager";

const PANEL_SPRING = { type: "spring", stiffness: 480, damping: 36 } as const;

/**
 * Phone navigation: a hamburger chip that opens a dropdown panel with the
 * nav links plus the résumé (whose pill is hidden below the sm breakpoint).
 * Desktop keeps the segmented pill; this renders nothing there (sm:hidden).
 */
export function MobileMenu(): React.JSX.Element {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const toggle = (): void => {
    soundManager.play("tick");
    setOpen((current) => !current);
  };

  const close = useCallback((): void => {
    soundManager.play("tick");
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        className="menu-btn"
        aria-label="Menu"
        aria-expanded={open}
        onClick={toggle}
      >
        <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
          <line className="menu-line menu-line-top" x1="4" y1="7.5" x2="20" y2="7.5" />
          <line className="menu-line menu-line-mid" x1="4" y1="12" x2="20" y2="12" />
          <line className="menu-line menu-line-bot" x1="4" y1="16.5" x2="20" y2="16.5" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Invisible backdrop: tap anywhere outside to close. */}
            <motion.div
              className="fixed inset-0 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={close}
            />
            <motion.div
              className="mobile-panel"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={PANEL_SPRING}
            >
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`mobile-panel-link ${pathname === link.href ? "active" : ""}`}
                  onClick={close}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mobile-panel-divider" aria-hidden />
              <a
                href={SITE.resumePath}
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-panel-link"
                onClick={close}
              >
                Resume ↓
              </a>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
