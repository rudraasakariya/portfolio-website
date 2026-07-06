"use client";

import { useRef } from "react";

import { soundManager } from "@/lib/sound-manager";
import { THEME_STORAGE_KEY } from "@/lib/site-config";

type Theme = "light" | "dark";

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
 * CSS off the root data-theme attribute (see globals.css), so the animation
 * needs no client state. The page itself switches inside a View Transition
 * that expands as a circle from the button, when the browser supports it.
 */
export function ThemeToggle(): React.JSX.Element {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const transitioningRef = useRef(false);

  const handleClick = (): void => {
    const root = document.documentElement;
    const current = root.getAttribute("data-theme");
    const next: Theme = current === "dark" ? "light" : "dark";
    soundManager.play(next === "light" ? "theme-light" : "theme-dark");

    // Rapid re-clicks while a wipe is running switch instantly instead of
    // aborting the active transition mid-circle.
    if (
      !document.startViewTransition ||
      prefersReducedMotion() ||
      transitioningRef.current
    ) {
      applyTheme(next);
      return;
    }

    const rect = buttonRef.current?.getBoundingClientRect();
    const originX = rect ? rect.left + rect.width / 2 : window.innerWidth;
    const originY = rect ? rect.top + rect.height / 2 : 0;
    const radius = Math.hypot(
      Math.max(originX, window.innerWidth - originX),
      Math.max(originY, window.innerHeight - originY),
    );

    root.style.setProperty("--vt-x", `${originX}px`);
    root.style.setProperty("--vt-y", `${originY}px`);
    root.style.setProperty("--vt-r", `${radius}px`);
    root.classList.add("theme-switching");
    transitioningRef.current = true;

    const transition = document.startViewTransition(() => applyTheme(next));
    void transition.finished.finally(() => {
      root.classList.remove("theme-switching");
      transitioningRef.current = false;
    });
  };

  return (
    <button
      ref={buttonRef}
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
