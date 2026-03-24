"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("byteshift-theme") as Theme | null;
    if (saved) setTheme(saved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem("byteshift-theme", theme);
  }, [theme, mounted]);

  const toggle = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  if (!mounted) return <div style={{ visibility: "hidden" }}>{children}</div>;

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function darkColors(dark: boolean) {
  return {
    bg: dark ? "#0a0a0f" : "#fff",
    bgAlt: dark ? "#111118" : "#fefefe",
    surface: dark ? "#141420" : "#fff",
    surfaceHover: dark ? "#1a1a28" : "#fafafa",
    text: dark ? "#f1f5f9" : "#0f172a",
    textSecondary: dark ? "#94a3b8" : "#64748b",
    textMuted: dark ? "#64748b" : "#94a3b8",
    border: dark ? "#1e293b" : "#e2e8f0",
    borderLight: dark ? "#1e293b" : "#f1f5f9",
    inputBg: dark ? "#0f172a" : "#f8fafc",
    navBg: dark ? "#0a0a0f" : "#fefefe",
    cardShadow: dark ? "0 2px 12px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.05)",
    cardShadowHover: dark ? "0 20px 60px rgba(0,0,0,0.4)" : "0 20px 60px rgba(0,0,0,0.10)",
    heroCardShadow: dark ? "0 12px 56px rgba(0,0,0,0.4), 0 2px 16px rgba(0,0,0,0.3)" : "0 12px 56px rgba(0,0,0,0.09), 0 2px 16px rgba(0,0,0,0.05)",
    gridLine: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)",
    pillActiveBg: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
    pillActiveBorder: dark ? "#94a3b8" : "#0f172a",
    pillActiveText: dark ? "#f1f5f9" : "#0f172a",
    btnBg: dark ? "#f1f5f9" : "#0f172a",
    btnText: dark ? "#0a0a0f" : "#fff",
    logoFilter: dark ? "invert(1)" : "none",
    selectionBg: dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)",
    selectionColor: dark ? "#f1f5f9" : "#0f172a",
    scrollThumbBg: dark ? "#1e293b" : "#e2e8f0",
    scrollTrackBg: dark ? "#0a0a0f" : "#f8fafc",
  };
}
