import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const sub = req.nextUrl.searchParams.get("sub") || "technology";
  const sort = req.nextUrl.searchParams.get("sort") || "hot";
  const after = req.nextUrl.searchParams.get("after") || "";

  try {
    const res = await fetch(
      `https://www.reddit.com/r/${sub}/${sort}.json?limit=25${after ? `&after=${after}` : ""}`,
      {
        headers: {
          "User-Agent": "ByteShift/1.0 (tech feed aggregator)",
        },
        next: { revalidate: 120 },
      }
    );

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
