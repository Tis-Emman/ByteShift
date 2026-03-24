"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ExternalLink, MessageSquare, ArrowUp, Clock, User, Moon, Sun, Share2 } from "lucide-react";
import { useTheme, darkColors } from "../../theme-context";

type Comment = {
  id: string;
  author: string;
  body: string;
  score: number;
  created_utc: number;
  replies: Comment[];
  depth: number;
};

type PostData = {
  title: string;
  author: string;
  subreddit: string;
  selftext: string;
  score: number;
  num_comments: number;
  created_utc: number;
  url: string;
  permalink: string;
  is_self: boolean;
  link_flair_text: string | null;
  domain: string;
  thumbnail: string;
};

function timeAgo(utc: number): string {
  const seconds = Math.floor(Date.now() / 1000 - utc);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatScore(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function parseComments(children: any[], depth = 0): Comment[] {
  if (!children) return [];
  return children
    .filter((c: any) => c.kind === "t1" && c.data.author && c.data.body)
    .map((c: any) => ({
      id: c.data.id,
      author: c.data.author,
      body: c.data.body,
      score: c.data.score,
      created_utc: c.data.created_utc,
      depth,
      replies:
        c.data.replies && c.data.replies.data
          ? parseComments(c.data.replies.data.children, depth + 1)
          : [],
    }));
}

function CommentItem({ comment, c, dark }: { comment: Comment; c: ReturnType<typeof darkColors>; dark: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  const depthColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
  const barColor = depthColors[comment.depth % depthColors.length];

  return (
    <div style={{ marginTop: comment.depth === 0 ? 16 : 8 }}>
      <div style={{
        display: "flex", gap: 0,
      }}>
        {/* Depth indicator bar */}
        {comment.depth > 0 && (
          <div style={{
            width: 2, minHeight: "100%", background: barColor + "40",
            marginRight: 16, marginLeft: Math.min(comment.depth, 4) * 16, borderRadius: 1,
            flexShrink: 0,
          }} />
        )}

        <div style={{ flex: 1 }}>
          {/* Comment header */}
          <div
            onClick={() => setCollapsed(!collapsed)}
            style={{
              display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
              marginBottom: collapsed ? 0 : 8,
            }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <User size={12} color={c.textMuted} />
            </div>
            <span style={{
              fontSize: 12, fontWeight: 700, color: c.text,
              fontFamily: "'JetBrains Mono', monospace",
            }}>u/{comment.author}</span>
            <span style={{ fontSize: 11, color: c.textMuted }}>·</span>
            <span style={{
              fontSize: 11, color: c.textMuted,
              fontFamily: "'JetBrains Mono', monospace",
            }}>{formatScore(comment.score)} pts</span>
            <span style={{ fontSize: 11, color: c.textMuted }}>·</span>
            <span style={{
              fontSize: 11, color: c.textMuted,
              fontFamily: "'JetBrains Mono', monospace",
            }}>{timeAgo(comment.created_utc)}</span>
            {collapsed && (
              <span style={{ fontSize: 11, color: c.textMuted, fontStyle: "italic" }}>
                [{comment.replies.length} replies]
              </span>
            )}
          </div>

          {/* Comment body */}
          {!collapsed && (
            <>
              <div style={{
                fontSize: 14, color: c.textSecondary, lineHeight: 1.7,
                fontFamily: "'DM Sans', sans-serif",
                paddingLeft: 32, whiteSpace: "pre-wrap", wordBreak: "break-word",
              }}>
                {comment.body}
              </div>

              {/* Nested replies */}
              {comment.replies.length > 0 && (
                <div>
                  {comment.replies.map((reply) => (
                    <CommentItem key={reply.id} comment={reply} c={c} dark={dark} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PostViewer() {
  const searchParams = useSearchParams();
  const permalink = searchParams.get("permalink");
  const [post, setPost] = useState<PostData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  const c = darkColors(dark);

  useEffect(() => {
    if (!permalink) return;
    const fetchPost = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/reddit/post?permalink=${encodeURIComponent(permalink)}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();

        const postData = data[0].data.children[0].data;
        setPost({
          title: postData.title,
          author: postData.author,
          subreddit: postData.subreddit,
          selftext: postData.selftext,
          score: postData.score,
          num_comments: postData.num_comments,
          created_utc: postData.created_utc,
          url: postData.url,
          permalink: postData.permalink,
          is_self: postData.is_self,
          link_flair_text: postData.link_flair_text,
          domain: postData.domain,
          thumbnail: postData.thumbnail,
        });

        const commentChildren = data[1].data.children;
        setComments(parseComments(commentChildren));
      } catch {
        setError("Couldn't load this post. Try again in a moment.");
      }
      setLoading(false);
    };
    fetchPost();
  }, [permalink]);

  if (!permalink) {
    return (
      <div style={{
        minHeight: "100vh", background: c.bg, color: c.text,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: c.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>No post selected</p>
          <Link href="/feed" style={{
            display: "inline-block", marginTop: 16, padding: "10px 20px",
            borderRadius: 8, background: c.btnBg, color: c.btnText,
            textDecoration: "none", fontSize: 14, fontWeight: 600,
          }}>Back to Feed</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: c.bg,
      color: c.text,
      fontFamily: "'DM Sans', sans-serif",
      transition: "background 0.3s, color 0.3s",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: ${c.selectionBg}; color: ${c.selectionColor}; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${c.scrollTrackBg}; }
        ::-webkit-scrollbar-thumb { background: ${c.scrollThumbBg}; border-radius: 3px; }
        @media (max-width: 768px) {
          .post-header { padding: 0 16px !important; }
          .post-container { padding: 20px 16px 60px !important; }
          .post-card { padding: 24px 18px !important; }
          .post-title { font-size: 20px !important; }
          .post-stats { flex-wrap: wrap !important; gap: 12px !important; }
          .post-stats a { margin-left: 0 !important; }
          .comment-indent { margin-left: 8px !important; }
        }
      `}</style>

      {/* Header */}
      <header className="post-header" style={{
        position: "sticky", top: 0, zIndex: 100,
        background: c.navBg,
        borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
        padding: "0 40px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "background 0.3s",
      }}>
        <Link href="/feed" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 14, color: c.textSecondary, textDecoration: "none", fontWeight: 500,
        }}>
          <ArrowLeft size={16} /> Back to Feed
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {post && (
            <a
              href={`https://reddit.com${post.permalink}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                fontSize: 12, color: c.textSecondary, textDecoration: "none",
                padding: "6px 12px", borderRadius: 8,
                border: `1px solid ${c.border}`,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <ExternalLink size={13} /> Reddit
            </a>
          )}
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              border: `1px solid ${c.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: c.text,
            }}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </header>

      <div className="post-container" style={{ maxWidth: 780, margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* Loading */}
        {loading && (
          <div>
            <div style={{
              background: c.surface, border: `1px solid ${c.borderLight}`,
              borderRadius: 16, padding: "36px 32px", marginBottom: 24,
              animation: "pulse 1.5s ease-in-out infinite",
            }}>
              <div style={{ height: 12, width: "30%", background: c.surfaceHover, borderRadius: 6, marginBottom: 16 }} />
              <div style={{ height: 24, width: "80%", background: c.surfaceHover, borderRadius: 8, marginBottom: 12 }} />
              <div style={{ height: 24, width: "60%", background: c.surfaceHover, borderRadius: 8, marginBottom: 20 }} />
              <div style={{ height: 14, width: "100%", background: c.surfaceHover, borderRadius: 6, marginBottom: 8 }} />
              <div style={{ height: 14, width: "90%", background: c.surfaceHover, borderRadius: 6 }} />
            </div>
            <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }`}</style>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            color: c.textMuted, fontFamily: "'JetBrains Mono', monospace", fontSize: 14,
          }}>
            {error}
          </div>
        )}

        {/* Post content */}
        {!loading && !error && post && (
          <>
            {/* Post card */}
            <article className="post-card" style={{
              background: c.surface,
              border: `1px solid ${c.borderLight}`,
              borderRadius: 16,
              padding: "36px 32px",
              boxShadow: c.cardShadow,
              marginBottom: 32,
            }}>
              {/* Meta */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                <span style={{
                  fontSize: 12, fontWeight: 700, color: dark ? "#f59e0b" : "#3b82f6",
                  fontFamily: "'JetBrains Mono', monospace",
                  textTransform: "uppercase", letterSpacing: 0.5,
                }}>r/{post.subreddit}</span>
                {post.link_flair_text && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 6,
                    background: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                    color: c.textSecondary,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}>{post.link_flair_text}</span>
                )}
                <span style={{ fontSize: 11, color: c.textMuted }}>·</span>
                <span style={{
                  fontSize: 12, color: c.textMuted,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>u/{post.author}</span>
                <span style={{ fontSize: 11, color: c.textMuted }}>·</span>
                <span style={{
                  fontSize: 12, color: c.textMuted,
                  fontFamily: "'JetBrains Mono', monospace",
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                  <Clock size={12} /> {timeAgo(post.created_utc)}
                </span>
              </div>

              {/* Title */}
              <h1 className="post-title" style={{
                fontSize: 26, fontWeight: 800, color: c.text,
                fontFamily: "'Space Grotesk', sans-serif",
                lineHeight: 1.3, margin: "0 0 20px",
                letterSpacing: "-0.02em",
              }}>{post.title}</h1>

              {/* External link preview */}
              {!post.is_self && (
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "14px 18px", borderRadius: 12,
                    background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                    border: `1px solid ${c.borderLight}`,
                    textDecoration: "none", marginBottom: 20,
                    transition: "all 0.2s",
                  }}
                >
                  <ExternalLink size={16} color={c.textMuted} />
                  <div>
                    <div style={{
                      fontSize: 13, fontWeight: 600, color: dark ? "#3b82f6" : "#2563eb",
                      fontFamily: "'JetBrains Mono', monospace",
                      wordBreak: "break-all",
                    }}>{post.domain}</div>
                    <div style={{
                      fontSize: 12, color: c.textMuted, marginTop: 2,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      maxWidth: 600,
                    }}>{post.url}</div>
                  </div>
                </a>
              )}

              {/* Self text */}
              {post.selftext && (
                <div style={{
                  fontSize: 15, color: c.textSecondary, lineHeight: 1.8,
                  fontFamily: "'DM Sans', sans-serif",
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>
                  {post.selftext}
                </div>
              )}

              {/* Stats bar */}
              <div style={{
                display: "flex", alignItems: "center", gap: 24,
                marginTop: 24, paddingTop: 20,
                borderTop: `1px solid ${c.borderLight}`,
              }} className="post-stats">
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 13, fontWeight: 600, color: c.text,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  <ArrowUp size={16} /> {formatScore(post.score)}
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 13, fontWeight: 600, color: c.textSecondary,
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  <MessageSquare size={16} /> {post.num_comments} comments
                </div>
                <a
                  href={`https://reddit.com${post.permalink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    fontSize: 13, color: c.textMuted,
                    fontFamily: "'JetBrains Mono', monospace",
                    textDecoration: "none", marginLeft: "auto",
                  }}
                >
                  <Share2 size={14} /> View on Reddit
                </a>
              </div>
            </article>

            {/* Comments section */}
            <div>
              <h2 style={{
                fontSize: 18, fontWeight: 700, color: c.text,
                fontFamily: "'Space Grotesk', sans-serif",
                margin: "0 0 8px",
              }}>Comments</h2>
              <p style={{
                fontSize: 13, color: c.textMuted, marginBottom: 20,
                fontFamily: "'JetBrains Mono', monospace",
              }}>Click a comment header to collapse it</p>

              {comments.length === 0 && (
                <div style={{
                  textAlign: "center", padding: "40px 20px",
                  color: c.textMuted, fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                }}>
                  No comments yet.
                </div>
              )}

              {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} c={c} dark={dark} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PostPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        Loading...
      </div>
    }>
      <PostViewer />
    </Suspense>
  );
}
