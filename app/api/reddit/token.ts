let cached: { token: string; expiresAt: number } | null = null;

export async function getRedditToken(): Promise<string | null> {
  if (cached && Date.now() < cached.expiresAt) return cached.token;

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  try {
    const res = await fetch("https://www.reddit.com/api/v1/access_token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "ByteShift/1.0",
      },
      body: "grant_type=client_credentials",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    cached = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
    return cached.token;
  } catch {
    return null;
  }
}
