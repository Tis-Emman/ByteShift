import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const permalink = req.nextUrl.searchParams.get("permalink");

  if (!permalink) {
    return NextResponse.json({ error: "Missing permalink" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://www.reddit.com${permalink}.json?limit=50`,
      {
        headers: {
          "User-Agent": "ByteShift/1.0 (tech feed aggregator)",
        },
        next: { revalidate: 60 },
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
