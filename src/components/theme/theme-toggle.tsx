"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { theme, resolvedTheme, cycleTheme } = useTheme();
  const label =
    theme === "system"
      ? `System theme (${resolvedTheme}); switch to dark mode`
      : theme === "dark"
        ? "Dark theme; switch to light mode"
        : "Light theme; switch to system mode";

  return (
    <button
      aria-label={label}
      className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border bg-card text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      onClick={cycleTheme}
      title={`Theme: ${theme}`}
      type="button"
    >
      {theme === "system" ? (
        <Monitor aria-hidden="true" className="size-4" />
      ) : theme === "dark" ? (
        <Moon aria-hidden="true" className="size-4" />
      ) : (
        <Sun aria-hidden="true" className="size-4" />
      )}
    </button>
  );
}
