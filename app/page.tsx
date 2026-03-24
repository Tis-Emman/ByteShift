"use client";

import { useState, useEffect, useRef } from "react";
import { Zap, Terminal, Bot, Sparkles, Package, GitBranch } from "lucide-react";

function AnimateIn({ children, className = "fade-up", delay = 0, style }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(el); } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={visible ? className : ""}
      style={{
        opacity: visible ? undefined : 0,
        animationDelay: delay ? `${delay}s` : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

const CATEGORIES = ["All", "AI", "Tech", "Reviews", "Gaming", "Programming", "Apple", "Google"];

const ARTICLES = [
  {
    id: 1,
    title: "AMD's Next-Gen AI Chips: A Developer's Perspective",
    excerpt: "AMD just dropped its upcoming AI accelerator lineup built for dev-heavy workloads. Here's our deep dive into the hardware specs, cost breakdown, and real-world impact on ML training pipelines.",
    category: "AI",
    image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=600&h=400&fit=crop",
    date: "Mar 20, 2026",
    readTime: "5 min",
  },
  {
    id: 2,
    title: "Logitech MX Master 4: Built for Long Coding Sessions",
    excerpt: "We stress-tested the MX Master 4 across multi-monitor rigs, all-day compile runs, and marathon coding sprints. Does it actually deliver on the promise? Our honest take.",
    category: "Reviews",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=400&fit=crop",
    date: "Mar 18, 2026",
    readTime: "6 min",
  },
  {
    id: 3,
    title: "Steam Deck OLED: More Than Just a Gaming Handheld",
    excerpt: "Beyond gaming, the Steam Deck OLED has quietly become a portable testing rig for indie developers. We uncover the hidden dev-friendly features that fly under the radar.",
    category: "Gaming",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop",
    date: "Mar 17, 2026",
    readTime: "8 min",
  },
  {
    id: 4,
    title: "Inside Google's AI Bug Bounty: Up to $150K Per Find",
    excerpt: "Google rolled out a dedicated bounty program focused on AI vulnerabilities, with payouts reaching six figures. We explain how researchers and devs can participate.",
    category: "Google",
    image: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?w=600&h=400&fit=crop",
    date: "Mar 15, 2026",
    readTime: "4 min",
  },
  {
    id: 5,
    title: "Tado's On-Device AI: Smart Thermostats Get a Dev API",
    excerpt: "Tado pushed a firmware update that adds local AI processing to its smart thermostats. We explore the new developer API and what it opens up for home automation tinkerers.",
    category: "Tech",
    image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&h=400&fit=crop",
    date: "Mar 14, 2026",
    readTime: "5 min",
  },
  {
    id: 6,
    title: "Vision Pro SDK: Lessons from Six Months of Spatial Dev",
    excerpt: "Half a year in, we review which Vision Pro apps found an audience, which SDK patterns hold up, and the pitfalls early builders ran into — so you can skip the guesswork.",
    category: "Apple",
    image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&h=400&fit=crop",
    date: "Mar 12, 2026",
    readTime: "7 min",
  },
];

const DEV_TOOLS = [
  {
    name: "Visual Studio Code",
    desc: "The editor most devs swear by. Fast, endlessly customizable, and backed by a massive extension library for virtually any language or stack.",
    icon: <Zap size={22} />,
    color: "#007ACC",
    link: "#",
  },
  {
    name: "Warp Terminal",
    desc: "A blazing-fast terminal written in Rust, featuring AI-powered command hints, structured input blocks, and team collaboration tools for devs who value speed.",
    icon: <Terminal size={22} />,
    color: "#01A4FF",
    link: "#",
  },
  {
    name: "GitHub Copilot",
    desc: "Your AI coding partner that tackles repetitive work — scaffolding, test generation, documentation — freeing you to concentrate on design and logic.",
    icon: <Bot size={22} />,
    color: "#6e40c9",
    link: "#",
  },
  {
    name: "Tabnine",
    desc: "Privacy-first AI completions that process everything on your machine. Covers 30+ languages with intelligent whole-line and full-function suggestions.",
    icon: <Sparkles size={22} />,
    color: "#e44d26",
    link: "#",
  },
  {
    name: "NVM & Homebrew",
    desc: "The backbone of any dev environment. Swap between Node versions effortlessly with NVM and handle the rest of your toolchain through Homebrew.",
    icon: <Package size={22} />,
    color: "#d4a017",
    link: "#",
  },
  {
    name: "Git & GitHub",
    desc: "The foundation of modern development. Get comfortable with branches, pull requests, and automated pipelines to deploy with confidence every time.",
    icon: <GitBranch size={22} />,
    color: "#333",
    link: "#",
  },
];

const WORD_SETS = {
  easy: ["the", "be", "to", "of", "and", "a", "in", "that", "have", "it", "for", "not", "on", "with", "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so"],
  code: ["const", "function", "return", "import", "export", "async", "await", "class", "interface", "type", "let", "var", "if", "else", "for", "while", "switch", "case", "break", "default", "try", "catch", "throw", "new", "this", "null", "undefined", "true", "false", "console.log", "useState", "useEffect", "Promise", "Array", "Object", "String", "Number", "Boolean", "Map", "Set"],
};


function TypingTest() {
  const [mode, setMode] = useState<keyof typeof WORD_SETS>("easy");
  const [words, setWords] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [errors, setErrors] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const generateWords = (m: keyof typeof WORD_SETS) => {
    const set = WORD_SETS[m] || WORD_SETS.easy;
    const arr = [];
    for (let i = 0; i < 30; i++) arr.push(set[Math.floor(Math.random() * set.length)]);
    return arr;
  };

  useEffect(() => {
    setWords(generateWords(mode));
    reset();
  }, [mode]);

  const reset = () => {
    setCurrentIndex(0);
    setTyped("");
    setStarted(false);
    setFinished(false);
    setStartTime(null);
    setElapsed(0);
    setErrors(0);
    setCorrectChars(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const newTest = () => {
    setWords(generateWords(mode));
    reset();
  };

  useEffect(() => {
    if (started && !finished) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime!) / 1000));
      }, 200);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started, finished, startTime]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!started && val.length > 0) {
      setStarted(true);
      setStartTime(Date.now());
    }
    if (val.endsWith(" ")) {
      const trimmed = val.trim();
      if (trimmed === words[currentIndex]) {
        setCorrectChars((c) => c + words[currentIndex].length);
      } else {
        setErrors((er) => er + 1);
      }
      if (currentIndex + 1 >= words.length) {
        setFinished(true);
        if (timerRef.current) clearInterval(timerRef.current);
      }
      setCurrentIndex((i) => i + 1);
      setTyped("");
    } else {
      setTyped(val);
    }
  };

  const wpm = elapsed > 0 ? Math.round((correctChars / 5) / (elapsed / 60)) : 0;
  const accuracy = currentIndex > 0 ? Math.round(((currentIndex - errors) / currentIndex) * 100) : 100;

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "32px 28px", border: "1px solid #e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {(["easy", "code"] as (keyof typeof WORD_SETS)[]).map((m) => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: "8px 20px", borderRadius: 8, border: mode === m ? "1.5px solid #0f172a" : "1.5px solid #e2e8f0",
            background: mode === m ? "#0f172a" : "#fff",
            color: mode === m ? "#fff" : "#94a3b8", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", textTransform: "capitalize",
            transition: "all 0.2s",
          }}>{m}</button>
        ))}
      </div>
      <div style={{ minHeight: 100, marginBottom: 20, lineHeight: 2.2, fontFamily: "'JetBrains Mono', monospace", fontSize: 15, overflow: "hidden", maxHeight: 140, flexWrap: "wrap", wordBreak: "break-word" }}>
        {words.map((w, i) => {
          let color = "#cbd5e1";
          if (i < currentIndex) color = "#0f172a";
          if (i === currentIndex) color = "#0f172a";
          return <span key={i} style={{ color, marginRight: 10, transition: "color 0.15s", textDecoration: i === currentIndex ? "underline" : "none", textUnderlineOffset: 6, display: "inline" }}>{w}</span>;
        })}
      </div>
      <input
        ref={inputRef}
        value={typed}
        onChange={handleInput}
        disabled={finished}
        placeholder={finished ? "Done!" : "Start typing..."}
        style={{
          width: "100%", padding: "14px 18px", borderRadius: 10, border: "1.5px solid #e2e8f0",
          background: "#f8fafc", color: "#0f172a", fontSize: 15, fontFamily: "'JetBrains Mono', monospace",
          outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
        }}
      />
      <div style={{ display: "flex", gap: 32, marginTop: 20, flexWrap: "wrap" }}>
        {[
          { label: "WPM", value: wpm, color: "#0f172a" },
          { label: "Accuracy", value: `${accuracy}%`, color: "#3b82f6" },
          { label: "Time", value: `${elapsed}s`, color: "#f59e0b" },
          { label: "Errors", value: errors, color: "#ef4444" },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <button onClick={newTest} style={{
        marginTop: 20, padding: "10px 24px", borderRadius: 8, border: "1.5px solid #e2e8f0",
        background: "#fff", color: "#0f172a", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
        transition: "all 0.2s",
      }}>↻ New Test</button>
    </div>
  );
}

function CategoryPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 18px", borderRadius: 20, border: active ? "1px solid #0f172a" : "1px solid #e2e8f0",
      background: active ? "rgba(0,0,0,0.08)" : "#fff",
      color: active ? "#0f172a" : "#94a3b8", cursor: "pointer", fontSize: 13,
      fontFamily: "'DM Sans', sans-serif", fontWeight: 500, transition: "all 0.25s", whiteSpace: "nowrap",
    }}>{label}</button>
  );
}

function ArticleCard({ article, index }: { article: typeof ARTICLES[number]; index: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 16, overflow: "hidden", cursor: "pointer",
        transition: "all 0.35s cubic-bezier(0.4,0,0.2,1)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hovered ? "0 20px 60px rgba(0,0,0,0.10)" : "0 2px 12px rgba(0,0,0,0.05)",
        animationDelay: `${index * 80}ms`,
      }}
    >
      <div style={{ position: "relative", overflow: "hidden", height: 200 }}>
        <img src={article.image} alt="" style={{
          width: "100%", height: "100%", objectFit: "cover",
          transition: "transform 0.5s", transform: hovered ? "scale(1.05)" : "scale(1)",
        }} />
        <div style={{
          position: "absolute", top: 12, left: 12, padding: "4px 12px", borderRadius: 6,
          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)",
          color: "#0f172a", fontSize: 11, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: 0.5, textTransform: "uppercase",
        }}>{article.category}</div>
      </div>
      <div style={{ padding: "20px 20px 24px" }}>
        <h3 style={{
          fontSize: 17, fontWeight: 700, color: "#0f172a", lineHeight: 1.4, margin: "0 0 10px",
          fontFamily: "'Space Grotesk', 'DM Sans', sans-serif",
        }}>{article.title}</h3>
        <p style={{
          fontSize: 13.5, color: "#64748b", lineHeight: 1.6, margin: "0 0 16px",
          fontFamily: "'DM Sans', sans-serif",
          display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>{article.excerpt}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>{article.date}</span>
          <span style={{ fontSize: 12, color: "#0f172a", fontFamily: "'JetBrains Mono', monospace" }}>{article.readTime} read</span>
        </div>
      </div>
    </div>
  );
}

function ToolCard({ tool, index }: { tool: typeof DEV_TOOLS[number]; index: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#fafafa" : "#fff",
        border: `1px solid ${hovered ? tool.color + "40" : "#e2e8f0"}`,
        borderRadius: 16, padding: 24, cursor: "pointer",
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? `0 8px 30px ${tool.color}18` : "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: `${tool.color}12`, display: "flex", alignItems: "center", justifyContent: "center",
        marginBottom: 16, border: `1px solid ${tool.color}25`, color: tool.color,
      }}>{tool.icon}</div>
      <h4 style={{
        fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 8px",
        fontFamily: "'Space Grotesk', 'DM Sans', sans-serif",
      }}>{tool.name}</h4>
      <p style={{
        fontSize: 13.5, color: "#64748b", lineHeight: 1.6, margin: 0,
        fontFamily: "'DM Sans', sans-serif",
      }}>{tool.desc}</p>
      <div style={{
        marginTop: 16, fontSize: 13, color: tool.color, fontWeight: 600,
        fontFamily: "'JetBrains Mono', monospace", display: "flex", alignItems: "center", gap: 6,
      }}>Get started <span style={{ transition: "transform 0.2s", transform: hovered ? "translateX(4px)" : "none", display: "inline-block" }}>→</span></div>
    </div>
  );
}

export default function TechBlogHome() {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = activeCategory === "All" ? ARTICLES : ARTICLES.filter((a) => a.category === activeCategory);

  return (
    <div style={{
      minHeight: "100vh",
      background: "transparent",
      color: "#0f172a",
      fontFamily: "'DM Sans', sans-serif",
      overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: rgba(0,0,0,0.15); color: #0f172a; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f8fafc; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideInLeft { from { opacity:0; transform:translateX(-40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes slideInRight { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes gridScroll { 0% { background-position: 0 0; } 100% { background-position: 60px 0; } }
        .fade-up { animation: fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) forwards; }
        .fade-in { opacity:0; animation: fadeIn 0.6s ease forwards; }
        .slide-left { opacity:0; animation: slideInLeft 0.7s cubic-bezier(0.22,1,0.36,1) forwards; }
        .slide-right { opacity:0; animation: slideInRight 0.7s cubic-bezier(0.22,1,0.36,1) forwards; }
        .scale-in { opacity:0; animation: scaleIn 0.6s cubic-bezier(0.22,1,0.36,1) forwards; }
        .stagger-1 { animation-delay: 0.1s; }
        .stagger-2 { animation-delay: 0.2s; }
        .stagger-3 { animation-delay: 0.3s; }
        .stagger-4 { animation-delay: 0.4s; }
        .stagger-5 { animation-delay: 0.5s; }
        .stagger-6 { animation-delay: 0.6s; }
        .nav-link { color:#64748b; text-decoration:none; font-size:14px; font-weight:500; transition:color 0.2s; padding:6px 0; position:relative; }
        .nav-link:hover { color:#0f172a; }
        .nav-link::after { content:''; position:absolute; bottom:0; left:0; width:0; height:1.5px; background:#0f172a; transition:width 0.25s; }
        .nav-link:hover::after { width:100%; }
        input:focus { border-color: #0f172a !important; box-shadow: 0 0 0 3px rgba(0,0,0,0.1) !important; }
        .footer-link:hover { color: #fff !important; }
      `}</style>

      {/* BG grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: "linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
        animation: "gridScroll 3s linear infinite",
        maskImage: "linear-gradient(to bottom, transparent, black 8%, black 92%, transparent)",
        WebkitMaskImage: "linear-gradient(to bottom, transparent, black 8%, black 92%, transparent)",
      }} />

      {/* NAVBAR */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "0 48px", height: 72,
        background: "#fefefe",
        backdropFilter: "none",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Logo */}
        <a href="#" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img src="/logo.png" alt="ByteShift" style={{ height: 95 }} />
        </a>

        {/* Nav links */}
        <div style={{ display: "flex", gap: 36, alignItems: "center" }}>
          {["Trending", "Dev Setup", "Lab", "About"].map((l) => (
            <a key={l} href={`#${l === "Trending" ? "news" : l.toLowerCase().replace(" ", "-")}`} className="nav-link">{l}</a>
          ))}
          <a href="/signup" style={{
            padding: "8px 20px", borderRadius: 8,
            background: "#0f172a", color: "#fff",
            fontSize: 13.5, fontWeight: 600, textDecoration: "none",
            fontFamily: "'DM Sans', sans-serif",
            transition: "background 0.2s",
          }}>Get Started</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        position: "relative", zIndex: 1, padding: "140px 40px 100px",
        maxWidth: 1200, margin: "0 auto",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }}>

          {/* LEFT COLUMN */}
          <div className="slide-left">
            <h1 style={{
              fontSize: "clamp(38px, 5.5vw, 66px)", fontWeight: 800, lineHeight: 1.06,
              fontFamily: "'Space Grotesk', sans-serif", margin: "0 0 20px",
              letterSpacing: "-0.03em", color: "#0f172a",
            }}>
              Navigate the<br />Digital Frontier
            </h1>
            <p style={{
              fontSize: 17, color: "#64748b", lineHeight: 1.65,
              maxWidth: 460, margin: "0 0 32px", fontFamily: "'DM Sans', sans-serif",
            }}>
              Cut through the clutter — the latest in AI, hardware deep dives, developer tool breakdowns, and gaming culture. Handpicked for those who build and create.
            </p>

            {/* CTA buttons */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
              <a href="#news" style={{
                padding: "13px 24px", borderRadius: 10,
                background: "#0f172a", color: "#fff",
                fontWeight: 700, fontSize: 15, textDecoration: "none",
                fontFamily: "'DM Sans', sans-serif",
                display: "inline-flex", alignItems: "center", gap: 6,
                transition: "background 0.2s",
              }}>Start Reading <span style={{ fontSize: 17 }}>›</span></a>
              <a href="#lab" style={{
                padding: "13px 24px", borderRadius: 10,
                background: "#fff", border: "1.5px solid #e2e8f0",
                color: "#0f172a", fontWeight: 600, fontSize: 15, textDecoration: "none",
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                transition: "all 0.2s",
              }}>Try the Lab</a>
            </div>

            {/* Stats row */}
            <div style={{ display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" }}>
              {/* Avatar stack */}
              <div style={{ display: "flex" }}>
                {["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"].map((color, i) => (
                  <div key={i} style={{
                    width: 33, height: 33, borderRadius: "50%",
                    background: color, border: "2.5px solid #fff",
                    marginLeft: i > 0 ? -9 : 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700, color: "#fff",
                    fontFamily: "'Space Grotesk', sans-serif",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                  }}>
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
                <div style={{
                  width: 33, height: 33, borderRadius: "50%",
                  background: "#f1f5f9", border: "2.5px solid #fff",
                  marginLeft: -9,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 600, color: "#64748b",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                }}>+</div>
              </div>
              {/* Stats */}
              {[
                { value: "12K+", label: "Active Readers" },
                { value: "240+", label: "Stories & Guides" },
                { value: "98%", label: "Reader Satisfaction" },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{
                    fontSize: 20, fontWeight: 800, color: "#0f172a",
                    fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.2,
                  }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN — Content Preview Card */}
          <AnimateIn className="slide-right" delay={0.2} style={{ display: "flex", justifyContent: "center" }}>
            <div style={{
              background: "#fff",
              borderRadius: 20,
              padding: "36px 32px 28px",
              boxShadow: "0 12px 56px rgba(0,0,0,0.09), 0 2px 16px rgba(0,0,0,0.05)",
              width: "100%", maxWidth: 420,
              border: "1px solid #f1f5f9",
              position: "relative",
            }}>
              {/* Corner accents */}
              <div style={{ position: "absolute", top: 16, left: 16, width: 16, height: 16, borderTop: "2px solid #cbd5e1", borderLeft: "2px solid #cbd5e1", borderRadius: "2px 0 0 0" }} />
              <div style={{ position: "absolute", top: 16, right: 16, width: 16, height: 16, borderTop: "2px solid #cbd5e1", borderRight: "2px solid #cbd5e1", borderRadius: "0 2px 0 0" }} />
              <div style={{ position: "absolute", bottom: 16, left: 16, width: 16, height: 16, borderBottom: "2px solid #cbd5e1", borderLeft: "2px solid #cbd5e1", borderRadius: "0 0 0 2px" }} />
              <div style={{ position: "absolute", bottom: 16, right: 16, width: 16, height: 16, borderBottom: "2px solid #cbd5e1", borderRight: "2px solid #cbd5e1", borderRadius: "0 0 2px 0" }} />

              {/* Header */}
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: 2.5, color: "#94a3b8",
                  textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", marginBottom: 14,
                }}>TOPICS WE EXPLORE</div>
                <h3 style={{
                  fontSize: 22, fontWeight: 700, color: "#0f172a",
                  fontFamily: "'Space Grotesk', sans-serif", margin: 0, letterSpacing: "-0.01em",
                }}>Your Weekly Rundown</h3>
              </div>

              {/* Pillars */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { icon: <Bot size={18} />, label: "AI & Innovation", desc: "New models, research drops, and industry shifts", color: "#3b82f6" },
                  { icon: <Terminal size={18} />, label: "Tools & Hardware", desc: "Honest reviews of editors, devices, and setups", color: "#0f172a" },
                  { icon: <Sparkles size={18} />, label: "Gaming & Dev Life", desc: "The intersection of play, code, and community", color: "#f59e0b" },
                  { icon: <Zap size={18} />, label: "Workflow Hacks", desc: "Practical tips to build faster and stay focused", color: "#10b981" },
                ].map((p) => (
                  <div key={p.label} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 16px", borderRadius: 12,
                    border: "1px solid #f1f5f9", background: "#fafafa",
                    transition: "all 0.2s",
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 10,
                      background: `${p.color}10`, border: `1px solid ${p.color}20`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: p.color, flexShrink: 0,
                    }}>{p.icon}</div>
                    <div>
                      <div style={{
                        fontSize: 14, fontWeight: 700, color: "#0f172a",
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}>{p.label}</div>
                      <div style={{
                        fontSize: 12.5, color: "#94a3b8",
                        fontFamily: "'DM Sans', sans-serif", marginTop: 1,
                      }}>{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{
                borderTop: "1px solid #f1f5f9", paddingTop: 14, marginTop: 20,
                textAlign: "center",
              }}>
                <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>
                  Fresh content every week · Made for builders
                </span>
              </div>
            </div>
          </AnimateIn>

        </div>
      </section>

      {/* NEWS SECTION */}
      <div style={{ position: "relative", zIndex: 1, background: "#fff" }}>
      <section id="news" style={{ padding: "60px 40px 80px", maxWidth: 1200, margin: "0 auto" }}>
        <AnimateIn className="fade-up">
        <div style={{ marginBottom: 40 }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: "#0f172a", letterSpacing: 2,
            textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", marginBottom: 12,
          }}>Latest Stories</div>
          <h2 style={{
            fontSize: 32, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: "-0.01em", margin: "0 0 24px", color: "#0f172a",
          }}>What the dev world is talking about</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CATEGORIES.map((c) => (
              <CategoryPill key={c} label={c} active={activeCategory === c} onClick={() => setActiveCategory(c)} />
            ))}
          </div>
        </div>
        </AnimateIn>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 24,
        }}>
          {filtered.map((a, i) => <AnimateIn key={a.id} className="fade-up" delay={0.1 * i}><ArticleCard article={a} index={i} /></AnimateIn>)}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#94a3b8", fontFamily: "'JetBrains Mono', monospace" }}>
            Nothing here yet — new stories are on the way.
          </div>
        )}
      </section>
      </div>

      {/* DEV SETUP SECTION */}
      <div style={{ position: "relative", zIndex: 1, background: "#fff" }}>
      <section id="dev-setup" style={{
        padding: "80px 40px", maxWidth: 1200, margin: "0 auto",
      }}>
        <AnimateIn className="fade-up">
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: "#3b82f6", letterSpacing: 2,
            textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", marginBottom: 12,
          }}>Toolbox</div>
          <h2 style={{
            fontSize: 32, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: "-0.01em", margin: "0 0 12px", color: "#0f172a",
          }}>Essential tools to level up your workflow</h2>
          <p style={{ fontSize: 15, color: "#64748b", maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
            Hand-selected editors, terminals, and utilities chosen for the way developers actually work. Set up once and start shipping.
          </p>
        </div>
        </AnimateIn>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20,
        }}>
          {DEV_TOOLS.map((t, i) => <AnimateIn key={t.name} className="scale-in" delay={0.08 * i}><ToolCard tool={t} index={i} /></AnimateIn>)}
        </div>
      </section>
      </div>

      {/* LAB SECTION */}
      <div style={{ position: "relative", zIndex: 1, background: "#fff" }}>
      <section id="lab" style={{
        padding: "80px 40px", maxWidth: 900, margin: "0 auto",
      }}>
        <AnimateIn className="fade-up">
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: "#f59e0b", letterSpacing: 2,
            textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", marginBottom: 12,
          }}>The Lab</div>
          <h2 style={{
            fontSize: 32, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: "-0.01em", margin: "0 0 12px", color: "#0f172a",
          }}>How Fast Can You Type?</h2>
          <p style={{ fontSize: 15, color: "#64748b", maxWidth: 460, margin: "0 auto", lineHeight: 1.6 }}>
            Put your fingers to the test with our dev-oriented typing challenge. Toggle between everyday words and real code syntax.
          </p>
        </div>
        </AnimateIn>
        <AnimateIn className="scale-in" delay={0.15}>
        <TypingTest />
        </AnimateIn>
      </section>
      </div>

      {/* FOOTER */}
      <div style={{ position: "relative", zIndex: 1, background: "#000" }}>
      <footer style={{
        padding: "60px 40px 40px", maxWidth: 1200, margin: "0 auto",
      }}>
        <AnimateIn className="fade-up">
        <div style={{
          display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 48,
        }}>
          <div>
            <div style={{ marginBottom: 16 }}>
              <img src="/logo.png" alt="ByteShift" style={{ height: 100, filter: "invert(1)" }} />
            </div>
            <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, maxWidth: 340 }}>
              Navigating the digital frontier — covering AI developments, honest hardware reviews, gaming culture, and productivity strategies for the people who build the future.
            </p>
          </div>
          <div>
            <h4 style={{
              fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: 1.5,
              textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", marginBottom: 16,
            }}>Quick Links</h4>
            {["Trending", "Dev Setup", "Lab", "About"].map((l) => (
              <a key={l} href="#" className="footer-link" style={{
                display: "block", fontSize: 14, color: "rgba(255,255,255,0.7)", textDecoration: "none",
                marginBottom: 10, transition: "color 0.2s",
              }}>{l}</a>
            ))}
          </div>
          <div>
            <h4 style={{
              fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: 1.5,
              textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace", marginBottom: 16,
            }}>Legal</h4>
            {["Privacy Policy", "Terms of Service"].map((l) => (
              <a key={l} href="#" className="footer-link" style={{
                display: "block", fontSize: 14, color: "rgba(255,255,255,0.7)", textDecoration: "none", marginBottom: 10, transition: "color 0.2s",
              }}>{l}</a>
            ))}
          </div>
        </div>
        <div style={{
          marginTop: 48, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.15)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "'JetBrains Mono', monospace" }}>
            © 2026 ByteShift. All rights reserved.
          </span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontFamily: "'JetBrains Mono', monospace" }}>
            Built with Next.js
          </span>
        </div>
        </AnimateIn>
      </footer>
      </div>
    </div>
  );
}
