import { NextRequest, NextResponse } from "next/server";
import { getRedditToken } from "../token";

export async function GET(req: NextRequest) {
  const permalink = req.nextUrl.searchParams.get("permalink");

  if (!permalink) {
    return NextResponse.json({ error: "Missing permalink" }, { status: 400 });
  }

  try {
    const token = await getRedditToken();
    const headers: Record<string, string> = {
      "User-Agent": "ByteShift/1.0 (tech feed aggregator)",
    };
    let url: string;
    if (token) {
      headers["Authorization"] = `bearer ${token}`;
      url = `https://oauth.reddit.com${permalink}.json?limit=50`;
    } else {
      url = `https://www.reddit.com${permalink}.json?limit=50`;
    }

    const res = await fetch(url, { headers, next: { revalidate: 60 } });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Reddit API returned an error" },
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
