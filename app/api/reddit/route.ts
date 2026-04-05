import { NextRequest, NextResponse } from "next/server";
import { getRedditToken } from "./token";

export async function GET(req: NextRequest) {
  const sub = req.nextUrl.searchParams.get("sub") || "technology";
  const sort = req.nextUrl.searchParams.get("sort") || "hot";
  const after = req.nextUrl.searchParams.get("after") || "";

  try {
    const token = await getRedditToken();
    const headers: Record<string, string> = {
      "User-Agent": "ByteShift/1.0 (tech feed aggregator)",
    };
    let url: string;
    if (token) {
      headers["Authorization"] = `bearer ${token}`;
      url = `https://oauth.reddit.com/r/${sub}/${sort}.json?limit=25${after ? `&after=${after}` : ""}`;
    } else {
      url = `https://www.reddit.com/r/${sub}/${sort}.json?limit=25${after ? `&after=${after}` : ""}`;
    }

    const res = await fetch(url, { headers, next: { revalidate: 120 } });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Reddit API returned an error", status: res.status },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch from Reddit" },
      { status: 500 }
    );
  }
}
