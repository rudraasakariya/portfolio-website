"use client";

import { useRef } from "react";

import { soundManager } from "@/lib/sound-manager";
import { THEME_STORAGE_KEY } from "@/lib/site-config";

type Theme = "light" | "dark";

const FADE_MS = 450;

const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;

/** Star positions for the dark-mode sky, in the 24×24 viewBox. */
const STARS = [
  { cx: 19.5, cy: 5, r: 1.0 },
  { cx: 22, cy: 9.5, r: 0.7 },
  { cx: 17.5, cy: 2.5, r: 0.55 },
] as const;

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage unavailable (private mode) — theme still applies for this page.
  }
}

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Sun/moon toggle. The rays, moon bite, and stars are choreographed purely in
 * CSS off the root data-theme attribute (see globals.css). The page itself
 * crossfades: a temporary .theme-fade class gives every element the same
 * color transition so the whole UI moves in step — no view-transition
 * snapshots, so there is nothing heavy to rasterize even at 4K/120Hz.
 */
export function ThemeToggle(): React.JSX.Element {
  const fadeTimer = useRef<number>(0);

  const handleClick = (): void => {
    const root = document.documentElement;
    const next: Theme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    soundManager.play(next === "light" ? "theme-light" : "theme-dark");

    if (!prefersReducedMotion()) {
      root.classList.add("theme-fade");
      window.clearTimeout(fadeTimer.current);
      fadeTimer.current = window.setTimeout(
        () => root.classList.remove("theme-fade"),
        FADE_MS,
      );
    }
    applyTheme(next);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerEnter={() => soundManager.play("hover")}
      aria-label="Toggle dark mode"
      className="theme-btn"
    >
      <svg
        className="theme-icon"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        aria-hidden="true"
      >
        <mask id="theme-moon-mask">
          <rect width="24" height="24" fill="white" />
          <circle className="moon-bite" cx="26" cy="9" r="7" fill="black" />
        </mask>
        <circle
          className="sun-core"
          cx="12"
          cy="12"
          r="5.2"
          fill="currentColor"
          mask="url(#theme-moon-mask)"
        />
        <g className="rays">
          {RAY_ANGLES.map((angle, index) => (
            <circle
              key={angle}
              className="ray"
              style={{ "--ray-index": index } as React.CSSProperties}
              cx="12"
              cy="3.1"
              r="1.4"
              fill="currentColor"
            />
          ))}
        </g>
        <g className="stars">
          {STARS.map((star, index) => (
            <circle
              key={star.cx}
              className="star"
              style={{ "--star-index": index } as React.CSSProperties}
              cx={star.cx}
              cy={star.cy}
              r={star.r}
              fill="currentColor"
            />
          ))}
        </g>
      </svg>
    </button>
  );
}
