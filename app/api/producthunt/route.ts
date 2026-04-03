import { NextResponse } from "next/server";

type Product = {
  id: number;
  name: string;
  tagline: string;
  votes: number;
  url: string;
  topics: string[];
  thumbnail: string | null;
};

export async function GET() {
  try {
    const res = await fetch("https://www.producthunt.com/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 600 },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch Product Hunt: ${res.status}`);
    }

    const html = await res.text();
    const products = parseProducts(html);

    if (products.length === 0) {
      return NextResponse.json(
        {
          error:
            "Could not parse products from Product Hunt. The page structure may have changed.",
          products: [],
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ products });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: `Failed to fetch from Product Hunt: ${message}`, products: [] },
      { status: 500 }
    );
  }
}

function parseProducts(html: string): Product[] {
  const products: Product[] = [];

  // Product Hunt embeds data in script tags as JSON or renders products in
  // structured HTML. We try multiple strategies to extract product data.

  // Strategy 1: Look for __NEXT_DATA__ or similar JSON payloads embedded in scripts
  const nextDataMatch = html.match(
    /<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/
  );
  if (nextDataMatch) {
    try {
      const data = JSON.parse(nextDataMatch[1]);
      const extracted = extractFromNextData(data);
      if (extracted.length > 0) return extracted;
    } catch {
      // JSON parse failed, fall through to next strategy
    }
  }

  // Strategy 2: Look for application/json script blocks containing product data
  const jsonScriptPattern =
    /<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/g;
  let jsonMatch;
  while ((jsonMatch = jsonScriptPattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      const extracted = extractFromJsonBlob(data);
      if (extracted.length > 0) return extracted;
    } catch {
      continue;
    }
  }

  // Strategy 3: Parse product entries from HTML structure
  // Product Hunt typically renders items with data-test attributes or specific class patterns
  const postPattern =
    /<div[^>]*data-test="post-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g;
  let match;
  let id = 1;

  while ((match = postPattern.exec(html)) !== null) {
    const block = match[1];
    const product = parseProductBlock(block, id);
    if (product) {
      products.push(product);
      id++;
    }
  }

  if (products.length > 0) return products;

  // Strategy 4: Look for links to product pages with vote counts
  const linkPattern =
    /href="(\/posts\/[^"]+)"[^>]*>[\s\S]*?<[^>]*>([\s\S]*?)<\/[^>]*>/g;
  id = 1;

  while ((match = linkPattern.exec(html)) !== null) {
    const url = `https://www.producthunt.com${match[1]}`;
    const textContent = match[2].replace(/<[^>]*>/g, "").trim();

    if (textContent && textContent.length > 2 && textContent.length < 200) {
      products.push({
        id: id++,
        name: textContent.split("\n")[0].trim(),
        tagline: textContent.split("\n").slice(1).join(" ").trim() || "",
        votes: 0,
        url,
        topics: [],
        thumbnail: null,
      });
    }

    if (products.length >= 20) break;
  }

  return products;
}

function extractFromNextData(data: Record<string, unknown>): Product[] {
  const products: Product[] = [];

  // Recursively search for product-like objects in the NEXT_DATA structure
  const candidates = findProductObjects(data);

  let id = 1;
  for (const item of candidates) {
    const name = (item.name as string) || (item.title as string) || "";
    const tagline =
      (item.tagline as string) || (item.description as string) || "";
    const votes =
      (item.votesCount as number) ||
      (item.votes_count as number) ||
      (item.vote_count as number) ||
      0;
    const slug = (item.slug as string) || "";
    const url = slug
      ? `https://www.producthunt.com/posts/${slug}`
      : (item.url as string) || "";

    const topics: string[] = [];
    if (Array.isArray(item.topics)) {
      for (const t of item.topics) {
        if (typeof t === "string") topics.push(t);
        else if (t && typeof t === "object" && "name" in t)
          topics.push(String(t.name));
      }
    }

    const thumbnail =
      (item.thumbnail as { url?: string })?.url ||
      (item.thumbnailUrl as string) ||
      (item.thumbnail_url as string) ||
      null;

    if (name && url) {
      products.push({ id: id++, name, tagline, votes, url, topics, thumbnail });
    }

    if (products.length >= 20) break;
  }

  return products;
}

function extractFromJsonBlob(data: unknown): Product[] {
  if (typeof data !== "object" || data === null) return [];
  return extractFromNextData(data as Record<string, unknown>);
}

function findProductObjects(
  obj: unknown,
  depth = 0
): Record<string, unknown>[] {
  if (depth > 10 || typeof obj !== "object" || obj === null) return [];

  const results: Record<string, unknown>[] = [];
  const record = obj as Record<string, unknown>;

  // Check if this object looks like a product
  const hasName = "name" in record || "title" in record;
  const hasTagline = "tagline" in record || "description" in record;
  const hasVotes =
    "votesCount" in record ||
    "votes_count" in record ||
    "vote_count" in record;
  const hasSlug = "slug" in record;

  if (hasName && (hasTagline || hasVotes) && hasSlug) {
    results.push(record);
  }

  // Recurse into arrays and objects
  if (Array.isArray(obj)) {
    for (const item of obj) {
      results.push(...findProductObjects(item, depth + 1));
    }
  } else {
    for (const value of Object.values(record)) {
      results.push(...findProductObjects(value, depth + 1));
    }
  }

  return results;
}

function parseProductBlock(
  block: string,
  id: number
): Product | null {
  // Extract text content by stripping tags
  const textParts = block
    .replace(/<[^>]*>/g, "\n")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (textParts.length < 1) return null;

  const name = textParts[0];
  const tagline = textParts.length > 1 ? textParts[1] : "";

  // Try to find a vote count (a standalone number)
  const voteMatch = block.match(/>(\d+)<\//);
  const votes = voteMatch ? parseInt(voteMatch[1], 10) : 0;

  // Try to find the product URL
  const urlMatch = block.match(/href="(\/posts\/[^"]+)"/);
  const url = urlMatch
    ? `https://www.producthunt.com${urlMatch[1]}`
    : "";

  // Try to find a thumbnail image
  const imgMatch = block.match(/<img[^>]*src="([^"]+)"/);
  const thumbnail = imgMatch ? imgMatch[1] : null;

  if (!name || !url) return null;

  return { id, name, tagline, votes, url, topics: [], thumbnail };
}
