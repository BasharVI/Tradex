"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  highContrast: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  toggleContrast: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_KEY = "tradex-theme";
const CONTRAST_KEY = "tradex-contrast";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    const savedTheme = window.localStorage.getItem(THEME_KEY) as Theme | null;
    return savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
  });
  const [highContrast, setHighContrast] = useState(() => {
    if (typeof window === "undefined") return false;
    const savedContrast = window.localStorage.getItem(CONTRAST_KEY);
    return savedContrast === "true";
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("contrast", highContrast);
    window.localStorage.setItem(THEME_KEY, theme);
    window.localStorage.setItem(CONTRAST_KEY, String(highContrast));
  }, [theme, highContrast]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      highContrast,
      setTheme: setThemeState,
      toggleTheme: () => setThemeState((current) => (current === "dark" ? "light" : "dark")),
      toggleContrast: () => setHighContrast((current) => !current),
    }),
    [highContrast, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
