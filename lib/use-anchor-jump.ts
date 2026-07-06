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
/** Must match the [id] scroll-margin-top in globals.css. */
const NAV_SCROLL_OFFSET_PX = 90;
/** ScrollY unchanged for this long = the scroll (ours or the router's) ended. */
const SCROLL_IDLE_MS = 90;
const POSITION_TOLERANCE_PX = 4;
const MAX_SCROLL_CORRECTIONS = 4;

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

function waitForScrollIdle(done: () => void): void {
  let lastY = window.scrollY;
  const check = (): void => {
    if (window.scrollY === lastY) {
      done();
      return;
    }
    lastY = window.scrollY;
    window.setTimeout(check, SCROLL_IDLE_MS);
  };
  window.setTimeout(check, SCROLL_IDLE_MS);
}

/**
 * Scroll to the element, wait until scrolling goes idle, then verify it
 * actually landed at the nav offset. The router's own post-navigation
 * scroll-to-top races our smooth scroll and strands the page above or
 * below the target — re-issue an instant correction when that happens.
 */
function scrollAndFlash(element: HTMLElement, reduceMotion: boolean): void {
  const attempt = (round: number): void => {
    element.scrollIntoView({
      behavior: round === 1 && !reduceMotion ? "smooth" : "auto",
      block: "start",
    });
    waitForScrollIdle(() => {
      const top = element.getBoundingClientRect().top;
      const pageBottomReached =
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 2;
      const landed =
        Math.abs(top - NAV_SCROLL_OFFSET_PX) <= POSITION_TOLERANCE_PX ||
        pageBottomReached;
      if (!landed && round < MAX_SCROLL_CORRECTIONS) {
        attempt(round + 1);
        return;
      }
      flashWhenVisible(element);
    });
  };
  attempt(1);
}

/**
 * Client-side jump to an anchored section WITHOUT putting the id in the URL:
 * navigates to the bare route, waits for the element to exist, scrolls to it
 * (correcting against the router's own scroll reset), and pulses the
 * highlight only once the section is actually in view.
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
          // Two frames so the new page mounts and the router's scroll reset
          // fires before we measure and scroll ourselves.
          requestAnimationFrame(() => {
            requestAnimationFrame(() => scrollAndFlash(element, reduceMotion));
          });
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
