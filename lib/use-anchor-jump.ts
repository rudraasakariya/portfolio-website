"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

const POLL_INTERVAL_MS = 50;
const POLL_TIMEOUT_MS = 1000;
/** Must match the .search-flash animation duration in globals.css. */
const FLASH_DURATION_MS = 1600;
/** How much of the target must be on screen before the flash fires. */
const VISIBLE_THRESHOLD = 0.25;
/** Give up watching for visibility if the user scrolls away instead. */
const OBSERVER_TTL_MS = 4000;

function flashWhenVisible(element: HTMLElement): void {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        observer.disconnect();
        element.classList.add("search-flash");
        window.setTimeout(
          () => element.classList.remove("search-flash"),
          FLASH_DURATION_MS,
        );
      }
    },
    { threshold: VISIBLE_THRESHOLD },
  );
  observer.observe(element);
  window.setTimeout(() => observer.disconnect(), OBSERVER_TTL_MS);
}

/**
 * Client-side jump to an anchored section WITHOUT putting the id in the URL:
 * navigates to the bare route, waits for the element to exist, scrolls to it,
 * and pulses the highlight only once the section is actually in view (so the
 * flash isn't spent while a smooth scroll is still travelling).
 */
export function useAnchorJump(): (route: string, anchor: string) => void {
  const router = useRouter();

  return useCallback(
    (route: string, anchor: string): void => {
      router.push(route);
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const startedAt = performance.now();
      const poll = (): void => {
        const element = document.getElementById(anchor);
        if (element !== null) {
          element.scrollIntoView({
            behavior: reduceMotion ? "auto" : "smooth",
            block: "start",
          });
          flashWhenVisible(element);
          return;
        }
        if (performance.now() - startedAt < POLL_TIMEOUT_MS) {
          window.setTimeout(poll, POLL_INTERVAL_MS);
        }
      };
      poll();
    },
    [router],
  );
}
