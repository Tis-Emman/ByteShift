import { NextRequest, NextResponse } from "next/server";

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

function parseNumber(str: string): number {
  const cleaned = str.trim().replace(/,/g, "");
  return parseInt(cleaned, 10) || 0;
}

function parseTrending(html: string): GitHubRepo[] {
  const repos: GitHubRepo[] = [];
  // Split by each repo row
  const rows = html.split('<article class="Box-row');
  rows.shift(); // remove everything before the first article

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Repo name (owner/repo)
    const nameMatch = row.match(/href="\/([^"]+?)"\s/);
    const fullName = nameMatch ? nameMatch[1].trim() : null;
    if (!fullName) continue;

    // Description
    const descMatch = row.match(/<p class="col-[^"]*?">\s*([\s\S]*?)\s*<\/p>/);
    const description = descMatch ? descMatch[1].replace(/<[^>]*>/g, "").trim() : "";

    // Language + color
    const langMatch = row.match(/itemprop="programmingLanguage">(.*?)<\/span>/);
    const language = langMatch ? langMatch[1].trim() : null;
    const langColorMatch = row.match(/style="background-color:\s*(#[a-fA-F0-9]+)/);
    const languageColor = langColorMatch ? langColorMatch[1] : null;

    // Stars
    const starsMatch = row.match(/href="\/[^"]+\/stargazers"[^>]*>[\s\S]*?([0-9,]+)[\s\S]*?<\/a>/);
    const stars = starsMatch ? parseNumber(starsMatch[1]) : 0;

    // Forks
    const forksMatch = row.match(/href="\/[^"]+\/forks"[^>]*>[\s\S]*?([0-9,]+)[\s\S]*?<\/a>/);
    const forks = forksMatch ? parseNumber(forksMatch[1]) : 0;

    // Stars today/this week/this month
    const todayMatch = row.match(/(\d[\d,]*)\s+stars?\s+(today|this\s+week|this\s+month)/i);
    const starsToday = todayMatch ? `${todayMatch[1]} stars ${todayMatch[2]}` : "";

    repos.push({
      rank: i + 1,
      name: fullName,
      description,
      language,
      languageColor,
      stars,
      forks,
      starsToday,
      url: `https://github.com/${fullName}`,
    });
  }

  return repos;
}

export async function GET(req: NextRequest) {
  const since = req.nextUrl.searchParams.get("since") || "daily";
  const language = req.nextUrl.searchParams.get("language") || "";

  const url = `https://github.com/trending/${encodeURIComponent(language)}?since=${since}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ByteShift/1.0)",
        Accept: "text/html",
      },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "GitHub returned an error" },
        { status: res.status }
      );
    }

    const html = await res.text();
    const repos = parseTrending(html);

    return NextResponse.json({ repos });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch from GitHub" },
      { status: 500 }
    );
  }
}
