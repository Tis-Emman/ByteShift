"use client";

import Link from "next/link";
import { ArrowLeft, Moon, Sun, Newspaper, Search, Rss, BookOpen, Scroll, Github, MessageSquare, Palette, Smartphone, Menu, Rocket, Globe, Bookmark, ArrowUp, Eye, Download, Bell, Filter, Layers, Zap } from "lucide-react";
import { useTheme, darkColors } from "../theme-context";

type ChangelogEntry = {
  version: string;
  date: string;
  items: { text: string; icon: React.ReactNode }[];
};

export default function ChangelogPage() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  const c = darkColors(dark);

  const accent = "#6366f1";
  const accentSoft = dark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)";

  const entries: ChangelogEntry[] = [
    {
      version: "v1.5",
      date: "March 2026",
      items: [
        { text: "Global search bar across all feeds", icon: <Search size={15} /> },
        { text: "Hacker News integration (top, new, best, ask, show)", icon: <Rss size={15} /> },
        { text: "Reading history with dimming of visited posts", icon: <Eye size={15} /> },
        { text: "Article reader mode for distraction-free reading", icon: <BookOpen size={15} /> },
        { text: "Custom feed builder (add your own subreddits/languages)", icon: <Layers size={15} /> },
        { text: "Export bookmarks as JSON or Markdown", icon: <Download size={15} /> },
        { text: "New post notification badges", icon: <Bell size={15} /> },
      ],
    },
    {
      version: "v1.4",
      date: "March 2026",
      items: [
        { text: "Bookmark system with Saved tab", icon: <Bookmark size={15} /> },
        { text: "Infinite scroll on Reddit feed", icon: <Scroll size={15} /> },
        { text: "Back to top button", icon: <ArrowUp size={15} /> },
      ],
    },
    {
      version: "v1.3",
      date: "March 2026",
      items: [
        { text: "GitHub Trending integration", icon: <Github size={15} /> },
        { text: "Language filters for GitHub repos", icon: <Filter size={15} /> },
      ],
    },
    {
      version: "v1.2",
      date: "March 2026",
      items: [
        { text: "Reddit Tech Feed with 8 subreddits", icon: <MessageSquare size={15} /> },
        { text: "Post viewer with threaded comments", icon: <Layers size={15} /> },
        { text: "Server-side API proxy for CORS", icon: <Globe size={15} /> },
      ],
    },
    {
      version: "v1.1",
      date: "March 2026",
      items: [
        { text: "Dark mode with theme persistence", icon: <Palette size={15} /> },
        { text: "Mobile responsive layout", icon: <Smartphone size={15} /> },
        { text: "Hamburger menu for mobile", icon: <Menu size={15} /> },
      ],
    },
    {
      version: "v1.0",
      date: "March 2026",
      items: [
        { text: "Initial release", icon: <Rocket size={15} /> },
        { text: "Homepage with articles, tools, typing test", icon: <Zap size={15} /> },
        { text: "Sign in / Sign up pages", icon: <Globe size={15} /> },
      ],
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: c.bg, color: c.text, transition: "background 0.3s, color 0.3s" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        ::selection {
          background: ${c.selectionBg};
          color: ${c.selectionColor};
        }

        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: ${c.scrollTrackBg}; }
        ::-webkit-scrollbar-thumb { background: ${c.scrollThumbBg}; border-radius: 4px; }

        .changelog-entry {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .changelog-entry:hover {
          transform: translateY(-2px);
          box-shadow: ${c.cardShadowHover};
        }

        .timeline-dot {
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .changelog-entry:hover .timeline-dot {
          transform: scale(1.3);
          box-shadow: 0 0 12px ${accent};
        }

        .back-link {
          text-decoration: none;
          color: ${c.textSecondary};
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          transition: color 0.2s;
        }
        .back-link:hover { color: ${c.text}; }

        .item-row {
          transition: background 0.15s;
          border-radius: 8px;
        }
        .item-row:hover {
          background: ${dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)"};
        }

        @media (max-width: 700px) {
          .changelog-container {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
          .changelog-header-inner {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
          .timeline-line {
            left: 20px !important;
          }
          .timeline-dot-wrap {
            left: 12px !important;
          }
          .entry-card {
            margin-left: 44px !important;
          }
          .version-badge {
            font-size: 13px !important;
            padding: 3px 10px !important;
          }
          .entry-date {
            font-size: 12px !important;
          }
          .item-text {
            font-size: 13px !important;
          }
          .page-title {
            font-size: 22px !important;
          }
          .page-subtitle {
            font-size: 13px !important;
          }
        }
      `}</style>

      {/* Sticky Nav */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: c.navBg,
          borderBottom: `1px solid ${c.border}`,
          backdropFilter: "blur(16px)",
        }}
      >
        <div
          className="changelog-header-inner"
          style={{
            maxWidth: 800,
            margin: "0 auto",
            padding: "14px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link href="/" className="back-link">
              <ArrowLeft size={16} />
              <span>Back</span>
            </Link>
            <div
              style={{
                width: 1,
                height: 20,
                background: c.border,
              }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Newspaper size={18} style={{ color: accent }} />
              <span
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                Changelog
              </span>
            </div>
          </div>
          <button
            onClick={toggle}
            style={{
              background: "none",
              border: `1px solid ${c.border}`,
              borderRadius: 8,
              padding: 8,
              cursor: "pointer",
              color: c.textSecondary,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "border-color 0.2s, color 0.2s",
            }}
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </nav>

      {/* Page Header */}
      <div
        className="changelog-container"
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "48px 32px 24px",
        }}
      >
        <h1
          className="page-title"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 32,
            fontWeight: 700,
            marginBottom: 8,
          }}
        >
          What&apos;s New
        </h1>
        <p
          className="page-subtitle"
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15,
            color: c.textSecondary,
            marginBottom: 0,
          }}
        >
          All the latest updates, features, and improvements to ByteShift.
        </p>
      </div>

      {/* Timeline */}
      <div
        className="changelog-container"
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "16px 32px 64px",
          position: "relative",
        }}
      >
        {/* Vertical line */}
        <div
          className="timeline-line"
          style={{
            position: "absolute",
            left: 48,
            top: 0,
            bottom: 0,
            width: 2,
            background: `linear-gradient(to bottom, ${accent}, ${c.border})`,
            borderRadius: 1,
          }}
        />

        {entries.map((entry, i) => (
          <div
            key={entry.version}
            className="changelog-entry"
            style={{
              position: "relative",
              marginBottom: i < entries.length - 1 ? 32 : 0,
            }}
          >
            {/* Timeline dot */}
            <div
              className="timeline-dot-wrap"
              style={{
                position: "absolute",
                left: 39,
                top: 24,
                zIndex: 2,
              }}
            >
              <div
                className="timeline-dot"
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: i === 0 ? accent : c.surface,
                  border: `3px solid ${accent}`,
                  boxShadow: i === 0 ? `0 0 8px ${accent}` : "none",
                }}
              />
            </div>

            {/* Card */}
            <div
              className="entry-card"
              style={{
                marginLeft: 72,
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 14,
                padding: "24px 28px",
                boxShadow: c.cardShadow,
              }}
            >
              {/* Version + Date */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <span
                  className="version-badge"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 14,
                    fontWeight: 600,
                    background: i === 0 ? accent : accentSoft,
                    color: i === 0 ? "#fff" : accent,
                    padding: "4px 12px",
                    borderRadius: 20,
                  }}
                >
                  {entry.version}
                </span>
                <span
                  className="entry-date"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: c.textSecondary,
                  }}
                >
                  {entry.date}
                </span>
              </div>

              {/* Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {entry.items.map((item, j) => (
                  <div
                    key={j}
                    className="item-row"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 10px",
                    }}
                  >
                    <span style={{ color: accent, flexShrink: 0, display: "flex" }}>
                      {item.icon}
                    </span>
                    <span
                      className="item-text"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: 14,
                        color: c.text,
                        lineHeight: 1.5,
                      }}
                    >
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
