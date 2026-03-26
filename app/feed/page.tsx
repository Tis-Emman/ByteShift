"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, MessageSquare, ArrowUp, Clock, RefreshCw, Moon, Sun, Rss, Star, GitFork, TrendingUp, Github, Bookmark, BookmarkCheck, Trash2, Search, X, Flame, BookOpen, Eye } from "lucide-react";
import { useTheme, darkColors } from "../theme-context";
import { type BookmarkItem, getBookmarks, isBookmarked, toggleBookmark, removeBookmark } from "../bookmarks";
import { markAsRead, getReadIds } from "../reading-history";

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

type HNStory = {
  id: number;
  title: string;
  url: string;
  author: string;
  score: number;
  comments: number;
  time: number;
  domain: string;
  hnUrl: string;
  isSelf: boolean;
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
  const [source, setSource] = useState<"reddit" | "github" | "hackernews" | "saved">("reddit");
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSub, setActiveSub] = useState("technology");
  const [sort, setSort] = useState<"hot" | "new" | "top">("hot");
  const [ghLang, setGhLang] = useState("");
  const [ghSince, setGhSince] = useState<"daily" | "weekly" | "monthly">("daily");
  const [hnStories, setHnStories] = useState<HNStory[]>([]);
  const [hnSort, setHnSort] = useState<"top" | "new" | "best" | "ask" | "show">("top");
  const [hnPage, setHnPage] = useState(0);
  const [hnHasMore, setHnHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [hideRead, setHideRead] = useState(false);
  const [savedItems, setSavedItems] = useState<BookmarkItem[]>([]);
  const [bookmarkTick, setBookmarkTick] = useState(0);
  const [redditAfter, setRedditAfter] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  const c = darkColors(dark);

  // Load reading history
  useEffect(() => {
    setReadIds(getReadIds());
  }, []);

  // Reload saved items when switching to saved tab or after bookmark changes
  useEffect(() => {
    setSavedItems(getBookmarks());
  }, [source, bookmarkTick]);

  const handleBookmarkReddit = (e: React.MouseEvent, post: RedditPost) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark({
      id: `reddit_${post.id}`,
      type: "reddit",
      title: post.title,
      url: post.url,
      savedAt: Date.now(),
      permalink: post.permalink,
      subreddit: post.subreddit,
      author: post.author,
      score: post.score,
      num_comments: post.num_comments,
      selftext: post.selftext,
    });
    setBookmarkTick((t) => t + 1);
  };

  const handleBookmarkGithub = (e: React.MouseEvent, repo: GitHubRepo) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark({
      id: `github_${repo.name}`,
      type: "github",
      title: repo.name.split("/")[1],
      url: repo.url,
      savedAt: Date.now(),
      name: repo.name,
      description: repo.description,
      language: repo.language || undefined,
      languageColor: repo.languageColor,
      stars: repo.stars,
      forks: repo.forks,
    });
    setBookmarkTick((t) => t + 1);
  };

  const handleRemoveSaved = (id: string) => {
    removeBookmark(id);
    setBookmarkTick((t) => t + 1);
  };

  const parseRedditItems = (data: { data: { children: { data: RedditPost }[]; after: string | null } }) => {
    return data.data.children.map((child: { data: RedditPost }) => ({
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
  };

  const fetchPosts = async (sub: string, sortBy: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/reddit?sub=${sub}&sort=${sortBy}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPosts(parseRedditItems(data));
      setRedditAfter(data.data?.after || null);
    } catch {
      setError("Couldn't load posts. Reddit may be rate-limiting — try again in a moment.");
    }
    setLoading(false);
  };

  const fetchMorePosts = useCallback(async () => {
    if (loadingMore || !redditAfter || source !== "reddit") return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/reddit?sub=${activeSub}&sort=${sort}&after=${redditAfter}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      const newItems = parseRedditItems(data);
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        return [...prev, ...newItems.filter((p: RedditPost) => !existingIds.has(p.id))];
      });
      setRedditAfter(data.data?.after || null);
    } catch {
      // silently fail on load-more
    }
    setLoadingMore(false);
  }, [loadingMore, redditAfter, source, activeSub, sort]);

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

  const fetchHN = async (sortBy: string, page = 0, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    setError("");
    try {
      const res = await fetch(`/api/hackernews?sort=${sortBy}&page=${page}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (append) {
        setHnStories((prev) => {
          const ids = new Set(prev.map((s) => s.id));
          return [...prev, ...data.items.filter((s: HNStory) => !ids.has(s.id))];
        });
      } else {
        setHnStories(data.items || []);
      }
      setHnHasMore(data.hasMore);
      setHnPage(page);
    } catch {
      setError("Couldn't load stories. Try again in a moment.");
    }
    if (!append) setLoading(false);
    else setLoadingMore(false);
  };

  const handleBookmarkHN = (e: React.MouseEvent, story: HNStory) => {
    e.preventDefault();
    e.stopPropagation();
    toggleBookmark({
      id: `hn_${story.id}`,
      type: "reddit", // reuse reddit type for display (has score, comments)
      title: story.title,
      url: story.url,
      savedAt: Date.now(),
      score: story.score,
      num_comments: story.comments,
    });
    setBookmarkTick((t) => t + 1);
  };

  useEffect(() => {
    if (source === "reddit") fetchPosts(activeSub, sort);
  }, [activeSub, sort, source]);

  useEffect(() => {
    if (source === "github") fetchGithub(ghLang, ghSince);
  }, [ghLang, ghSince, source]);

  useEffect(() => {
    if (source === "hackernews") { setHnPage(0); fetchHN(hnSort, 0); }
  }, [hnSort, source]);

  // Back to top visibility
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Infinite scroll observer
  const fetchMore = useCallback(() => {
    if (source === "reddit") fetchMorePosts();
    else if (source === "hackernews" && hnHasMore && !loadingMore) fetchHN(hnSort, hnPage + 1, true);
  }, [source, fetchMorePosts, hnHasMore, loadingMore, hnSort, hnPage]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) fetchMore(); },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [fetchMore]);

  const handleRefresh = () => {
    if (source === "reddit") fetchPosts(activeSub, sort);
    else if (source === "github") fetchGithub(ghLang, ghSince);
    else if (source === "hackernews") fetchHN(hnSort, 0);
  };

  const handleRetry = () => handleRefresh();

  const handlePostClick = (id: string) => {
    markAsRead(id);
    setReadIds((prev) => new Set(prev).add(id));
  };

  // Search + read filtering
  const q = searchQuery.toLowerCase().trim();
  const filteredPosts = posts
    .filter((p) => !q || p.title.toLowerCase().includes(q) || p.subreddit.toLowerCase().includes(q) || p.author.toLowerCase().includes(q) || (p.selftext && p.selftext.toLowerCase().includes(q)))
    .filter((p) => !hideRead || !readIds.has(`reddit_${p.id}`));
  const filteredRepos = repos
    .filter((r) => !q || r.name.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q)) || (r.language && r.language.toLowerCase().includes(q)))
    .filter((r) => !hideRead || !readIds.has(`github_${r.name}`));
  const filteredHN = hnStories
    .filter((s) => !q || s.title.toLowerCase().includes(q) || s.author.toLowerCase().includes(q) || s.domain.toLowerCase().includes(q))
    .filter((s) => !hideRead || !readIds.has(`hn_${s.id}`));
  const filteredSaved = savedItems
    .filter((i) => !q || i.title.toLowerCase().includes(q) || (i.description && i.description.toLowerCase().includes(q)) || (i.name && i.name.toLowerCase().includes(q)));

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
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
        @media (max-width: 768px) {
          .feed-header { padding: 0 16px !important; }
          .feed-container { padding: 20px 16px 60px !important; }
          .feed-card { padding: 16px !important; }
          .feed-vote { display: none !important; }
          .feed-meta { font-size: 10px !important; }
          .feed-title { font-size: 14px !important; }
          .source-toggle { gap: 4px !important; }
          .source-btn { font-size: 12px !important; padding: 6px 12px !important; }
          .search-bar { width: 140px !important; }
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
              : source === "github"
              ? <Github size={20} color={dark ? "#f59e0b" : "#0f172a"} />
              : source === "hackernews"
              ? <Flame size={20} color={dark ? "#f59e0b" : "#0f172a"} />
              : <BookmarkCheck size={20} color={dark ? "#f59e0b" : "#0f172a"} />
            }
            <span style={{
              fontSize: 18, fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              color: c.text,
            }}>Tech Feed</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Hide read toggle */}
          <button
            onClick={() => setHideRead(!hideRead)}
            title={hideRead ? "Show all posts" : "Hide read posts"}
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: hideRead
                ? (dark ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.1)")
                : (dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"),
              border: `1px solid ${hideRead ? (dark ? "#f59e0b" : "#3b82f6") : c.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              color: hideRead ? (dark ? "#f59e0b" : "#3b82f6") : c.textMuted,
              transition: "all 0.2s",
            }}
          >
            <Eye size={16} />
          </button>
          {/* Search bar */}
          <div className="search-bar" style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "6px 14px", borderRadius: 10,
            background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            border: `1px solid ${searchQuery ? (dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)") : c.border}`,
            transition: "all 0.2s",
            width: searchQuery ? 260 : 180,
          }}>
            <Search size={14} color={c.textMuted} style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search feeds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: "transparent", border: "none", outline: "none",
                color: c.text, fontSize: 13, fontWeight: 500,
                fontFamily: "'DM Sans', sans-serif",
                width: "100%",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: 0, display: "flex", color: c.textMuted, flexShrink: 0,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
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
          <button
            className="source-btn"
            onClick={() => setSource("hackernews")}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 20px", borderRadius: 9,
              border: "none",
              background: source === "hackernews" ? c.btnBg : "transparent",
              color: source === "hackernews" ? c.btnText : c.textMuted,
              fontSize: 13, fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            <Flame size={15} /> Hacker News
          </button>
          <button
            className="source-btn"
            onClick={() => setSource("saved")}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 20px", borderRadius: 9,
              border: "none",
              background: source === "saved" ? c.btnBg : "transparent",
              color: source === "saved" ? c.btnText : c.textMuted,
              fontSize: 13, fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              position: "relative",
            }}
          >
            <BookmarkCheck size={15} /> Saved
            {savedItems.length > 0 && (
              <span style={{
                fontSize: 10, fontWeight: 800, lineHeight: 1,
                padding: "2px 6px", borderRadius: 10,
                background: dark ? "#f59e0b" : "#3b82f6",
                color: "#fff",
              }}>{savedItems.length}</span>
            )}
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

        {/* Hacker News filters */}
        {source === "hackernews" && (
          <div style={{ display: "flex", gap: 6, marginBottom: 32, flexWrap: "wrap" }}>
            {(["top", "new", "best", "ask", "show"] as const).map((s) => (
              <button
                key={s}
                className="sort-btn"
                onClick={() => setHnSort(s)}
                style={{
                  padding: "8px 18px", borderRadius: 20,
                  border: hnSort === s ? `1px solid ${c.pillActiveBorder}` : `1px solid ${c.border}`,
                  background: hnSort === s ? c.pillActiveBg : c.surface,
                  color: hnSort === s ? c.pillActiveText : c.textMuted,
                  fontSize: 13, fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  textTransform: "capitalize",
                }}
              >
                {s === "ask" ? "Ask HN" : s === "show" ? "Show HN" : s}
              </button>
            ))}
          </div>
        )}

        {/* Loading state */}
        {loading && source !== "saved" && (
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
        {error && source !== "saved" && (
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
            {filteredPosts.map((post) => {
              const isVisited = readIds.has(`reddit_${post.id}`);
              return (
              <Link
                key={post.id}
                href={`/feed/post?permalink=${encodeURIComponent(post.permalink)}`}
                onClick={() => handlePostClick(`reddit_${post.id}`)}
                className="feed-card"
                style={{
                  display: "block", textDecoration: "none",
                  background: c.surface,
                  border: `1px solid ${c.borderLight}`,
                  borderRadius: 14,
                  padding: "20px 24px",
                  boxShadow: c.cardShadow,
                  opacity: isVisited ? 0.55 : 1,
                  transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
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
                      <button
                        onClick={(e) => handleBookmarkReddit(e, post)}
                        style={{
                          marginLeft: "auto", background: "none", border: "none",
                          cursor: "pointer", padding: 4, display: "flex",
                          color: isBookmarked(`reddit_${post.id}`) ? (dark ? "#f59e0b" : "#3b82f6") : c.textMuted,
                          transition: "color 0.2s",
                        }}
                        aria-label={isBookmarked(`reddit_${post.id}`) ? "Remove bookmark" : "Bookmark"}
                      >
                        {isBookmarked(`reddit_${post.id}`) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                      </button>
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
                        <>
                          <span style={{
                            display: "flex", alignItems: "center", gap: 4,
                            fontSize: 11, color: c.textMuted,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}>
                            <ExternalLink size={12} /> {post.domain}
                          </span>
                          <Link
                            href={`/reader?url=${encodeURIComponent(post.url)}`}
                            onClick={(e) => { e.stopPropagation(); handlePostClick(`reddit_${post.id}`); }}
                            style={{
                              display: "flex", alignItems: "center", gap: 4,
                              fontSize: 11, color: dark ? "#f59e0b" : "#3b82f6",
                              fontFamily: "'JetBrains Mono', monospace",
                              textDecoration: "none", fontWeight: 600,
                            }}
                          >
                            <BookOpen size={12} /> Reader
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
              );
            })}

            {/* Infinite scroll sentinel + loading indicator */}
            {redditAfter && (
              <div ref={sentinelRef} style={{ padding: "24px 0", textAlign: "center" }}>
                {loadingMore && (
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    color: c.textMuted, fontSize: 13,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    <RefreshCw size={14} className="spin" /> Loading more...
                  </div>
                )}
              </div>
            )}
            {!redditAfter && filteredPosts.length > 0 && (
              <div style={{
                padding: "24px 0", textAlign: "center",
                color: c.textMuted, fontSize: 12,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                You&apos;ve reached the end
              </div>
            )}
          </div>
        )}

        {/* GitHub Repos */}
        {!loading && !error && source === "github" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredRepos.map((repo) => (
              <a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handlePostClick(`github_${repo.name}`)}
                className="feed-card"
                style={{
                  display: "block", textDecoration: "none",
                  background: c.surface,
                  border: `1px solid ${c.borderLight}`,
                  borderRadius: 14,
                  padding: "20px 24px",
                  boxShadow: c.cardShadow,
                  opacity: readIds.has(`github_${repo.name}`) ? 0.55 : 1,
                  transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
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
                      <button
                        onClick={(e) => handleBookmarkGithub(e, repo)}
                        style={{
                          marginLeft: "auto", background: "none", border: "none",
                          cursor: "pointer", padding: 4, display: "flex",
                          color: isBookmarked(`github_${repo.name}`) ? (dark ? "#f59e0b" : "#3b82f6") : c.textMuted,
                          transition: "color 0.2s",
                        }}
                        aria-label={isBookmarked(`github_${repo.name}`) ? "Remove bookmark" : "Bookmark"}
                      >
                        {isBookmarked(`github_${repo.name}`) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                      </button>
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

        {/* Hacker News Stories */}
        {!loading && !error && source === "hackernews" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredHN.map((story) => (
              <a
                key={story.id}
                href={story.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handlePostClick(`hn_${story.id}`)}
                className="feed-card"
                style={{
                  display: "block", textDecoration: "none",
                  background: c.surface,
                  border: `1px solid ${c.borderLight}`,
                  borderRadius: 14,
                  padding: "20px 24px",
                  boxShadow: c.cardShadow,
                  opacity: readIds.has(`hn_${story.id}`) ? 0.55 : 1,
                  transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div className="feed-vote" style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    minWidth: 48, paddingTop: 2,
                  }}>
                    <ArrowUp size={16} color={dark ? "#f59e0b" : "#ff6600"} />
                    <span style={{
                      fontSize: 14, fontWeight: 700, color: c.text,
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}>{formatScore(story.score)}</span>
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: dark ? "#ff6600" : "#ff6600",
                        fontFamily: "'JetBrains Mono', monospace",
                        textTransform: "uppercase", letterSpacing: 0.5,
                      }}>HN</span>
                      <span style={{
                        fontSize: 11, color: c.textMuted,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>by {story.author}</span>
                      <button
                        onClick={(e) => handleBookmarkHN(e, story)}
                        style={{
                          marginLeft: "auto", background: "none", border: "none",
                          cursor: "pointer", padding: 4, display: "flex",
                          color: isBookmarked(`hn_${story.id}`) ? (dark ? "#f59e0b" : "#3b82f6") : c.textMuted,
                          transition: "color 0.2s",
                        }}
                        aria-label={isBookmarked(`hn_${story.id}`) ? "Remove bookmark" : "Bookmark"}
                      >
                        {isBookmarked(`hn_${story.id}`) ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
                      </button>
                    </div>

                    <h3 className="feed-title" style={{
                      fontSize: 16, fontWeight: 700, color: c.text,
                      fontFamily: "'Space Grotesk', sans-serif",
                      lineHeight: 1.4, margin: "0 0 10px",
                    }}>{story.title}</h3>

                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <span style={{
                        display: "flex", alignItems: "center", gap: 4,
                        fontSize: 12, color: c.textMuted,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        <MessageSquare size={13} /> {story.comments}
                      </span>
                      <span style={{
                        display: "flex", alignItems: "center", gap: 4,
                        fontSize: 12, color: c.textMuted,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>
                        <Clock size={13} /> {timeAgo(story.time)}
                      </span>
                      {!story.isSelf && (
                        <>
                          <span style={{
                            display: "flex", alignItems: "center", gap: 4,
                            fontSize: 11, color: c.textMuted,
                            fontFamily: "'JetBrains Mono', monospace",
                            marginLeft: "auto",
                          }}>
                            <ExternalLink size={12} /> {story.domain}
                          </span>
                          <Link
                            href={`/reader?url=${encodeURIComponent(story.url)}`}
                            onClick={(e) => { e.stopPropagation(); handlePostClick(`hn_${story.id}`); }}
                            style={{
                              display: "flex", alignItems: "center", gap: 4,
                              fontSize: 11, color: dark ? "#f59e0b" : "#3b82f6",
                              fontFamily: "'JetBrains Mono', monospace",
                              textDecoration: "none", fontWeight: 600,
                            }}
                          >
                            <BookOpen size={12} /> Reader
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </a>
            ))}

            {/* Infinite scroll sentinel for HN */}
            {hnHasMore && (
              <div ref={sentinelRef} style={{ padding: "24px 0", textAlign: "center" }}>
                {loadingMore && (
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    color: c.textMuted, fontSize: 13,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    <RefreshCw size={14} className="spin" /> Loading more...
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Saved items */}
        {source === "saved" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredSaved.length === 0 && (
              <div style={{
                textAlign: "center", padding: "60px 20px",
                color: c.textMuted, fontFamily: "'JetBrains Mono', monospace", fontSize: 14,
              }}>
                <BookmarkCheck size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                <br />
                {q ? `No saved items matching "${searchQuery}"` : "No saved items yet. Bookmark posts or repos to see them here."}
              </div>
            )}
            {filteredSaved.map((item) => (
              <div
                key={item.id}
                className="feed-card"
                style={{
                  display: "block",
                  background: c.surface,
                  border: `1px solid ${c.borderLight}`,
                  borderRadius: 14,
                  padding: "20px 24px",
                  boxShadow: c.cardShadow,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  {/* Type badge */}
                  <div className="feed-vote" style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    minWidth: 48, paddingTop: 2,
                  }}>
                    {item.type === "reddit" ? (
                      <>
                        <ArrowUp size={16} color={c.textMuted} />
                        <span style={{
                          fontSize: 14, fontWeight: 700, color: c.text,
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}>{formatScore(item.score || 0)}</span>
                      </>
                    ) : (
                      <>
                        <Star size={16} color={dark ? "#f59e0b" : "#eab308"} />
                        <span style={{
                          fontSize: 14, fontWeight: 700, color: c.text,
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}>{formatScore(item.stars || 0)}</span>
                      </>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    {/* Meta row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                        background: item.type === "reddit"
                          ? (dark ? "rgba(239,68,68,0.15)" : "rgba(239,68,68,0.1)")
                          : (dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"),
                        color: item.type === "reddit" ? "#ef4444" : c.textSecondary,
                        fontFamily: "'JetBrains Mono', monospace",
                        textTransform: "uppercase", letterSpacing: 0.5,
                      }}>{item.type === "reddit" ? "Reddit" : "GitHub"}</span>
                      {item.type === "reddit" && item.subreddit && (
                        <span style={{
                          fontSize: 11, fontWeight: 600, color: dark ? "#f59e0b" : "#3b82f6",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>r/{item.subreddit}</span>
                      )}
                      {item.type === "github" && item.name && (
                        <span style={{
                          fontSize: 11, fontWeight: 600, color: dark ? "#f59e0b" : "#3b82f6",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>{item.name}</span>
                      )}
                      <span style={{ fontSize: 11, color: c.textMuted }}>·</span>
                      <span style={{
                        fontSize: 11, color: c.textMuted,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}>saved {timeAgo(Math.floor(item.savedAt / 1000))}</span>

                      {/* Remove button */}
                      <button
                        onClick={() => handleRemoveSaved(item.id)}
                        style={{
                          marginLeft: "auto", background: "none", border: "none",
                          cursor: "pointer", padding: 4, display: "flex",
                          color: c.textMuted, transition: "color 0.2s",
                        }}
                        aria-label="Remove bookmark"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Title as link */}
                    {item.type === "reddit" && item.permalink ? (
                      <Link href={`/feed/post?permalink=${encodeURIComponent(item.permalink)}`} style={{ textDecoration: "none" }}>
                        <h3 className="feed-title" style={{
                          fontSize: 16, fontWeight: 700, color: c.text,
                          fontFamily: "'Space Grotesk', sans-serif",
                          lineHeight: 1.4, margin: "0 0 8px",
                        }}>{item.title}</h3>
                      </Link>
                    ) : (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                        <h3 className="feed-title" style={{
                          fontSize: 16, fontWeight: 700, color: c.text,
                          fontFamily: "'Space Grotesk', sans-serif",
                          lineHeight: 1.4, margin: "0 0 8px",
                        }}>{item.title}</h3>
                      </a>
                    )}

                    {/* Description/selftext */}
                    {(item.selftext || item.description) && (
                      <p style={{
                        fontSize: 13, color: c.textSecondary, lineHeight: 1.6,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                        overflow: "hidden", margin: "0 0 10px",
                      }}>{item.selftext || item.description}</p>
                    )}

                    {/* Bottom meta */}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      {item.type === "reddit" && (
                        <span style={{
                          display: "flex", alignItems: "center", gap: 4,
                          fontSize: 12, color: c.textMuted,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>
                          <MessageSquare size={13} /> {item.num_comments || 0}
                        </span>
                      )}
                      {item.type === "github" && item.language && (
                        <span style={{
                          display: "flex", alignItems: "center", gap: 6,
                          fontSize: 12, color: c.textMuted,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>
                          <span style={{
                            width: 10, height: 10, borderRadius: "50%",
                            background: item.languageColor || c.textMuted,
                            flexShrink: 0,
                          }} />
                          {item.language}
                        </span>
                      )}
                      {item.type === "github" && (
                        <span style={{
                          display: "flex", alignItems: "center", gap: 4,
                          fontSize: 12, color: c.textMuted,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>
                          <GitFork size={13} /> {formatScore(item.forks || 0)}
                        </span>
                      )}
                      <a
                        href={item.type === "reddit" ? `https://reddit.com${item.permalink}` : item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          fontSize: 11, color: c.textMuted,
                          fontFamily: "'JetBrains Mono', monospace",
                          textDecoration: "none", marginLeft: "auto",
                        }}
                      >
                        <ExternalLink size={12} /> {item.type === "reddit" ? "reddit.com" : "github.com"}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && source !== "saved" && (
          (source === "reddit" && filteredPosts.length === 0) ||
          (source === "github" && filteredRepos.length === 0) ||
          (source === "hackernews" && filteredHN.length === 0)
        ) && (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            color: c.textMuted, fontFamily: "'JetBrains Mono', monospace", fontSize: 14,
          }}>
            {q
              ? `No results for "${searchQuery}"`
              : source === "reddit"
              ? "No posts found. Try a different subreddit or sort."
              : source === "hackernews"
              ? "No stories found. Try a different category."
              : "No trending repos found. Try a different language or time range."}
          </div>
        )}
      </div>

      {/* Back to top button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        style={{
          position: "fixed", bottom: 32, right: 32, zIndex: 200,
          width: 48, height: 48, borderRadius: 14,
          background: c.btnBg, color: c.btnText,
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          opacity: showTop ? 1 : 0,
          pointerEvents: showTop ? "auto" : "none",
          transform: showTop ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.3s, transform 0.3s",
        }}
      >
        <ArrowUp size={20} />
      </button>
    </div>
  );
}
