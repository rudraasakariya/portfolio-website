"use client";

import { THEME_STORAGE_KEY } from "@/lib/site-config";

type Theme = "light" | "dark";

function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage unavailable (private mode) — theme still applies for this page.
  }
}

export function ThemeToggle(): React.JSX.Element {
  const handleClick = (): void => {
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Toggle dark mode"
      className="relative h-[24px] w-[44px] flex-none cursor-pointer rounded-[20px] border-none bg-(--border-strong) p-0"
    >
      <span className="theme-thumb" />
    </button>
  );
}
