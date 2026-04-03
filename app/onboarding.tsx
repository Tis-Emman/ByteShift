"use client";

import { useState, useEffect } from "react";
import { X, Rss, Github, Flame, Bookmark, Search, BookOpen, Settings, Keyboard } from "lucide-react";

const STORAGE_KEY = "byteshift_onboarding_done";

const STEPS = [
  {
    title: "Welcome to ByteShift Tech Feed! 👋",
    desc: "Your all-in-one hub for tech news. Browse Reddit, GitHub Trending, Hacker News, and more — all in one place.",
    icon: Rss,
  },
  {
    title: "Multiple Sources",
    desc: "Switch between Reddit, GitHub Trending, Hacker News, and your Saved items using the tabs at the top.",
    icon: Github,
  },
  {
    title: "Bookmark & Save",
    desc: "Click the bookmark icon on any post or repo to save it for later. Export your bookmarks as JSON or Markdown.",
    icon: Bookmark,
  },
  {
    title: "Search & Filter",
    desc: "Use the search bar to filter across all feeds. Press / to quickly focus it. Customize your feeds with the + button.",
    icon: Search,
  },
  {
    title: "Reader Mode",
    desc: "Click 'Reader' on any external link to view articles in a clean, distraction-free format.",
    icon: BookOpen,
  },
  {
    title: "Keyboard Shortcuts",
    desc: "Press ? anytime to see all shortcuts. Use J/K to navigate, 1-4 to switch tabs, R to refresh.",
    icon: Keyboard,
  },
];

export default function Onboarding({ dark, colors }: { dark: boolean; colors: { bg: string; surface: string; text: string; textMuted: string; textSecondary: string; btnBg: string; btnText: string; border: string; borderLight: string } }) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const c = colors;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) {
      setShow(true);
    }
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else dismiss();
  };

  if (!show) return null;

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div
      onClick={dismiss}
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: c.surface, borderRadius: 20,
          border: `1px solid ${c.borderLight}`,
          padding: "40px 32px 32px", maxWidth: 420, width: "100%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          textAlign: "center",
        }}
      >
        <button
          onClick={dismiss}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "none", border: "none", cursor: "pointer",
            color: c.textMuted, padding: 4, display: "flex",
          }}
        >
          <X size={20} />
        </button>

        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: "0 auto 20px",
          background: dark ? "rgba(245,158,11,0.12)" : "rgba(59,130,246,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={28} color={dark ? "#f59e0b" : "#3b82f6"} />
        </div>

        <h3 style={{
          fontSize: 20, fontWeight: 700, color: c.text,
          fontFamily: "'Space Grotesk', sans-serif",
          marginBottom: 12,
        }}>{current.title}</h3>

        <p style={{
          fontSize: 14, color: c.textSecondary, lineHeight: 1.7,
          fontFamily: "'DM Sans', sans-serif",
          marginBottom: 28,
        }}>{current.desc}</p>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 8, height: 8, borderRadius: 4,
              background: i === step ? (dark ? "#f59e0b" : "#3b82f6") : (dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"),
              transition: "all 0.3s",
            }} />
          ))}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              style={{
                padding: "10px 24px", borderRadius: 10,
                border: `1px solid ${c.border}`,
                background: "transparent", color: c.textSecondary,
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >Back</button>
          )}
          <button
            onClick={next}
            style={{
              padding: "10px 28px", borderRadius: 10,
              border: "none",
              background: c.btnBg, color: c.btnText,
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >{step < STEPS.length - 1 ? "Next" : "Get Started"}</button>
        </div>

        <button
          onClick={dismiss}
          style={{
            marginTop: 12, background: "none", border: "none",
            color: c.textMuted, fontSize: 12, cursor: "pointer",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >Skip tour</button>
      </div>
    </div>
  );
}
