"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, MessageSquare, ArrowUp, Clock, RefreshCw, Moon, Sun, Rss, Star, GitFork, TrendingUp, Github, Bookmark, BookmarkCheck, Trash2, Search, X, Flame, BookOpen, Eye, Settings, Plus, Download, Bell, Share2, Hash, Keyboard, Copy, Check } from "lucide-react";
import { useTheme, darkColors } from "../theme-context";
import { type BookmarkItem, getBookmarks, isBookmarked, toggleBookmark, removeBookmark } from "../bookmarks";
import { markAsRead, getReadIds } from "../reading-history";
import Onboarding from "../onboarding";

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

// Custom feed storage
const CUSTOM_SUBS_KEY = "byteshift_custom_subs";
const CUSTOM_LANGS_KEY = "byteshift_custom_langs";
const LAST_VISIT_KEY = "byteshift_last_visit";

function getCustomSubs(): { name: string; label: string }[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(CUSTOM_SUBS_KEY) || "[]"); } catch { return []; }
}
function saveCustomSubs(subs: { name: string; label: string }[]) {
  localStorage.setItem(CUSTOM_SUBS_KEY, JSON.stringify(subs));
}
function getCustomLangs(): { name: string; label: string }[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(CUSTOM_LANGS_KEY) || "[]"); } catch { return []; }
}
function saveCustomLangs(langs: { name: string; label: string }[]) {
  localStorage.setItem(CUSTOM_LANGS_KEY, JSON.stringify(langs));
}
function getLastVisit(): number {
  if (typeof window === "undefined") return Date.now();
  return parseInt(localStorage.getItem(LAST_VISIT_KEY) || "0", 10);
}
function updateLastVisit() {
  localStorage.setItem(LAST_VISIT_KEY, String(Math.floor(Date.now() / 1000)));
}

function exportAsJSON(items: BookmarkItem[]) {
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "byteshift-bookmarks.json"; a.click();
  URL.revokeObjectURL(url);
}

function exportAsMarkdown(items: BookmarkItem[]) {
  let md = "# ByteShift Saved Items\n\n";
  md += `Exported on ${new Date().toLocaleDateString()}\n\n`;
  const reddit = items.filter((i) => i.type === "reddit");
  const github = items.filter((i) => i.type === "github");
  if (reddit.length > 0) {
    md += "## Reddit Posts\n\n";
    reddit.forEach((i) => {
      md += `- **[${i.title}](${i.permalink ? `https://reddit.com${i.permalink}` : i.url})** — r/${i.subreddit || "unknown"} · ${i.score || 0} pts · ${i.num_comments || 0} comments\n`;
    });
    md += "\n";
  }
  if (github.length > 0) {
    md += "## GitHub Repos\n\n";
    github.forEach((i) => {
      md += `- **[${i.name || i.title}](${i.url})** — ${i.language || "N/A"} · ⭐ ${i.stars || 0} · ${i.description || ""}\n`;
    });
    md += "\n";
  }
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "byteshift-bookmarks.md"; a.click();
  URL.revokeObjectURL(url);
}

const DEFAULT_SUBREDDITS = [
  { name: "technology", label: "Technology" },
  { name: "programming", label: "Programming" },
  { name: "webdev", label: "Web Dev" },
  { name: "artificial", label: "AI" },
  { name: "gamedev", label: "Game Dev" },
  { name: "linux", label: "Linux" },
  { name: "PinoyProgrammer", label: "Pinoy Dev" },
  { name: "ITPhilippines", label: "IT Philippines" },
];

const DEFAULT_LANGUAGES = [
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
  const [customSubs, setCustomSubs] = useState<{ name: string; label: string }[]>([]);
  const [customLangs, setCustomLangs] = useState<{ name: string; label: string }[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newLangName, setNewLangName] = useState("");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [newPostCount, setNewPostCount] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  const c = darkColors(dark);

  // Load reading history
  useEffect(() => {
    setReadIds(getReadIds());
  }, []);

  // Load custom feeds
  useEffect(() => {
    setCustomSubs(getCustomSubs());
    setCustomLangs(getCustomLangs());
  }, []);

  // Notification badge — count posts newer than last visit
  useEffect(() => {
    const lastVisit = getLastVisit();
    if (lastVisit > 0 && posts.length > 0) {
      const count = posts.filter((p) => p.created_utc > lastVisit).length;
      setNewPostCount(count);
    }
    // Update last visit timestamp when leaving
    return () => { updateLastVisit(); };
  }, [posts]);

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

  // Merge default + custom feeds
  const allSubs = [...DEFAULT_SUBREDDITS, ...customSubs];
  const allLangs = [...DEFAULT_LANGUAGES, ...customLangs];

  const addCustomSub = () => {
    const name = newSubName.trim();
    if (!name) return;
    if (allSubs.some((s) => s.name.toLowerCase() === name.toLowerCase())) return;
    const updated = [...customSubs, { name, label: name }];
    setCustomSubs(updated);
    saveCustomSubs(updated);
    setNewSubName("");
  };

  const removeCustomSub = (name: string) => {
    const updated = customSubs.filter((s) => s.name !== name);
    setCustomSubs(updated);
    saveCustomSubs(updated);
    if (activeSub === name) setActiveSub("technology");
  };

  const addCustomLang = () => {
    const name = newLangName.trim().toLowerCase();
    if (!name) return;
    if (allLangs.some((l) => l.name.toLowerCase() === name)) return;
    const label = name.charAt(0).toUpperCase() + name.slice(1);
    const updated = [...customLangs, { name, label }];
    setCustomLangs(updated);
    saveCustomLangs(updated);
    setNewLangName("");
  };

  const removeCustomLang = (name: string) => {
    const updated = customLangs.filter((l) => l.name !== name);
    setCustomLangs(updated);
    saveCustomLangs(updated);
    if (ghLang === name) setGhLang("");
  };

  const handlePostClick = (id: string) => {
    markAsRead(id);
    setReadIds((prev) => new Set(prev).add(id));
  };

  const handleShare = async (title: string, url: string, id: string) => {
    const text = `${title}\n${url}\n\nShared via ByteShift`;
    if (navigator.share) {
      try { await navigator.share({ title, url, text }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const sources: Array<"reddit" | "github" | "hackernews" | "saved"> = ["reddit", "github", "hackernews", "saved"];
      switch (e.key) {
        case "1": case "2": case "3": case "4":
          e.preventDefault();
          setSource(sources[parseInt(e.key) - 1]);
          break;
        case "r":
          e.preventDefault();
          handleRefresh();
          break;
        case "/":
          e.preventDefault();
          (document.querySelector(".search-input") as HTMLInputElement)?.focus();
          break;
        case "?":
          e.preventDefault();
          setShowShortcuts((p) => !p);
          break;
        case "Escape":
          setShowShortcuts(false);
          setShowSettings(false);
          setShowExportMenu(false);
          break;
        case "j":
          e.preventDefault();
          setFocusedIndex((p) => p + 1);
          break;
        case "k":
          e.preventDefault();
          setFocusedIndex((p) => Math.max(p - 1, 0));
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Scroll focused card into view
  useEffect(() => {
    if (focusedIndex < 0) return;
    const cards = document.querySelectorAll(".feed-card");
    if (cards[focusedIndex]) {
      cards[focusedIndex].scrollIntoView({ behavior: "smooth", block: "center" });
      (cards[focusedIndex] as HTMLElement).style.outline = `2px solid ${dark ? "#f59e0b" : "#3b82f6"}`;
      (cards[focusedIndex] as HTMLElement).style.outlineOffset = "2px";
    }
    // Clear outline from previous
    cards.forEach((card, i) => {
      if (i !== focusedIndex) {
        (card as HTMLElement).style.outline = "none";
      }
    });
  }, [focusedIndex, dark]);

  // Extract trending topics from current posts
  const trendingTopics = (() => {
    const words: Record<string, number> = {};
    const stopWords = new Set(["the", "a", "an", "is", "it", "in", "to", "for", "of", "and", "on", "with", "my", "i", "this", "that", "was", "are", "be", "has", "have", "how", "what", "why", "from", "or", "not", "but", "all", "just", "your", "you", "can", "do", "will", "about", "its"]);
    const allTitles = [
      ...posts.map((p) => p.title),
      ...hnStories.map((s) => s.title),
    ];
    allTitles.forEach((title) => {
      title.toLowerCase().split(/\W+/).forEach((w) => {
        if (w.length > 3 && !stopWords.has(w) && !/^\d+$/.test(w)) {
          words[w] = (words[w] || 0) + 1;
        }
      });
    });
    return Object.entries(words)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([word, count]) => ({ word, count }));
  })();

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
      background: dark
        ? `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(245,158,11,0.05) 0%, transparent 60%), ${c.bg}`
        : `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59,130,246,0.04) 0%, transparent 60%), ${c.bg}`,
      color: c.text,
      fontFamily: "'DM Sans', sans-serif",
      transition: "background 0.3s, color 0.3s",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: ${c.selectionBg}; color: ${c.selectionColor}; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"}; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: ${dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.2)"}; }

        .feed-card {
          transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
          position: relative;
        }
        .feed-card::before {
          content: '';
          position: absolute; left: 0; top: 12px; bottom: 12px; width: 3px;
          background: transparent; border-radius: 2px;
          transition: background 0.3s;
        }
        .feed-card:hover {
          transform: translateY(-3px) scale(1.003);
          box-shadow: ${dark
            ? "0 12px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(245,158,11,0.08)"
            : "0 12px 40px rgba(0,0,0,0.08), 0 2px 8px rgba(59,130,246,0.06)"};
        }
        .feed-card:hover::before {
          background: ${dark ? "#f59e0b" : "#3b82f6"};
        }

        .sub-pill {
          transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        .sub-pill::after {
          content: '';
          position: absolute; inset: 0;
          background: ${dark ? "rgba(245,158,11,0.08)" : "rgba(59,130,246,0.06)"};
          opacity: 0; transition: opacity 0.25s;
        }
        .sub-pill:hover::after { opacity: 1; }
        .sub-pill:hover { transform: translateY(-1px); }
        .sub-pill:active { transform: scale(0.97); }

        .sort-btn {
          transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
          cursor: pointer;
        }
        .sort-btn:hover { transform: translateY(-1px); }
        .sort-btn:active { transform: scale(0.96); }

        .source-btn {
          transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
          cursor: pointer;
          position: relative;
        }
        .source-btn:hover { transform: translateY(-1px); }
        .source-btn:active { transform: scale(0.97); }

        .header-btn {
          transition: all 0.2s cubic-bezier(0.22,1,0.36,1);
        }
        .header-btn:hover {
          transform: translateY(-1px);
          background: ${dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)"} !important;
        }
        .header-btn:active { transform: scale(0.93); }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .feed-card { animation: fadeInUp 0.4s cubic-bezier(0.22,1,0.36,1) backwards; }
        .feed-card:nth-child(1) { animation-delay: 0s; }
        .feed-card:nth-child(2) { animation-delay: 0.04s; }
        .feed-card:nth-child(3) { animation-delay: 0.08s; }
        .feed-card:nth-child(4) { animation-delay: 0.12s; }
        .feed-card:nth-child(5) { animation-delay: 0.16s; }
        .feed-card:nth-child(6) { animation-delay: 0.2s; }
        .feed-card:nth-child(n+7) { animation-delay: 0.24s; }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(90deg,
            ${dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"} 25%,
            ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"} 50%,
            ${dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"} 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }

        .search-bar {
          transition: all 0.3s cubic-bezier(0.22,1,0.36,1) !important;
        }
        .search-bar:focus-within {
          width: 280px !important;
          border-color: ${dark ? "rgba(245,158,11,0.4)" : "rgba(59,130,246,0.4)"} !important;
          box-shadow: 0 0 0 3px ${dark ? "rgba(245,158,11,0.08)" : "rgba(59,130,246,0.06)"};
        }

        @media (max-width: 768px) {
          .feed-header { padding: 0 16px !important; }
          .feed-container { padding: 20px 16px 60px !important; }
          .feed-card { padding: 16px !important; }
          .feed-card::before { display: none; }
          .feed-vote { display: none !important; }
          .feed-meta { font-size: 10px !important; }
          .feed-title { font-size: 14px !important; }
          .source-toggle { gap: 4px !important; overflow-x: auto; width: 100% !important; }
          .source-btn { font-size: 12px !important; padding: 6px 12px !important; white-space: nowrap; }
          .search-bar { width: 120px !important; }
          .search-bar:focus-within { width: 180px !important; }
          .header-actions { gap: 6px !important; }
          .header-btn-text { display: none !important; }
        }
      `}</style>

      {/* Header */}
      <header className="feed-header" style={{
        position: "sticky", top: 0, zIndex: 100,
        background: dark ? "rgba(10,10,15,0.85)" : "rgba(255,255,255,0.85)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
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
            className="header-btn"
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: hideRead
                ? (dark ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.1)")
                : (dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"),
              border: `1px solid ${hideRead ? (dark ? "#f59e0b" : "#3b82f6") : c.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
              color: hideRead ? (dark ? "#f59e0b" : "#3b82f6") : c.textMuted,
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
              className="search-input"
              placeholder="Search feeds... ( / )"
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
          <button
            onClick={() => setShowSettings(true)}
            aria-label="Feed settings"
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              border: `1px solid ${c.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: c.textSecondary,
            }}
          >
            <Settings size={16} />
          </button>
          <button
            onClick={() => setShowShortcuts(true)}
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              border: `1px solid ${c.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: c.textMuted,
              fontSize: 15, fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ?
          </button>
        </div>
      </header>

      <div className="feed-container" style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* Source toggle */}
        <div className="source-toggle" style={{
          display: "flex", gap: 4, marginBottom: 28,
          padding: 5, borderRadius: 14,
          background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          border: `1px solid ${c.borderLight}`,
          width: "fit-content",
          boxShadow: dark ? "inset 0 1px 3px rgba(0,0,0,0.3)" : "inset 0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <button
            className="source-btn"
            onClick={() => setSource("reddit")}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 20px", borderRadius: 10,
              border: "none",
              background: source === "reddit" ? c.btnBg : "transparent",
              color: source === "reddit" ? c.btnText : c.textMuted,
              fontSize: 13, fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              boxShadow: source === "reddit" ? (dark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.1)") : "none",
            }}
          >
            <Rss size={15} /> Reddit
            {newPostCount > 0 && source !== "reddit" && (
              <span style={{
                fontSize: 10, fontWeight: 800, lineHeight: 1,
                padding: "2px 6px", borderRadius: 10,
                background: "#ef4444", color: "#fff",
              }}>{newPostCount > 99 ? "99+" : newPostCount}</span>
            )}
          </button>
          <button
            className="source-btn"
            onClick={() => setSource("github")}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 20px", borderRadius: 10,
              border: "none",
              background: source === "github" ? c.btnBg : "transparent",
              color: source === "github" ? c.btnText : c.textMuted,
              fontSize: 13, fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              boxShadow: source === "github" ? (dark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.1)") : "none",
            }}
          >
            <Github size={15} /> GitHub Trending
          </button>
          <button
            className="source-btn"
            onClick={() => setSource("hackernews")}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 20px", borderRadius: 10,
              border: "none",
              background: source === "hackernews" ? c.btnBg : "transparent",
              color: source === "hackernews" ? c.btnText : c.textMuted,
              fontSize: 13, fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              boxShadow: source === "hackernews" ? (dark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.1)") : "none",
            }}
          >
            <Flame size={15} /> Hacker News
          </button>
          <button
            className="source-btn"
            onClick={() => setSource("saved")}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 20px", borderRadius: 10,
              border: "none",
              background: source === "saved" ? c.btnBg : "transparent",
              color: source === "saved" ? c.btnText : c.textMuted,
              fontSize: 13, fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              position: "relative",
              boxShadow: source === "saved" ? (dark ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.1)") : "none",
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

        {/* Trending Topics */}
        {trendingTopics.length > 0 && (source === "reddit" || source === "hackernews") && (
          <div style={{
            display: "flex", gap: 8, marginBottom: 20,
            overflowX: "auto", paddingBottom: 4,
            WebkitOverflowScrolling: "touch",
          }}>
            <span style={{
              display: "flex", alignItems: "center", gap: 4,
              fontSize: 11, fontWeight: 700, color: c.textMuted,
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: "uppercase", letterSpacing: 1,
              flexShrink: 0, paddingRight: 4,
            }}>
              <Hash size={12} /> Trending
            </span>
            {trendingTopics.map((t) => (
              <button
                key={t.word}
                onClick={() => setSearchQuery(t.word)}
                style={{
                  padding: "4px 12px", borderRadius: 14,
                  border: `1px solid ${searchQuery === t.word ? (dark ? "#f59e0b" : "#3b82f6") : c.border}`,
                  background: searchQuery === t.word
                    ? (dark ? "rgba(245,158,11,0.15)" : "rgba(59,130,246,0.1)")
                    : (dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)"),
                  color: searchQuery === t.word ? (dark ? "#f59e0b" : "#3b82f6") : c.textMuted,
                  fontSize: 12, fontWeight: 500, cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  whiteSpace: "nowrap", flexShrink: 0,
                  transition: "all 0.2s",
                }}
              >
                {t.word}
              </button>
            ))}
          </div>
        )}

        {/* Reddit filters */}
        {source === "reddit" && (
          <>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
              {allSubs.map((sub) => (
                <div key={sub.name} style={{ position: "relative", display: "inline-flex" }}>
                  <button
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
                  {customSubs.some((cs) => cs.name === sub.name) && (
                    <button
                      onClick={() => removeCustomSub(sub.name)}
                      style={{
                        position: "absolute", top: -6, right: -6,
                        width: 18, height: 18, borderRadius: "50%",
                        background: dark ? "#ef4444" : "#dc2626",
                        color: "#fff", border: "none", cursor: "pointer",
                        fontSize: 10, fontWeight: 800,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        lineHeight: 1,
                      }}
                    >×</button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setShowSettings(true)}
                className="sub-pill"
                style={{
                  padding: "8px 14px", borderRadius: 20,
                  border: `1px dashed ${c.border}`,
                  background: "transparent",
                  color: c.textMuted, fontSize: 13, fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 4,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <Plus size={14} /> Add
              </button>
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
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20, alignItems: "center" }}>
              {allLangs.map((lang) => (
                <div key={lang.name || "__all"} style={{ position: "relative", display: "inline-flex" }}>
                  <button
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
                  {customLangs.some((cl) => cl.name === lang.name) && (
                    <button
                      onClick={() => removeCustomLang(lang.name)}
                      style={{
                        position: "absolute", top: -6, right: -6,
                        width: 18, height: 18, borderRadius: "50%",
                        background: dark ? "#ef4444" : "#dc2626",
                        color: "#fff", border: "none", cursor: "pointer",
                        fontSize: 10, fontWeight: 800,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        lineHeight: 1,
                      }}
                    >×</button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setShowSettings(true)}
                className="sub-pill"
                style={{
                  padding: "8px 14px", borderRadius: 20,
                  border: `1px dashed ${c.border}`,
                  background: "transparent",
                  color: c.textMuted, fontSize: 13, fontWeight: 600,
                  display: "flex", alignItems: "center", gap: 4,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <Plus size={14} /> Add
              </button>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                background: c.surface, border: `1px solid ${c.borderLight}`,
                borderRadius: 16, padding: "24px 28px",
                opacity: 1 - i * 0.08,
                animation: `fadeInUp 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 0.06}s backwards`,
              }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                  <div className="skeleton-shimmer" style={{ height: 12, width: 80, borderRadius: 6 }} />
                  <div className="skeleton-shimmer" style={{ height: 12, width: 50, borderRadius: 6 }} />
                </div>
                <div className="skeleton-shimmer" style={{ height: 18, width: `${70 - i * 5}%`, borderRadius: 8, marginBottom: 10 }} />
                <div className="skeleton-shimmer" style={{ height: 14, width: `${50 - i * 3}%`, borderRadius: 6, marginBottom: 16 }} />
                <div style={{ display: "flex", gap: 16 }}>
                  <div className="skeleton-shimmer" style={{ height: 12, width: 40, borderRadius: 6 }} />
                  <div className="skeleton-shimmer" style={{ height: 12, width: 50, borderRadius: 6 }} />
                  <div className="skeleton-shimmer" style={{ height: 12, width: 70, borderRadius: 6 }} />
                </div>
              </div>
            ))}
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
                  borderRadius: 16,
                  padding: "22px 26px",
                  boxShadow: dark ? "0 2px 12px rgba(0,0,0,0.2)" : "0 2px 12px rgba(0,0,0,0.04)",
                  opacity: isVisited ? 0.5 : 1,
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
                        display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical",
                        overflow: "hidden", margin: "0 0 10px",
                      }}>{post.selftext}</p>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                      {post.num_comments > 50 && (
                        <span style={{
                          display: "flex", alignItems: "center", gap: 4,
                          fontSize: 11, fontWeight: 700,
                          color: dark ? "#f59e0b" : "#ea580c",
                          fontFamily: "'JetBrains Mono', monospace",
                          padding: "2px 8px", borderRadius: 4,
                          background: dark ? "rgba(245,158,11,0.12)" : "rgba(234,88,12,0.08)",
                        }}>
                          🔥 Hot
                        </span>
                      )}
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
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShare(post.title, `https://reddit.com${post.permalink}`, `reddit_${post.id}`); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          fontSize: 11, color: copiedId === `reddit_${post.id}` ? "#10b981" : c.textMuted,
                          fontFamily: "'JetBrains Mono', monospace",
                          background: "none", border: "none", cursor: "pointer",
                          marginLeft: "auto", padding: 0,
                          transition: "color 0.2s",
                        }}
                      >
                        {copiedId === `reddit_${post.id}` ? <><Check size={12} /> Copied</> : <><Share2 size={12} /> Share</>}
                      </button>
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
                  borderRadius: 16,
                  padding: "22px 26px",
                  boxShadow: dark ? "0 2px 12px rgba(0,0,0,0.2)" : "0 2px 12px rgba(0,0,0,0.04)",
                  opacity: readIds.has(`github_${repo.name}`) ? 0.5 : 1,
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
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShare(repo.name, repo.url, `github_${repo.name}`); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          fontSize: 11, color: copiedId === `github_${repo.name}` ? "#10b981" : c.textMuted,
                          fontFamily: "'JetBrains Mono', monospace",
                          background: "none", border: "none", cursor: "pointer",
                          padding: 0, transition: "color 0.2s",
                        }}
                      >
                        {copiedId === `github_${repo.name}` ? <><Check size={12} /> Copied</> : <><Share2 size={12} /> Share</>}
                      </button>
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
                  borderRadius: 16,
                  padding: "22px 26px",
                  boxShadow: dark ? "0 2px 12px rgba(0,0,0,0.2)" : "0 2px 12px rgba(0,0,0,0.04)",
                  opacity: readIds.has(`hn_${story.id}`) ? 0.5 : 1,
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
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShare(story.title, story.hnUrl, `hn_${story.id}`); }}
                        style={{
                          display: "flex", alignItems: "center", gap: 4,
                          fontSize: 11, color: copiedId === `hn_${story.id}` ? "#10b981" : c.textMuted,
                          fontFamily: "'JetBrains Mono', monospace",
                          background: "none", border: "none", cursor: "pointer",
                          padding: 0, transition: "color 0.2s",
                        }}
                      >
                        {copiedId === `hn_${story.id}` ? <><Check size={12} /> Copied</> : <><Share2 size={12} /> Share</>}
                      </button>
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
            {/* Export buttons */}
            {savedItems.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8, marginBottom: 4, position: "relative" }}>
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 14px", borderRadius: 8,
                    border: `1px solid ${c.border}`,
                    background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                    color: c.textSecondary, fontSize: 12, fontWeight: 600,
                    fontFamily: "'JetBrains Mono', monospace",
                    cursor: "pointer",
                  }}
                >
                  <Download size={14} /> Export
                </button>
                {showExportMenu && (
                  <div style={{
                    position: "absolute", top: "100%", right: 0, marginTop: 4,
                    background: c.surface, border: `1px solid ${c.borderLight}`,
                    borderRadius: 10, padding: 6, minWidth: 160,
                    boxShadow: "0 8px 30px rgba(0,0,0,0.15)", zIndex: 50,
                  }}>
                    <button
                      onClick={() => { exportAsJSON(savedItems); setShowExportMenu(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, width: "100%",
                        padding: "10px 14px", borderRadius: 8, border: "none",
                        background: "transparent", color: c.text,
                        fontSize: 13, fontWeight: 500, cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif", textAlign: "left",
                      }}
                    >
                      Export as JSON
                    </button>
                    <button
                      onClick={() => { exportAsMarkdown(savedItems); setShowExportMenu(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, width: "100%",
                        padding: "10px 14px", borderRadius: 8, border: "none",
                        background: "transparent", color: c.text,
                        fontSize: 13, fontWeight: 500, cursor: "pointer",
                        fontFamily: "'DM Sans', sans-serif", textAlign: "left",
                      }}
                    >
                      Export as Markdown
                    </button>
                  </div>
                )}
              </div>
            )}
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

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div
          onClick={() => setShowShortcuts(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 300,
            background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: c.surface, borderRadius: 16,
              border: `1px solid ${c.borderLight}`,
              padding: "32px 28px", maxWidth: 400, width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{
                fontSize: 18, fontWeight: 700, color: c.text,
                fontFamily: "'Space Grotesk', sans-serif",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <Keyboard size={20} /> Keyboard Shortcuts
              </h2>
              <button onClick={() => setShowShortcuts(false)} style={{ background: "none", border: "none", cursor: "pointer", color: c.textMuted, padding: 4, display: "flex" }}>
                <X size={20} />
              </button>
            </div>
            {[
              ["1 / 2 / 3 / 4", "Switch tabs"],
              ["J / K", "Navigate posts"],
              ["R", "Refresh feed"],
              ["/", "Focus search"],
              ["?", "Toggle shortcuts"],
              ["Esc", "Close modals"],
            ].map(([key, desc]) => (
              <div key={key} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "10px 0",
                borderBottom: `1px solid ${c.borderLight}`,
              }}>
                <span style={{ fontSize: 13, color: c.textSecondary, fontFamily: "'DM Sans', sans-serif" }}>{desc}</span>
                <kbd style={{
                  padding: "4px 10px", borderRadius: 6,
                  background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                  border: `1px solid ${c.border}`,
                  fontSize: 12, fontWeight: 600, color: c.text,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>{key}</kbd>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div
          onClick={() => setShowSettings(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 300,
            background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: c.surface, borderRadius: 16,
              border: `1px solid ${c.borderLight}`,
              padding: "32px 28px", maxWidth: 480, width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              maxHeight: "80vh", overflowY: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{
                fontSize: 20, fontWeight: 700, color: c.text,
                fontFamily: "'Space Grotesk', sans-serif",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <Settings size={20} /> Customize Feed
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: c.textMuted, padding: 4, display: "flex",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Add Subreddit */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                fontSize: 12, fontWeight: 700, color: c.textSecondary,
                fontFamily: "'JetBrains Mono', monospace",
                textTransform: "uppercase", letterSpacing: 1,
                display: "block", marginBottom: 10,
              }}>Add Subreddit</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="e.g. reactjs"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addCustomSub(); }}
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: 8,
                    border: `1px solid ${c.border}`, background: c.bg,
                    color: c.text, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                    outline: "none",
                  }}
                />
                <button
                  onClick={addCustomSub}
                  style={{
                    padding: "10px 18px", borderRadius: 8,
                    background: c.btnBg, color: c.btnText,
                    border: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: 600,
                  }}
                >Add</button>
              </div>
              {customSubs.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                  {customSubs.map((sub) => (
                    <span key={sub.name} style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "4px 12px", borderRadius: 16, fontSize: 12,
                      background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                      color: c.textSecondary, fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      r/{sub.label}
                      <button
                        onClick={() => removeCustomSub(sub.name)}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: c.textMuted, padding: 0, display: "flex", fontSize: 14,
                        }}
                      >×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Add Language */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                fontSize: 12, fontWeight: 700, color: c.textSecondary,
                fontFamily: "'JetBrains Mono', monospace",
                textTransform: "uppercase", letterSpacing: 1,
                display: "block", marginBottom: 10,
              }}>Add GitHub Language</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  placeholder="e.g. swift"
                  value={newLangName}
                  onChange={(e) => setNewLangName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addCustomLang(); }}
                  style={{
                    flex: 1, padding: "10px 14px", borderRadius: 8,
                    border: `1px solid ${c.border}`, background: c.bg,
                    color: c.text, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
                    outline: "none",
                  }}
                />
                <button
                  onClick={addCustomLang}
                  style={{
                    padding: "10px 18px", borderRadius: 8,
                    background: c.btnBg, color: c.btnText,
                    border: "none", cursor: "pointer",
                    fontSize: 13, fontWeight: 600,
                  }}
                >Add</button>
              </div>
              {customLangs.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                  {customLangs.map((lang) => (
                    <span key={lang.name} style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "4px 12px", borderRadius: 16, fontSize: 12,
                      background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                      color: c.textSecondary, fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {lang.label}
                      <button
                        onClick={() => removeCustomLang(lang.name)}
                        style={{
                          background: "none", border: "none", cursor: "pointer",
                          color: c.textMuted, padding: 0, display: "flex", fontSize: 14,
                        }}
                      >×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div style={{
              fontSize: 12, color: c.textMuted,
              fontFamily: "'JetBrains Mono', monospace",
              padding: "12px 0 0",
              borderTop: `1px solid ${c.borderLight}`,
            }}>
              Custom feeds are saved locally in your browser.
            </div>
          </div>
        </div>
      )}

      {/* Back to top button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
        className="header-btn"
        style={{
          position: "fixed", bottom: 32, right: 32, zIndex: 200,
          width: 50, height: 50, borderRadius: 16,
          background: dark
            ? "linear-gradient(135deg, #f59e0b, #d97706)"
            : "linear-gradient(135deg, #0f172a, #1e293b)",
          color: dark ? "#0a0a0f" : "#fff",
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: dark
            ? "0 6px 24px rgba(245,158,11,0.3), 0 2px 8px rgba(0,0,0,0.3)"
            : "0 6px 24px rgba(15,23,42,0.25), 0 2px 8px rgba(0,0,0,0.1)",
          opacity: showTop ? 1 : 0,
          pointerEvents: showTop ? "auto" : "none",
          transform: showTop ? "translateY(0) scale(1)" : "translateY(20px) scale(0.9)",
          transition: "opacity 0.4s cubic-bezier(0.22,1,0.36,1), transform 0.4s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <ArrowUp size={20} strokeWidth={2.5} />
      </button>

      {/* Onboarding Tour */}
      <Onboarding dark={dark} colors={c} />
    </div>
  );
}
