import { NextRequest, NextResponse } from "next/server";

type HNItem = {
  id: number;
  title: string;
  url: string;
  by: string;
  score: number;
  descendants: number;
  time: number;
  type: string;
};

export async function GET(req: NextRequest) {
  const sort = req.nextUrl.searchParams.get("sort") || "top";
  const page = parseInt(req.nextUrl.searchParams.get("page") || "0", 10);
  const pageSize = 25;

  const endpoint =
    sort === "new"
      ? "https://hacker-news.firebaseio.com/v0/newstories.json"
      : sort === "best"
      ? "https://hacker-news.firebaseio.com/v0/beststories.json"
      : sort === "ask"
      ? "https://hacker-news.firebaseio.com/v0/askstories.json"
      : sort === "show"
      ? "https://hacker-news.firebaseio.com/v0/showstories.json"
      : "https://hacker-news.firebaseio.com/v0/topstories.json";

  try {
    const idsRes = await fetch(endpoint, {
      next: { revalidate: 120 },
    });
    if (!idsRes.ok) throw new Error("Failed to fetch story IDs");
    const allIds: number[] = await idsRes.json();

    const start = page * pageSize;
    const slicedIds = allIds.slice(start, start + pageSize);
    const hasMore = start + pageSize < allIds.length;

    const stories = await Promise.all(
      slicedIds.map(async (id) => {
        const res = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
          { next: { revalidate: 300 } }
        );
        if (!res.ok) return null;
        return res.json() as Promise<HNItem>;
      })
    );

    const items = stories
      .filter((s): s is HNItem => s !== null && s.type === "story")
      .map((s) => ({
        id: s.id,
        title: s.title || "",
        url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
        author: s.by || "",
        score: s.score || 0,
        comments: s.descendants || 0,
        time: s.time || 0,
        domain: s.url ? new URL(s.url).hostname.replace("www.", "") : "news.ycombinator.com",
        hnUrl: `https://news.ycombinator.com/item?id=${s.id}`,
        isSelf: !s.url,
      }));

    return NextResponse.json({ items, hasMore });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch from Hacker News" },
      { status: 500 }
    );
  }
}
