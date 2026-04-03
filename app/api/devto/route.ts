import { NextRequest, NextResponse } from "next/server";

type DevToArticle = {
  id: number;
  title: string;
  description: string;
  url: string;
  cover_image: string | null;
  tag_list: string[];
  user: { name: string; username: string; profile_image: string };
  published_at: string;
  positive_reactions_count: number;
  comments_count: number;
  reading_time_minutes: number;
};

export async function GET(req: NextRequest) {
  const tag = req.nextUrl.searchParams.get("tag") || "";
  const page = req.nextUrl.searchParams.get("page") || "1";
  const perPage = req.nextUrl.searchParams.get("per_page") || "25";

  const params = new URLSearchParams({
    page,
    per_page: perPage,
    top: "7",
  });

  if (tag) {
    params.set("tag", tag);
  }

  const url = `https://dev.to/api/articles?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ByteShift/1.0)",
        Accept: "application/json",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Dev.to returned an error" },
        { status: res.status }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any[] = await res.json();

    const articles: DevToArticle[] = data.map((item) => ({
      id: item.id,
      title: item.title || "",
      description: item.description || "",
      url: item.url || "",
      cover_image: item.cover_image || null,
      tag_list: item.tag_list || [],
      user: {
        name: item.user?.name || "",
        username: item.user?.username || "",
        profile_image: item.user?.profile_image || "",
      },
      published_at: item.published_at || "",
      positive_reactions_count: item.positive_reactions_count || 0,
      comments_count: item.comments_count || 0,
      reading_time_minutes: item.reading_time_minutes || 0,
    }));

    const hasMore = articles.length === parseInt(perPage, 10);

    return NextResponse.json({ articles, hasMore });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch from Dev.to" },
      { status: 500 }
    );
  }
}
