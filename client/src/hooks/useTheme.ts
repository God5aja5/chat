import { useState, useEffect, useCallback } from "react";

export type Theme = "light" | "dark" | "auto";

export interface UseTheme {
  theme: Theme;
  actualTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export function useTheme(): UseTheme {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as Theme) || "auto";
    }
    return "auto";
  });

  const [actualTheme, setActualTheme] = useState<"light" | "dark">("dark");

  const applyTheme = useCallback((newTheme: Theme) => {
    const root = window.document.documentElement;
    
    if (newTheme === "dark") {
      root.classList.add("dark");
      setActualTheme("dark");
    } else if (newTheme === "light") {
      root.classList.remove("dark");
      setActualTheme("light");
    } else {
      // Auto mode - follow system preference
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (systemPrefersDark) {
        root.classList.add("dark");
        setActualTheme("dark");
      } else {
        root.classList.remove("dark");
        setActualTheme("light");
      }
    }

    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const isDark = root.classList.contains("dark");
      metaThemeColor.setAttribute("content", isDark ? "#212121" : "#ffffff");
    }
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  }, [applyTheme]);

  const toggleTheme = useCallback(() => {
    if (theme === "light") {
      setTheme("dark");
    } else if (theme === "dark") {
      setTheme("auto");
    } else {
      setTheme("light");
    }
  }, [theme, setTheme]);

  // Initialize theme on mount
  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Listen for system theme changes when in auto mode
  useEffect(() => {
    if (theme === "auto") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        if (theme === "auto") {
          applyTheme("auto");
        }
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme, applyTheme]);

  return {
    theme,
    actualTheme,
    setTheme,
    toggleTheme,
  };
}
