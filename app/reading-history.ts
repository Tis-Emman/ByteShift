const STORAGE_KEY = "byteshift_reading_history";
const MAX_ITEMS = 500;

export type HistoryEntry = {
  id: string;
  visitedAt: number;
};

function getHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ITEMS)));
}

export function markAsRead(id: string) {
  const history = getHistory();
  if (history.some((h) => h.id === id)) return;
  history.unshift({ id, visitedAt: Date.now() });
  saveHistory(history);
}

export function isRead(id: string): boolean {
  return getHistory().some((h) => h.id === id);
}

export function getReadIds(): Set<string> {
  return new Set(getHistory().map((h) => h.id));
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
