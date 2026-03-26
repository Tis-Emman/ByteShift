import { NextRequest, NextResponse } from "next/server";

function extractContent(html: string, url: string): { title: string; content: string; siteName: string } {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i)
    || html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"[^>]*>/i);
  const title = ogTitleMatch?.[1] || titleMatch?.[1]?.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'").replace(/&quot;/g, '"') || "Untitled";

  // Extract site name
  const siteMatch = html.match(/<meta[^>]*property="og:site_name"[^>]*content="([^"]*)"[^>]*>/i)
    || html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:site_name"[^>]*>/i);
  const siteName = siteMatch?.[1] || new URL(url).hostname.replace("www.", "");

  // Remove scripts, styles, nav, footer, header, aside, ads
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Try to find article or main content
  const articleMatch = cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  const mainMatch = cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const contentDiv = cleaned.match(/<div[^>]*class="[^"]*(?:content|article|post|entry|story)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

  let rawContent = articleMatch?.[1] || mainMatch?.[1] || contentDiv?.[1] || cleaned;

  // Convert common HTML to readable text
  // Preserve paragraphs and headings
  rawContent = rawContent
    .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, "\n\n## $1\n\n")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "\n$1\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "\n• $1")
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, "\n> $1\n")
    .replace(/<pre[^>]*>([^<]*(?:<(?!\/pre>)[^<]*)*)<\/pre>/gi, "\n```\n$1\n```\n")
    .replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
    .replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "$2")
    .replace(/<img[^>]*alt="([^"]*)"[^>]*>/gi, "[image: $1]")
    .replace(/<img[^>]*>/gi, "")
    .replace(/<[^>]+>/g, "") // Strip remaining tags
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Limit content length
  if (rawContent.length > 15000) {
    rawContent = rawContent.slice(0, 15000) + "\n\n[Content truncated...]";
  }

  return { title, content: rawContent, siteName };
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ByteShift/1.0)",
        Accept: "text/html",
      },
      next: { revalidate: 600 },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json({ error: "Not an HTML page" }, { status: 400 });
    }

    const html = await res.text();
    const extracted = extractContent(html, url);

    return NextResponse.json(extracted);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch article" },
      { status: 500 }
    );
  }
}
