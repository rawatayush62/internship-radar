"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore
} from "react";

type ThemeChoice = "system" | "light" | "dark";
interface ThemeContextValue {
  theme: ThemeChoice;
  resolvedTheme: "light" | "dark";
  cycleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_STORAGE_KEY = "internship-radar-theme";
const THEME_CHANGE_EVENT = "internship-radar-theme-change";

function subscribeToTheme(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
  };
}

function getStoredTheme(): ThemeChoice {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === "light" || storedTheme === "dark" ? storedTheme : "system";
}

function setStoredTheme(theme: ThemeChoice) {
  if (theme === "system") {
    window.localStorage.removeItem(THEME_STORAGE_KEY);
  } else {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

function getSystemTheme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore<ThemeChoice>(
    subscribeToTheme,
    getStoredTheme,
    (): ThemeChoice => "system"
  );
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const themeRef = useRef<ThemeChoice>("system");

  useEffect(() => {
    themeRef.current = theme;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = (choice: ThemeChoice) => {
      const resolved = choice === "system" ? getSystemTheme() : choice;
      document.documentElement.classList.toggle("dark", resolved === "dark");
      document.documentElement.style.colorScheme = resolved;
      setResolvedTheme(resolved);
    };
    const onSystemChange = () => {
      if (themeRef.current === "system") applyTheme("system");
    };

    applyTheme(theme);
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, [theme]);

  const cycleTheme = useCallback(() => {
    const currentTheme = getStoredTheme();
    const next: ThemeChoice =
      currentTheme === "system"
        ? "dark"
        : currentTheme === "dark"
          ? "light"
          : "system";
    themeRef.current = next;
    setStoredTheme(next);
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, cycleTheme }),
    [theme, resolvedTheme, cycleTheme]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider.");
  return context;
}
