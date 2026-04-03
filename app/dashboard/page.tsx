"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Moon,
  Sun,
  BarChart3,
  Eye,
  Bookmark,
  Rss,
  Github,
  ExternalLink,
} from "lucide-react";
import { useTheme, darkColors } from "../theme-context";
import { getBookmarks, type BookmarkItem } from "../bookmarks";
import { getReadIds } from "../reading-history";

function timeAgo(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function Dashboard() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  const c = darkColors(dark);

  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setBookmarks(getBookmarks());
    setReadIds(getReadIds());
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 700);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Computed stats
  const totalRead = readIds.size;
  const totalBookmarks = bookmarks.length;
  const redditBookmarks = bookmarks.filter((b) => b.type === "reddit");
  const githubBookmarks = bookmarks.filter((b) => b.type === "github");

  // Reading activity by type
  const readArray = Array.from(readIds);
  const redditRead = readArray.filter((id) => id.startsWith("reddit_")).length;
  const githubRead = readArray.filter((id) => id.startsWith("github_")).length;
  const hnRead = readArray.filter((id) => id.startsWith("hn_")).length;
  const maxRead = Math.max(redditRead, githubRead, hnRead, 1);

  // Top subreddits
  const subredditCounts: Record<string, number> = {};
  redditBookmarks.forEach((b) => {
    if (b.subreddit) {
      subredditCounts[b.subreddit] = (subredditCounts[b.subreddit] || 0) + 1;
    }
  });
  const topSubreddits = Object.entries(subredditCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxSubCount = topSubreddits.length > 0 ? topSubreddits[0][1] : 1;

  // Recent bookmarks
  const recentBookmarks = bookmarks.slice(0, 5);

  const statCards = [
    { label: "Posts Read", value: totalRead, icon: Eye, color: "#3b82f6" },
    { label: "Bookmarks Saved", value: totalBookmarks, icon: Bookmark, color: "#f59e0b" },
    { label: "Reddit Saved", value: redditBookmarks.length, icon: Rss, color: "#ef4444" },
    { label: "GitHub Saved", value: githubBookmarks.length, icon: Github, color: "#8b5cf6" },
  ];

  const activityBars = [
    { label: "Reddit", count: redditRead, color: "#ef4444" },
    { label: "GitHub", count: githubRead, color: "#8b5cf6" },
    { label: "Hacker News", count: hnRead, color: "#f59e0b" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: c.bg,
        color: c.text,
        fontFamily: "'DM Sans', sans-serif",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      {/* Sticky Nav */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: c.navBg,
          borderBottom: `1px solid ${c.border}`,
          backdropFilter: "blur(12px)",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 56,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Link
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: c.textSecondary,
                textDecoration: "none",
                fontSize: 14,
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 500,
                transition: "color 0.2s",
              }}
            >
              <ArrowLeft size={16} />
              Back
            </Link>
            <div
              style={{
                width: 1,
                height: 20,
                background: c.border,
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 18,
              }}
            >
              <BarChart3 size={20} style={{ color: "#f59e0b" }} />
              Dashboard
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
              color: c.text,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "32px 24px 64px",
        }}
      >
        {/* Stats Grid */}
        <section style={{ marginBottom: 40 }}>
          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: c.textMuted,
              marginBottom: 16,
            }}
          >
            Overview
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)",
              gap: 16,
            }}
          >
            {statCards.map((card) => (
              <div
                key={card.label}
                style={{
                  background: c.surface,
                  border: `1px solid ${c.border}`,
                  borderRadius: 12,
                  padding: "20px 20px 18px",
                  boxShadow: c.cardShadow,
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: c.textSecondary,
                      fontWeight: 500,
                    }}
                  >
                    {card.label}
                  </span>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: `${card.color}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <card.icon size={16} style={{ color: card.color }} />
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 28,
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  {card.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reading Activity + Top Subreddits — side by side on desktop */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: 24,
            marginBottom: 40,
          }}
        >
          {/* Reading Activity */}
          <section
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 12,
              padding: 24,
              boxShadow: c.cardShadow,
            }}
          >
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: c.textMuted,
                marginBottom: 20,
              }}
            >
              Reading Activity
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {activityBars.map((bar) => (
                <div key={bar.label}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 500,
                        color: c.textSecondary,
                      }}
                    >
                      {bar.label}
                    </span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 13,
                        fontWeight: 600,
                        color: c.text,
                      }}
                    >
                      {bar.count}
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: 8,
                      borderRadius: 4,
                      background: c.inputBg,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${(bar.count / maxRead) * 100}%`,
                        height: "100%",
                        borderRadius: 4,
                        background: bar.color,
                        transition: "width 0.5s ease",
                        minWidth: bar.count > 0 ? 4 : 0,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            {totalRead === 0 && (
              <p
                style={{
                  fontSize: 13,
                  color: c.textMuted,
                  marginTop: 16,
                  textAlign: "center",
                }}
              >
                No reading history yet. Start browsing the feed!
              </p>
            )}
          </section>

          {/* Top Subreddits */}
          <section
            style={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: 12,
              padding: 24,
              boxShadow: c.cardShadow,
            }}
          >
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 700,
                fontSize: 14,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: c.textMuted,
                marginBottom: 20,
              }}
            >
              Top Subreddits
            </h2>
            {topSubreddits.length > 0 ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {topSubreddits.map(([sub, count]) => (
                  <div key={sub}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: c.textSecondary,
                        }}
                      >
                        r/{sub}
                      </span>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 13,
                          fontWeight: 600,
                          color: c.text,
                        }}
                      >
                        {count}
                      </span>
                    </div>
                    <div
                      style={{
                        width: "100%",
                        height: 8,
                        borderRadius: 4,
                        background: c.inputBg,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${(count / maxSubCount) * 100}%`,
                          height: "100%",
                          borderRadius: 4,
                          background: "#3b82f6",
                          transition: "width 0.5s ease",
                          minWidth: 4,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p
                style={{
                  fontSize: 13,
                  color: c.textMuted,
                  textAlign: "center",
                }}
              >
                No subreddit bookmarks yet. Save some Reddit posts!
              </p>
            )}
          </section>
        </div>

        {/* Recent Bookmarks */}
        <section>
          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: c.textMuted,
              marginBottom: 16,
            }}
          >
            Recent Bookmarks
          </h2>
          {recentBookmarks.length > 0 ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              {recentBookmarks.map((item) => {
                const href =
                  item.type === "reddit" && item.permalink
                    ? `/feed/post?permalink=${encodeURIComponent(item.permalink)}`
                    : item.url;
                const isExternal = item.type === "github";

                return (
                  <a
                    key={item.id}
                    href={href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      background: c.surface,
                      border: `1px solid ${c.border}`,
                      borderRadius: 12,
                      padding: "14px 18px",
                      boxShadow: c.cardShadow,
                      textDecoration: "none",
                      color: c.text,
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 500,
                          lineHeight: 1.4,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.title}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginTop: 4,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            padding: "2px 8px",
                            borderRadius: 4,
                            background:
                              item.type === "reddit"
                                ? "#ef444420"
                                : "#8b5cf620",
                            color:
                              item.type === "reddit" ? "#ef4444" : "#8b5cf6",
                          }}
                        >
                          {item.type}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            color: c.textMuted,
                          }}
                        >
                          saved {timeAgo(item.savedAt)}
                        </span>
                      </div>
                    </div>
                    {isExternal && (
                      <ExternalLink
                        size={14}
                        style={{ color: c.textMuted, flexShrink: 0 }}
                      />
                    )}
                  </a>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                background: c.surface,
                border: `1px solid ${c.border}`,
                borderRadius: 12,
                padding: "40px 24px",
                boxShadow: c.cardShadow,
                textAlign: "center",
              }}
            >
              <Bookmark
                size={32}
                style={{ color: c.textMuted, marginBottom: 12 }}
              />
              <p
                style={{
                  fontSize: 14,
                  color: c.textMuted,
                  margin: 0,
                }}
              >
                No bookmarks yet. Head to the{" "}
                <Link
                  href="/feed"
                  style={{ color: "#f59e0b", textDecoration: "none" }}
                >
                  feed
                </Link>{" "}
                and save some items!
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
