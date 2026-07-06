"use client";

import { useRef } from "react";

import { soundManager } from "@/lib/sound-manager";
import { THEME_STORAGE_KEY } from "@/lib/site-config";

type Theme = "light" | "dark";

const FADE_MS = 450;

const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;

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
        <g className="sun-group">
          <circle className="sun-core" cx="12" cy="12" r="4.6" fill="currentColor" />
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
        </g>
        <g className="moon-group">
          {/* Feather-style crescent, mirrored so the opening faces up-left. */}
          <path
            className="moon-shape"
            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
            transform="scale(-1 1) translate(-24 0)"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            className="moon-star"
            d="M7 3.4l0.72 1.74 1.74 0.72-1.74 0.72L7 8.32l-0.72-1.74-1.74-0.72 1.74-0.72z"
            fill="currentColor"
          />
        </g>
      </svg>
    </button>
  );
}
