"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Moon, Sun, BookOpen, AlertCircle } from "lucide-react";
import { useTheme, darkColors } from "../theme-context";

function ReaderView() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [siteName, setSiteName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  const c = darkColors(dark);

  useEffect(() => {
    if (!url) return;
    const fetchArticle = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/reader?url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setTitle(data.title);
        setContent(data.content);
        setSiteName(data.siteName);
      } catch {
        setError("Couldn't load this article in reader mode.");
      }
      setLoading(false);
    };
    fetchArticle();
  }, [url]);

  // Reading progress bar
  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!url) {
    return (
      <div style={{
        minHeight: "100vh", background: c.bg, color: c.text,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ textAlign: "center" }}>
          <BookOpen size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ color: c.textMuted, fontFamily: "'JetBrains Mono', monospace", fontSize: 14 }}>No URL provided</p>
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
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Lora:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: ${c.selectionBg}; color: ${c.selectionColor}; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${c.scrollTrackBg}; }
        ::-webkit-scrollbar-thumb { background: ${c.scrollThumbBg}; border-radius: 3px; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @media (max-width: 768px) {
          .reader-header { padding: 0 16px !important; }
          .reader-container { padding: 24px 16px 60px !important; }
          .reader-title { font-size: 24px !important; }
          .reader-content { font-size: 16px !important; }
        }
      `}</style>

      {/* Reading progress bar */}
      <div style={{
        position: "fixed", top: 0, left: 0, zIndex: 200,
        height: 3, width: `${progress}%`,
        background: dark ? "#f59e0b" : "#3b82f6",
        transition: "width 0.1s linear",
      }} />

      {/* Header */}
      <header className="reader-header" style={{
        position: "sticky", top: 0, zIndex: 100,
        background: c.navBg,
        borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
        padding: "0 40px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        transition: "background 0.3s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link href="/feed" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 14, color: c.textSecondary, textDecoration: "none", fontWeight: 500,
          }}>
            <ArrowLeft size={16} /> Back
          </Link>
          <div style={{ width: 1, height: 24, background: c.border }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BookOpen size={18} color={dark ? "#f59e0b" : "#3b82f6"} />
            <span style={{
              fontSize: 14, fontWeight: 600, color: c.text,
              fontFamily: "'Space Grotesk', sans-serif",
            }}>Reader Mode</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a
            href={url}
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
            <ExternalLink size={13} /> Original
          </a>
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

      <div className="reader-container" style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px 80px" }}>
        {/* Loading */}
        {loading && (
          <div style={{ animation: "pulse 1.5s ease-in-out infinite" }}>
            <div style={{ height: 14, width: "30%", background: c.surfaceHover, borderRadius: 6, marginBottom: 24 }} />
            <div style={{ height: 32, width: "80%", background: c.surfaceHover, borderRadius: 8, marginBottom: 12 }} />
            <div style={{ height: 32, width: "55%", background: c.surfaceHover, borderRadius: 8, marginBottom: 40 }} />
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ height: 14, width: `${70 + Math.random() * 30}%`, background: c.surfaceHover, borderRadius: 6, marginBottom: 12 }} />
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            textAlign: "center", padding: "60px 20px",
          }}>
            <AlertCircle size={32} color={c.textMuted} style={{ marginBottom: 12 }} />
            <p style={{
              color: c.textMuted, fontFamily: "'JetBrains Mono', monospace", fontSize: 14,
              marginBottom: 16,
            }}>{error}</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "10px 20px", borderRadius: 8,
                background: c.btnBg, color: c.btnText,
                textDecoration: "none", fontSize: 13, fontWeight: 600,
              }}
            >
              <ExternalLink size={14} /> View Original
            </a>
          </div>
        )}

        {/* Article */}
        {!loading && !error && (
          <>
            {/* Site name */}
            <div style={{
              fontSize: 12, fontWeight: 600, color: dark ? "#f59e0b" : "#3b82f6",
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: "uppercase", letterSpacing: 1,
              marginBottom: 16,
            }}>{siteName}</div>

            {/* Title */}
            <h1 className="reader-title" style={{
              fontSize: 32, fontWeight: 800, color: c.text,
              fontFamily: "'Space Grotesk', sans-serif",
              lineHeight: 1.25, margin: "0 0 24px",
              letterSpacing: "-0.02em",
            }}>{title}</h1>

            {/* Divider */}
            <div style={{
              height: 1, background: c.borderLight,
              margin: "0 0 32px",
            }} />

            {/* Content */}
            <div className="reader-content" style={{
              fontSize: 18, color: c.textSecondary, lineHeight: 1.9,
              fontFamily: "'Lora', 'Georgia', serif",
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {content.split("\n").map((line, i) => {
                if (line.startsWith("## ")) {
                  return (
                    <h2 key={i} style={{
                      fontSize: 22, fontWeight: 700, color: c.text,
                      fontFamily: "'Space Grotesk', sans-serif",
                      margin: "32px 0 16px", lineHeight: 1.3,
                    }}>{line.replace("## ", "")}</h2>
                  );
                }
                if (line.startsWith("> ")) {
                  return (
                    <blockquote key={i} style={{
                      borderLeft: `3px solid ${dark ? "#f59e0b" : "#3b82f6"}`,
                      paddingLeft: 20, margin: "16px 0",
                      color: c.textMuted, fontStyle: "italic",
                    }}>{line.replace("> ", "")}</blockquote>
                  );
                }
                if (line.startsWith("```")) {
                  return (
                    <pre key={i} style={{
                      background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
                      padding: 16, borderRadius: 8,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 14, overflow: "auto",
                      margin: "16px 0",
                    }}>{line.replace(/```/g, "")}</pre>
                  );
                }
                if (line.startsWith("• ")) {
                  return (
                    <li key={i} style={{
                      marginLeft: 24, marginBottom: 6,
                      listStyleType: "disc",
                    }}>{line.replace("• ", "")}</li>
                  );
                }
                if (line.trim() === "") return <br key={i} />;
                return <p key={i} style={{ margin: "8px 0" }}>{line}</p>;
              })}
            </div>

            {/* Footer */}
            <div style={{
              marginTop: 48, paddingTop: 24,
              borderTop: `1px solid ${c.borderLight}`,
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{
                fontSize: 12, color: c.textMuted,
                fontFamily: "'JetBrains Mono', monospace",
              }}>Read on ByteShift Reader</span>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 12, color: c.textSecondary, textDecoration: "none",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                <ExternalLink size={12} /> View Original
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ReaderPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'DM Sans', sans-serif",
      }}>
        Loading...
      </div>
    }>
      <ReaderView />
    </Suspense>
  );
}
