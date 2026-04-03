"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Settings, Moon, Sun, Type, Rss, Trash2, Info, AlertTriangle } from "lucide-react";
import { useTheme, darkColors } from "../theme-context";

type SettingsData = {
  fontSize: number;
  defaultSource: "reddit" | "github" | "hackernews";
  defaultRedditSort: "hot" | "new" | "top";
  defaultSubreddit: string;
};

const SETTINGS_KEY = "byteshift_settings";

const DEFAULT_SETTINGS: SettingsData = {
  fontSize: 16,
  defaultSource: "reddit",
  defaultRedditSort: "hot",
  defaultSubreddit: "technology",
};

function loadSettings(): SettingsData {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(s: SettingsData) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export default function SettingsPage() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  const c = darkColors(dark);

  const [settings, setSettings] = useState<SettingsData>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Confirmation states for data management buttons
  const [confirmHistory, setConfirmHistory] = useState(false);
  const [confirmBookmarks, setConfirmBookmarks] = useState(false);
  const [confirmAll, setConfirmAll] = useState(false);

  // Toast
  const [toast, setToast] = useState("");

  useEffect(() => {
    setSettings(loadSettings());
    setMounted(true);
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const update = (patch: Partial<SettingsData>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2400);
  };

  const handleClearHistory = () => {
    if (!confirmHistory) { setConfirmHistory(true); return; }
    localStorage.removeItem("byteshift_reading_history");
    setConfirmHistory(false);
    showToast("Reading history cleared");
  };

  const handleClearBookmarks = () => {
    if (!confirmBookmarks) { setConfirmBookmarks(true); return; }
    localStorage.removeItem("byteshift_bookmarks");
    setConfirmBookmarks(false);
    showToast("Bookmarks cleared");
  };

  const handleClearAll = () => {
    if (!confirmAll) { setConfirmAll(true); return; }
    const keysToRemove = [
      "byteshift_reading_history",
      "byteshift_bookmarks",
      SETTINGS_KEY,
      "byteshift-theme",
      "byteshift_custom_subs",
      "byteshift_custom_langs",
      "byteshift_last_visit",
    ];
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    setConfirmAll(false);
    setSettings(DEFAULT_SETTINGS);
    showToast("All data cleared");
  };

  if (!mounted) return <div style={{ visibility: "hidden", minHeight: "100vh" }} />;

  const cardStyle: React.CSSProperties = {
    background: c.surface,
    border: `1px solid ${c.border}`,
    borderRadius: 14,
    padding: isMobile ? "20px 18px" : "28px 32px",
    boxShadow: c.cardShadow,
    transition: "box-shadow 0.2s, background 0.3s, border 0.3s",
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: c.textMuted,
    fontFamily: "'Space Grotesk', sans-serif",
    marginBottom: 18,
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 0",
    borderBottom: `1px solid ${c.borderLight}`,
    gap: 12,
    flexWrap: "wrap",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 600,
    color: c.text,
    fontFamily: "'DM Sans', sans-serif",
  };

  const subLabelStyle: React.CSSProperties = {
    fontSize: 13,
    color: c.textSecondary,
    fontFamily: "'DM Sans', sans-serif",
    marginTop: 2,
  };

  const pillGroup = (
    options: { value: string; label: string }[],
    current: string,
    onChange: (v: string) => void,
  ): React.ReactNode => (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {options.map((o) => {
        const active = o.value === current;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: active ? 700 : 500,
              fontFamily: "'DM Sans', sans-serif",
              borderRadius: 8,
              border: `1px solid ${active ? c.pillActiveBorder : c.border}`,
              background: active ? c.pillActiveBg : "transparent",
              color: active ? c.pillActiveText : c.textSecondary,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );

  const dangerBtn = (
    label: string,
    confirming: boolean,
    onClick: () => void,
    onCancel: () => void,
  ): React.ReactNode => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        onClick={onClick}
        style={{
          padding: "8px 18px",
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          borderRadius: 8,
          border: confirming ? "1px solid #ef4444" : `1px solid ${c.border}`,
          background: confirming ? (dark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.08)") : "transparent",
          color: confirming ? "#ef4444" : c.textSecondary,
          cursor: "pointer",
          transition: "all 0.15s",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {confirming ? <AlertTriangle size={14} /> : <Trash2 size={14} />}
        {confirming ? "Are you sure?" : label}
      </button>
      {confirming && (
        <button
          onClick={onCancel}
          style={{
            padding: "8px 14px",
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif",
            borderRadius: 8,
            border: `1px solid ${c.border}`,
            background: "transparent",
            color: c.textSecondary,
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      )}
    </div>
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: c.bg,
      fontFamily: "'DM Sans', sans-serif",
      transition: "background 0.3s",
    }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          background: c.btnBg,
          color: c.btnText,
          padding: "12px 28px",
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          zIndex: 999,
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          animation: "fadeInUp 0.25s ease",
        }}>
          {toast}
        </div>
      )}

      {/* Sticky Nav */}
      <nav style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        background: c.navBg,
        borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
        padding: isMobile ? "0 16px" : "0 40px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "background 0.3s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 14,
            color: c.textSecondary,
            textDecoration: "none",
            fontWeight: 500,
          }}>
            <ArrowLeft size={16} /> Home
          </Link>
          <div style={{ width: 1, height: 24, background: c.border }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Settings size={20} color={dark ? "#f59e0b" : "#0f172a"} />
            <span style={{
              fontSize: 18,
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              color: c.text,
            }}>Settings</span>
          </div>
        </div>
        <button
          onClick={toggle}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: c.textSecondary,
            padding: 8,
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Toggle theme"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </nav>

      {/* Content */}
      <main style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: isMobile ? "24px 16px 80px" : "40px 20px 80px",
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}>

        {/* ── Appearance ── */}
        <div style={cardStyle}>
          <div style={sectionLabel}>Appearance</div>

          {/* Theme toggle */}
          <div style={rowStyle}>
            <div>
              <div style={labelStyle}>Theme</div>
              <div style={subLabelStyle}>Switch between light and dark mode</div>
            </div>
            {pillGroup(
              [{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }],
              theme,
              () => toggle(),
            )}
          </div>

          {/* Font size */}
          <div style={{ ...rowStyle, borderBottom: "none" }}>
            <div>
              <div style={labelStyle}>Font Size</div>
              <div style={subLabelStyle}>Adjust text size across the app</div>
            </div>
            {pillGroup(
              [
                { value: "14", label: "Small" },
                { value: "16", label: "Medium" },
                { value: "18", label: "Large" },
              ],
              String(settings.fontSize),
              (v) => update({ fontSize: Number(v) }),
            )}
          </div>
        </div>

        {/* ── Feed Defaults ── */}
        <div style={cardStyle}>
          <div style={sectionLabel}>Feed Defaults</div>

          {/* Default source */}
          <div style={rowStyle}>
            <div>
              <div style={labelStyle}>Default Source</div>
              <div style={subLabelStyle}>Which feed to show first</div>
            </div>
            {pillGroup(
              [
                { value: "reddit", label: "Reddit" },
                { value: "github", label: "GitHub" },
                { value: "hackernews", label: "Hacker News" },
              ],
              settings.defaultSource,
              (v) => update({ defaultSource: v as SettingsData["defaultSource"] }),
            )}
          </div>

          {/* Default Reddit sort */}
          <div style={rowStyle}>
            <div>
              <div style={labelStyle}>Reddit Sort</div>
              <div style={subLabelStyle}>Default sort order for Reddit feeds</div>
            </div>
            {pillGroup(
              [
                { value: "hot", label: "Hot" },
                { value: "new", label: "New" },
                { value: "top", label: "Top" },
              ],
              settings.defaultRedditSort,
              (v) => update({ defaultRedditSort: v as SettingsData["defaultRedditSort"] }),
            )}
          </div>

          {/* Default subreddit */}
          <div style={{ ...rowStyle, borderBottom: "none" }}>
            <div>
              <div style={labelStyle}>Default Subreddit</div>
              <div style={subLabelStyle}>Subreddit to load on startup</div>
            </div>
            <input
              type="text"
              value={settings.defaultSubreddit}
              onChange={(e) => update({ defaultSubreddit: e.target.value })}
              placeholder="e.g. technology"
              style={{
                padding: "8px 14px",
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 500,
                borderRadius: 8,
                border: `1px solid ${c.border}`,
                background: c.inputBg,
                color: c.text,
                outline: "none",
                width: isMobile ? "100%" : 180,
                transition: "border 0.15s",
              }}
            />
          </div>
        </div>

        {/* ── Data Management ── */}
        <div style={cardStyle}>
          <div style={sectionLabel}>Data Management</div>

          <div style={rowStyle}>
            <div>
              <div style={labelStyle}>Reading History</div>
              <div style={subLabelStyle}>Remove all tracked read items</div>
            </div>
            {dangerBtn("Clear History", confirmHistory, handleClearHistory, () => setConfirmHistory(false))}
          </div>

          <div style={rowStyle}>
            <div>
              <div style={labelStyle}>Bookmarks</div>
              <div style={subLabelStyle}>Delete all saved bookmarks</div>
            </div>
            {dangerBtn("Clear Bookmarks", confirmBookmarks, handleClearBookmarks, () => setConfirmBookmarks(false))}
          </div>

          <div style={{ ...rowStyle, borderBottom: "none" }}>
            <div>
              <div style={labelStyle}>All Data</div>
              <div style={subLabelStyle}>Reset everything to defaults</div>
            </div>
            {dangerBtn("Clear All Data", confirmAll, handleClearAll, () => setConfirmAll(false))}
          </div>
        </div>

        {/* ── About ── */}
        <div style={cardStyle}>
          <div style={sectionLabel}>About</div>

          <div style={{ ...rowStyle, borderBottom: `1px solid ${c.borderLight}` }}>
            <div style={labelStyle}>Version</div>
            <span style={{
              fontSize: 14,
              fontFamily: "'JetBrains Mono', monospace",
              color: c.textSecondary,
              fontWeight: 500,
            }}>1.5</span>
          </div>

          <div style={{
            display: "flex",
            gap: 16,
            paddingTop: 16,
            flexWrap: "wrap",
          }}>
            <Link href="/about" style={{
              fontSize: 14,
              fontWeight: 600,
              color: dark ? "#f59e0b" : "#0f172a",
              textDecoration: "none",
              fontFamily: "'DM Sans', sans-serif",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}>
              <Info size={15} /> About
            </Link>
            <Link href="/changelog" style={{
              fontSize: 14,
              fontWeight: 600,
              color: dark ? "#f59e0b" : "#0f172a",
              textDecoration: "none",
              fontFamily: "'DM Sans', sans-serif",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}>
              <Rss size={15} /> Changelog
            </Link>
          </div>
        </div>

      </main>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translate(-50%, 12px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}
