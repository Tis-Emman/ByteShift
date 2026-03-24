"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, MessageSquare, ArrowUp, Clock, RefreshCw, Moon, Sun, Rss, Star, GitFork, TrendingUp, Github } from "lucide-react";
import { useTheme, darkColors } from "../theme-context";

type RedditPost = {
  id: string;
  title: string;
  url: string;
  permalink: string;
  subreddit: string;
  author: string;
  score: number;
  num_comments: number;
  created_utc: number;
  selftext: string;
  thumbnail: string;
  is_self: boolean;
  link_flair_text: string | null;
  domain: string;
};

type GitHubRepo = {
  rank: number;
  name: string;
  description: string;
  language: string | null;
  languageColor: string | null;
  stars: number;
  forks: number;
  starsToday: string;
  url: string;
};

const SUBREDDITS = [
  { name: "technology", label: "Technology" },
  { name: "programming", label: "Programming" },
  { name: "webdev", label: "Web Dev" },
  { name: "artificial", label: "AI" },
  { name: "gamedev", label: "Game Dev" },
  { name: "linux", label: "Linux" },
  { name: "PinoyProgrammer", label: "Pinoy Dev" },
  { name: "ITPhilippines", label: "IT Philippines" },
];

const LANGUAGES = [
  { name: "", label: "All" },
  { name: "typescript", label: "TypeScript" },
  { name: "python", label: "Python" },
  { name: "javascript", label: "JavaScript" },
  { name: "rust", label: "Rust" },
  { name: "go", label: "Go" },
  { name: "java", label: "Java" },
  { name: "c++", label: "C++" },
];

function timeAgo(utc: number): string {
  const seconds = Math.floor(Date.now() / 1000 - utc);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatScore(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function TechFeed() {
  const [source, setSource] = useState<"reddit" | "github">("reddit");
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSub, setActiveSub] = useState("technology");
  const [sort, setSort] = useState<"hot" | "new" | "top">("hot");
  const [ghLang, setGhLang] = useState("");
  const [ghSince, setGhSince] = useState<"daily" | "weekly" | "monthly">("daily");
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  const c = darkColors(dark);

  const fetchPosts = async (sub: string, sortBy: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/reddit?sub=${sub}&sort=${sortBy}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const items: RedditPost[] = data.data.children.map((child: { data: RedditPost }) => ({
        id: child.data.id,
        title: child.data.title,
        url: child.data.url,
        permalink: child.data.permalink,
        subreddit: child.data.subreddit,
        author: child.data.author,
        score: child.data.score,
        num_comments: child.data.num_comments,
        created_utc: child.data.created_utc,
        selftext: child.data.selftext,
        thumbnail: child.data.thumbnail,
        is_self: child.data.is_self,
        link_flair_text: child.data.link_flair_text,
        domain: child.data.domain,
      }));
      setPosts(items);
    } catch {
      setError("Couldn't load posts. Reddit may be rate-limiting — try again in a moment.");
    }
    setLoading(false);
  };

  const fetchGithub = async (lang: string, since: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/github?language=${encodeURIComponent(lang)}&since=${since}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRepos(data.repos || []);
    } catch {
      setError("Couldn't load trending repos. Try again in a moment.");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (source === "reddit") fetchPosts(activeSub, sort);
  }, [activeSub, sort, source]);

  useEffect(() => {
    if (source === "github") fetchGithub(ghLang, ghSince);
  }, [ghLang, ghSince, source]);

  const handleRefresh = () => {
    if (source === "reddit") fetchPosts(activeSub, sort);
    else fetchGithub(ghLang, ghSince);
  };

  const handleRetry = () => handleRefresh();

  return (
    <div style={{
      minHeight: "100vh",
      background: c.bg,
      color: c.text,
      fontFamily: "'DM Sans', sans-serif",
      transition: "background 0.3s, color 0.3s",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: ${c.selectionBg}; color: ${c.selectionColor}; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${c.scrollTrackBg}; }
        ::-webkit-scrollbar-thumb { background: ${c.scrollThumbBg}; border-radius: 3px; }
        .feed-card { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
        .feed-card:hover { transform: translateY(-2px); box-shadow: ${c.cardShadowHover}; }
        .sub-pill { transition: all 0.2s; cursor: pointer; }
        .sort-btn { transition: all 0.2s; cursor: pointer; }
        .source-btn { transition: all 0.2s; cursor: pointer; }
        @media (max-width: 768px) {
          .feed-header { padding: 0 16px !important; }
          .feed-container { padding: 20px 16px 60px !important; }
          .feed-card { padding: 16px !important; }
          .feed-vote { display: none !important; }
          .feed-meta { font-size: 10px !important; }
          .feed-title { font-size: 14px !important; }
          .source-toggle { gap: 4px !important; }
          .source-btn { font-size: 12px !important; padding: 6px 12px !important; }
        }
      `}</style>

      {/* Header */}
      <header className="feed-header" style={{
        position: "sticky", top: 0, zIndex: 100,
        background: c.navBg,
        borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
        padding: "0 40px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "background 0.3s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 14, color: c.textSecondary, textDecoration: "none", fontWeight: 500,
          }}>
            <ArrowLeft size={16} /> Home
          </Link>
          <div style={{
            width: 1, height: 24, background: c.border,
          }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {source === "reddit"
              ? <Rss size={20} color={dark ? "#f59e0b" : "#0f172a"} />
              : <Github size={20} color={dark ? "#f59e0b" : "#0f172a"} />
            }
            <span style={{
              fontSize: 18, fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              color: c.text,
            }}>Tech Feed</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleRefresh}
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              border: `1px solid ${c.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: c.textSecondary,
            }}
            aria-label="Refresh"
          >
            <RefreshCw size={16} className={loading ? "spin" : ""} />
          </button>
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              border: `1px solid ${c.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: c.text,
            }}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      <div className="feed-container" style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* Source toggle */}
        <div className="source-toggle" style={{
          display: "flex", gap: 6, marginBottom: 24,
          padding: 4, borderRadius: 12,
          background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          border: `1px solid ${c.borderLight}`,
          width: "fit-content",
        }}>
          <button
            className="source-btn"
            onClick={() => setSource("reddit")}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 20px", borderRadius: 9,
              border: "none",
              background: source === "reddit" ? c.btnBg : "transparent",
              color: source === "reddit" ? c.btnText : c.textMuted,
              fontSize: 13, fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            <Rss size={15} /> Reddit
          </button>
          <button
            className="source-btn"
            onClick={() => setSource("github")}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 20px", borderRadius: 9,
              border: "none",
              background: source === "github" ? c.btnBg : "transparent",
              color: source === "github" ? c.btnText : c.textMuted,
              fontSize: 13, fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            <Github size={15} /> GitHub Trending
          </button>
        </div>

        {/* Reddit filters */}
        {source === "reddit" && (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {SUBREDDITS.map((sub) => (
                <button
                  key={sub.name}
                  className="sub-pill"
                  onClick={() => setActiveSub(sub.name)}
                  style={{
                    padding: "8px 18px", borderRadius: 20,
                    border: activeSub === sub.name ? `1px solid ${c.pillActiveBorder}` : `1px solid ${c.border}`,
                    background: activeSub === sub.name ? c.pillActiveBg : c.surface,
                    color: activeSub === sub.name ? c.pillActiveText : c.textMuted,
                    fontSize: 13, fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  r/{sub.label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
              {(["hot", "new", "top"] as const).map((s) => (
                <button
                  key={s}
                  className="sort-btn"
                  onClick={() => setSort(s)}
                  style={{
                    padding: "6px 14px", borderRadius: 8,
                    border: sort === s ? `1px solid ${c.text}` : `1px solid ${c.border}`,
                    background: sort === s ? c.btnBg : "transparent",
                    color: sort === s ? c.btnText : c.textMuted,
                    fontSize: 12, fontWeight: 600, textTransform: "capitalize",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        {/* GitHub filters */}
        {source === "github" && (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.name}
                  className="sub-pill"
                  onClick={() => setGhLang(lang.name)}
                  style={{
                    padding: "8px 18px", borderRadius: 20,
                    border: ghLang === lang.name ? `1px solid ${c.pillActiveBorder}` : `1px solid ${c.border}`,
                    background: ghLang === lang.name ? c.pillActiveBg : c.surface,
                    color: ghLang === lang.name ? c.pillActiveText : c.textMuted,
                    fontSize: 13, fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {lang.label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
              {(["daily", "weekly", "monthly"] as const).map((s) => (
                <button
                  key={s}
                  className="sort-btn"
                  onClick={() => setGhSince(s)}
                  style={{
                    padding: "6px 14px", borderRadius: 8,
                    border: ghSince === s ? `1px solid ${c.text}` : `1px solid ${c.border}`,
                    background: ghSince === s ? c.btnBg : "transparent",
                    color: ghSince === s ? c.btnText : c.textMuted,
                    fontSize: 12, fontWeight: 600, textTransform: "capitalize",
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                background: c.surface, border: `1px solid ${c.borderLight}`,
                borderRadius: 14, padding: "24px 28px",
                animation: "pulse 1.5s ease-in-out infinite",
              }}>
                <div style={{ height: 16, width: "70%", background: c.surfaceHover, borderRadius: 8, marginBottom: 12 }} />
                <div style={{ height: 12, width: "40%", background: c.surfaceHover, borderRadius: 6 }} />
              </div>
            ))}
            <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }`}</style>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            color: c.textMuted, fontFamily: "'JetBrains Mono', monospace", fontSize: 14,
          }}>
            {error}
            <br />
            <button
              onClick={handleRetry}
              style={{
                marginTop: 16, padding: "10px 20px", borderRadius: 8,
                background: c.btnBg, color: c.btnText,
                border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >Retry</button>
          </div>
        )}

        {/* Reddit Posts */}
        {!loading && !error && source === "reddit" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/feed/post?permalink=${encodeURIComponent(post.permalink)}`}
                className="feed-card"
                style={{
                  display: "block", textDecoration: "none",
                  background: c.surface,
                  border: `1px solid ${c.borderLight}`,
                  borderRadius: 14,
                  padding: "20px 24px",
                  boxShadow: c.cardShadow,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div className="feed-vote" style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    minWidth: 48, paddingTop: 2,
                  }}>
                    <ArrowUp size={16} color={c.textMuted} />
                    <span style={{
                      fontSize: 14, fontWeight: 700, color: c.text,
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}>{formatScore(post.score)}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: dark ? "#f59e0b" : "#3b82f6",
                        fontFamily: "'JetBrains Mono', monospace",
                        textTransform: "uppercase", letterSpacing: 0.5,
                      }}>r/{post.subreddit}</span>
                      {post.link_flair_text && (
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                          background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                          color: c.textSecondary,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>{post.link_flair_text}</span>
                      )}
                      <span style={{ fontSize: 11, color: c.textMuted }}>·</span>
                      <span style={{
                        fontSize: 11, color: c.textMuted,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>u/{post.author}</span>
                    </div>
                    <h3 className="feed-title" style={{
                      fontSize: 16, fontWeight: 700, color: c.text,
                      fontFamily: "'Space Grotesk', sans-serif",
                      lineHeight: 1.4, margin: "0 0 10px",
                    }}>{post.title}</h3>
                    {post.selftext && (
                      <p style={{
                        fontSize: 13, color: c.textSecondary, lineHeight: 1.6,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                        overflow: "hidden", margin: "0 0 10px",
                      }}>{post.selftext}</p>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <span style={{
                        display: "flex", alignItems: "center", gap: 4,
                        fontSize: 12, color: c.textMuted,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        <MessageSquare size={13} /> {post.num_comments}
                      </span>
                      <span style={{
                        display: "flex", alignItems: "center", gap: 4,
                        fontSize: 12, color: c.textMuted,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        <Clock size={13} /> {timeAgo(post.created_utc)}
                      </span>
                      {!post.is_self && (
                        <span style={{
                          display: "flex", alignItems: "center", gap: 4,
                          fontSize: 11, color: c.textMuted,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>
                          <ExternalLink size={12} /> {post.domain}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* GitHub Repos */}
        {!loading && !error && source === "github" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {repos.map((repo) => (
              <a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="feed-card"
                style={{
                  display: "block", textDecoration: "none",
                  background: c.surface,
                  border: `1px solid ${c.borderLight}`,
                  borderRadius: 14,
                  padding: "20px 24px",
                  boxShadow: c.cardShadow,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  {/* Star count */}
                  <div className="feed-vote" style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    minWidth: 48, paddingTop: 2,
                  }}>
                    <Star size={16} color={dark ? "#f59e0b" : "#eab308"} />
                    <span style={{
                      fontSize: 14, fontWeight: 700, color: c.text,
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}>{formatScore(repo.stars)}</span>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: dark ? "#f59e0b" : "#3b82f6",
                        fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: 0.5,
                      }}>{repo.name}</span>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 4,
                        background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                        color: c.textSecondary,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>#{repo.rank}</span>
                    </div>

                    <h3 className="feed-title" style={{
                      fontSize: 16, fontWeight: 700, color: c.text,
                      fontFamily: "'Space Grotesk', sans-serif",
                      lineHeight: 1.4, margin: "0 0 8px",
                    }}>{repo.name.split("/")[1]}</h3>

                    {repo.description && (
                      <p style={{
                        fontSize: 13, color: c.textSecondary, lineHeight: 1.6,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                        overflow: "hidden", margin: "0 0 12px",
                      }}>{repo.description}</p>
                    )}

                    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      {repo.language && (
                        <span style={{
                          display: "flex", alignItems: "center", gap: 6,
                          fontSize: 12, color: c.textMuted,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>
                          <span style={{
                            width: 10, height: 10, borderRadius: "50%",
                            background: repo.languageColor || c.textMuted,
                            flexShrink: 0,
                          }} />
                          {repo.language}
                        </span>
                      )}
                      <span style={{
                        display: "flex", alignItems: "center", gap: 4,
                        fontSize: 12, color: c.textMuted,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        <GitFork size={13} /> {formatScore(repo.forks)}
                      </span>
                      {repo.starsToday && (
                        <span style={{
                          display: "flex", alignItems: "center", gap: 4,
                          fontSize: 12, color: dark ? "#f59e0b" : "#ea580c",
                          fontWeight: 600,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>
                          <TrendingUp size={13} /> {repo.starsToday}
                        </span>
                      )}
                      <span style={{
                        display: "flex", alignItems: "center", gap: 4,
                        fontSize: 11, color: c.textMuted,
                        fontFamily: "'JetBrains Mono', monospace",
                        marginLeft: "auto",
                      }}>
                        <ExternalLink size={12} /> github.com
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && ((source === "reddit" && posts.length === 0) || (source === "github" && repos.length === 0)) && (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            color: c.textMuted, fontFamily: "'JetBrains Mono', monospace", fontSize: 14,
          }}>
            {source === "reddit"
              ? "No posts found. Try a different subreddit or sort."
              : "No trending repos found. Try a different language or time range."}
          </div>
        )}
      </div>
    </div>
  );
}
