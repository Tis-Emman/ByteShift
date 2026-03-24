export type BookmarkItem = {
  id: string;
  type: "reddit" | "github";
  title: string;
  url: string;
  savedAt: number;
  // Reddit-specific
  permalink?: string;
  subreddit?: string;
  author?: string;
  score?: number;
  num_comments?: number;
  selftext?: string;
  // GitHub-specific
  name?: string;
  description?: string;
  language?: string;
  languageColor?: string | null;
  stars?: number;
  forks?: number;
};

const STORAGE_KEY = "byteshift_bookmarks";

function getAll(): BookmarkItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(items: BookmarkItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function getBookmarks(): BookmarkItem[] {
  return getAll().sort((a, b) => b.savedAt - a.savedAt);
}

export function isBookmarked(id: string): boolean {
  return getAll().some((b) => b.id === id);
}

export function addBookmark(item: BookmarkItem) {
  const all = getAll();
  if (all.some((b) => b.id === item.id)) return;
  all.push({ ...item, savedAt: Date.now() });
  save(all);
}

export function removeBookmark(id: string) {
  save(getAll().filter((b) => b.id !== id));
}

export function toggleBookmark(item: BookmarkItem): boolean {
  if (isBookmarked(item.id)) {
    removeBookmark(item.id);
    return false;
  }
  addBookmark(item);
  return true;
}
