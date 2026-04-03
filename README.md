# ByteShift

A tech news aggregator and feed reader built for developers. ByteShift pulls content from Reddit, GitHub Trending, Hacker News, Dev.to, and Product Hunt into one distraction-free interface — no login required, no backend database.

---

## Features

**Feed Aggregation**
- Multi-source feed: Reddit, GitHub Trending, Hacker News (top/new/best/ask/show), Dev.to, Product Hunt
- Dynamic sorting and filtering per source
- Infinite scroll with paginated loading
- Custom feed builder — add your own subreddits and GitHub language filters

**Reading Experience**
- Reader mode — extracts and cleans article content from any URL for distraction-free reading
- Reading progress bar on articles
- Visited state tracking — dims posts you've already opened
- Keyboard shortcuts: `J`/`K` to navigate, `1–4` to switch tabs, `R` to refresh, `/` to search, `?` for help

**Bookmarks & History**
- Save posts and repos with one click
- Bookmark metadata per type (Reddit: subreddit/author/score, GitHub: stars/language)
- Export bookmarks as JSON or Markdown
- Reading history stored locally (up to 500 items)

**Dashboard & Settings**
- Analytics view: total reads, bookmarks by source/subreddit, reading activity breakdown
- Settings: font size, default source, theme, data management (clear history, bulk delete)

**Theming**
- Dark/light mode with localStorage persistence
- Centralized theme context with 20+ color tokens

**Bonus**
- Typing speed test on the home page (Easy and Code modes) with WPM/accuracy tracking
- 6-step onboarding modal for first-time visitors

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4, Lucide React |
| State | `localStorage` only — no external state library |
| Auth | None (stub pages exist for future use) |
| Database | None |

---

## Data Sources

All data is fetched server-side via Next.js route handlers and cached.

| Source | Method | Cache |
|---|---|---|
| Reddit | Public JSON API (`reddit.com/r/{sub}.json`) | 2 min |
| GitHub Trending | HTML scraping | 5 min |
| Hacker News | Firebase Realtime DB API | 2 min |
| Dev.to | Public REST API | 5 min |
| Product Hunt | HTML scraping | 10 min |
| Reader (any URL) | HTML extraction + cleaning | 10 min |

No API keys required.

---

## Project Structure

```
app/
├── page.tsx                  # Home — tools showcase + typing speed test
├── feed/
│   ├── page.tsx              # Main feed hub — multi-tab, search, infinite scroll
│   └── post/page.tsx         # Reddit post detail with nested comment threads
├── reader/page.tsx           # Distraction-free article reader
├── dashboard/page.tsx        # Reading stats and bookmark analytics
├── settings/page.tsx         # User preferences and data management
├── about/page.tsx            # Project info and feature overview
├── changelog/page.tsx        # Version history (v1.0–v1.5)
├── api/
│   ├── reddit/route.ts       # Subreddit posts with pagination
│   ├── reddit/post/route.ts  # Single post + comment thread
│   ├── github/route.ts       # GitHub Trending scraper
│   ├── hackernews/route.ts   # HN stories by type/page
│   ├── devto/route.ts        # Dev.to articles by tag
│   ├── producthunt/route.ts  # Product Hunt daily products
│   └── reader/route.ts       # Article content extractor
├── bookmarks.ts              # Bookmark CRUD (localStorage)
├── reading-history.ts        # History tracking (localStorage)
├── theme-context.tsx         # Global dark/light theme provider
├── onboarding.tsx            # First-visit onboarding modal
└── layout.tsx                # Root layout with ThemeProvider
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
# Build for production
npm run build
npm start
```

---

## localStorage Keys

All user data lives in the browser. Nothing is sent to a server.

| Key | Purpose |
|---|---|
| `byteshift-theme` | Light/dark preference |
| `byteshift_bookmarks` | Saved posts and repos |
| `byteshift_reading_history` | Visited post IDs (max 500) |
| `byteshift_custom_subs` | User-added subreddits |
| `byteshift_custom_langs` | User-added GitHub languages |
| `byteshift_settings` | Font size, default source, sort |
| `byteshift_onboarding_done` | Onboarding completion flag |

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `/` | Focus search bar |
| `?` | Toggle shortcuts help |
| `J` / `K` | Navigate posts up/down |
| `1` – `4` | Switch feed tabs |
| `R` | Refresh current feed |
