"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Moon,
  Sun,
  Info,
  Newspaper,
  Wrench,
  Users,
  BookOpen,
  Zap,
  Globe,
  Code2,
  Server,
  MessageSquare,
  BarChart3,
  Heart,
  ExternalLink,
} from "lucide-react";
import { useTheme, darkColors } from "../theme-context";

function AnimateIn({
  children,
  className = "fade-up",
  delay = 0,
  style,
}: {
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
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
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

export default function AboutPage() {
  const { theme, toggle } = useTheme();
  const dark = theme === "dark";
  const c = darkColors(dark);
  const accent = dark ? "#f59e0b" : "#3b82f6";

  const whatWeDo = [
    {
      icon: <Newspaper size={24} />,
      title: "Curated Tech News",
      desc: "Hand-picked stories from Reddit, Hacker News, and GitHub — filtered for signal, not noise.",
    },
    {
      icon: <Wrench size={24} />,
      title: "Developer Tools Reviews",
      desc: "Honest breakdowns of IDEs, terminals, AI assistants, and dev workflows that actually matter.",
    },
    {
      icon: <MessageSquare size={24} />,
      title: "Community Feed",
      desc: "Real-time pulse from developer communities — trending repos, hot discussions, rising posts.",
    },
    {
      icon: <BookOpen size={24} />,
      title: "Reading Experience",
      desc: "Clean, distraction-free reading with dark mode, bookmarks, and infinite scroll built in.",
    },
  ];

  const techStack = [
    { name: "Next.js", color: dark ? "#fff" : "#000" },
    { name: "React", color: "#61dafb" },
    { name: "TypeScript", color: "#3178c6" },
    { name: "Vercel", color: dark ? "#fff" : "#000" },
    { name: "Reddit API", color: "#ff4500" },
    { name: "GitHub API", color: dark ? "#c9d1d9" : "#24292f" },
    { name: "Hacker News API", color: "#ff6600" },
  ];

  const stats = [
    { value: "4K+", label: "Articles" },
    { value: "8", label: "Sources" },
    { value: "3", label: "Feed Tabs" },
    { value: "100%", label: "Free" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: c.bg,
        color: c.text,
        fontFamily: "'DM Sans', sans-serif",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: ${c.selectionBg}; color: ${c.selectionColor}; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: ${c.scrollTrackBg}; }
        ::-webkit-scrollbar-thumb { background: ${c.scrollThumbBg}; border-radius: 3px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideInLeft { from { opacity:0; transform:translateX(-40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes slideInRight { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .fade-up { animation: fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) forwards; }
        .fade-in { opacity:0; animation: fadeIn 0.6s ease forwards; }
        .slide-left { opacity:0; animation: slideInLeft 0.7s cubic-bezier(0.22,1,0.36,1) forwards; }
        .slide-right { opacity:0; animation: slideInRight 0.7s cubic-bezier(0.22,1,0.36,1) forwards; }
        .scale-in { opacity:0; animation: scaleIn 0.6s cubic-bezier(0.22,1,0.36,1) forwards; }

        .about-card:hover {
          transform: translateY(-4px);
          box-shadow: ${c.cardShadowHover};
          border-color: ${accent}40 !important;
        }
        .tech-pill:hover {
          transform: translateY(-2px);
          box-shadow: ${c.cardShadowHover};
        }
        .stat-card:hover {
          transform: translateY(-4px);
          border-color: ${accent}40 !important;
        }
        .back-link:hover {
          color: ${accent} !important;
        }
        .back-link:hover svg {
          transform: translateX(-3px);
        }

        @media (max-width: 768px) {
          .about-nav-inner { padding: 0 16px !important; }
          .about-hero { padding: 120px 20px 60px !important; }
          .about-hero-title { font-size: 32px !important; }
          .about-hero-subtitle { font-size: 15px !important; max-width: 100% !important; }
          .about-section { padding: 60px 20px !important; }
          .about-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 16px !important; }
          .tech-stack-wrap { gap: 10px !important; }
          .about-section-title { font-size: 24px !important; }
          .about-footer-inner { flex-direction: column; gap: 12px !important; text-align: center; }
        }
      `}</style>

      {/* Header */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: `${c.navBg}ee`,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: `1px solid ${c.borderLight}`,
        }}
      >
        <div
          className="about-nav-inner"
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 32px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            className="back-link"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: c.textSecondary,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              transition: "color 0.2s",
            }}
          >
            <ArrowLeft size={18} style={{ transition: "transform 0.2s" }} />
            Back
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Info size={18} style={{ color: accent }} />
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontWeight: 600,
                fontSize: 16,
                color: c.text,
              }}
            >
              About
            </span>
          </div>

          <button
            onClick={toggle}
            style={{
              background: "none",
              border: `1px solid ${c.border}`,
              borderRadius: 10,
              padding: 8,
              cursor: "pointer",
              color: c.text,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        className="about-hero"
        style={{
          padding: "140px 32px 80px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(ellipse at 50% 0%, ${accent}08 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
        <AnimateIn className="fade-up">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 100,
              background: `${accent}15`,
              border: `1px solid ${accent}30`,
              marginBottom: 24,
              fontSize: 13,
              fontWeight: 500,
              color: accent,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <Zap size={14} />
            ByteShift
          </div>
        </AnimateIn>

        <AnimateIn className="fade-up" delay={0.1}>
          <h1
            className="about-hero-title"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 48,
              fontWeight: 700,
              lineHeight: 1.1,
              marginBottom: 20,
              background: `linear-gradient(135deg, ${c.text} 0%, ${c.textSecondary} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Your daily dose of
            <br />
            developer culture
          </h1>
        </AnimateIn>

        <AnimateIn className="fade-up" delay={0.2}>
          <p
            className="about-hero-subtitle"
            style={{
              fontSize: 17,
              color: c.textSecondary,
              lineHeight: 1.7,
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            Decode the tech world — AI, dev tools, gaming culture, and
            productivity for developers.
          </p>
        </AnimateIn>
      </section>

      {/* What We Do */}
      <section
        className="about-section"
        style={{
          padding: "80px 32px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <AnimateIn className="fade-up">
          <h2
            className="about-section-title"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 32,
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            What We Do
          </h2>
          <p
            style={{
              color: c.textSecondary,
              textAlign: "center",
              fontSize: 15,
              marginBottom: 48,
              maxWidth: 480,
              margin: "0 auto 48px",
              lineHeight: 1.6,
            }}
          >
            Everything a developer needs to stay in the loop — all in one place.
          </p>
        </AnimateIn>

        <div
          className="about-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 20,
          }}
        >
          {whatWeDo.map((item, i) => (
            <AnimateIn key={item.title} className="fade-up" delay={0.1 * i}>
              <div
                className="about-card"
                style={{
                  background: c.surface,
                  border: `1px solid ${c.borderLight}`,
                  borderRadius: 16,
                  padding: 28,
                  boxShadow: c.cardShadow,
                  transition: "all 0.3s ease",
                  cursor: "default",
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: `${accent}15`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: accent,
                    marginBottom: 16,
                  }}
                >
                  {item.icon}
                </div>
                <h3
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 18,
                    fontWeight: 600,
                    marginBottom: 8,
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    color: c.textSecondary,
                    fontSize: 14,
                    lineHeight: 1.6,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* Tech Stack */}
      <section
        className="about-section"
        style={{
          padding: "80px 32px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <AnimateIn className="fade-up">
          <h2
            className="about-section-title"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 32,
              fontWeight: 700,
              textAlign: "center",
              marginBottom: 12,
            }}
          >
            Tech Stack
          </h2>
          <p
            style={{
              color: c.textSecondary,
              textAlign: "center",
              fontSize: 15,
              marginBottom: 48,
              maxWidth: 480,
              margin: "0 auto 48px",
              lineHeight: 1.6,
            }}
          >
            The tools and APIs powering ByteShift under the hood.
          </p>
        </AnimateIn>

        <AnimateIn className="fade-up" delay={0.1}>
          <div
            className="tech-stack-wrap"
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 14,
            }}
          >
            {techStack.map((tech, i) => (
              <div
                key={tech.name}
                className="tech-pill"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 22px",
                  borderRadius: 12,
                  background: c.surface,
                  border: `1px solid ${c.borderLight}`,
                  boxShadow: c.cardShadow,
                  transition: "all 0.3s ease",
                  cursor: "default",
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: tech.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {tech.name}
                </span>
              </div>
            ))}
          </div>
        </AnimateIn>
      </section>

      {/* Team Section */}
      <section
        className="about-section"
        style={{
          padding: "80px 32px",
          maxWidth: 1200,
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <AnimateIn className="fade-up">
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${accent}30, ${accent}10)`,
              border: `2px solid ${accent}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <Users size={32} style={{ color: accent }} />
          </div>
          <h2
            className="about-section-title"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 32,
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            Meet the Team
          </h2>
          <p
            style={{
              color: c.textSecondary,
              fontSize: 15,
              lineHeight: 1.6,
              maxWidth: 420,
              margin: "0 auto",
            }}
          >
            Built by the ByteShift team — developers who believe staying
            informed shouldn&apos;t feel like a chore.
          </p>
        </AnimateIn>
      </section>

      {/* Stats Section */}
      <section
        className="about-section"
        style={{
          padding: "80px 32px",
          maxWidth: 1200,
          margin: "0 auto",
        }}
      >
        <AnimateIn className="fade-up">
          <div
            className="stats-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 20,
            }}
          >
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="stat-card"
                style={{
                  background: c.surface,
                  border: `1px solid ${c.borderLight}`,
                  borderRadius: 16,
                  padding: "32px 20px",
                  textAlign: "center",
                  boxShadow: c.cardShadow,
                  transition: "all 0.3s ease",
                  cursor: "default",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 36,
                    fontWeight: 700,
                    color: accent,
                    marginBottom: 6,
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    color: c.textSecondary,
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </AnimateIn>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: `1px solid ${c.borderLight}`,
          padding: "32px",
          marginTop: 40,
        }}
      >
        <div
          className="about-footer-inner"
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: c.textSecondary,
              textDecoration: "none",
              fontSize: 14,
              fontWeight: 500,
              transition: "color 0.2s",
            }}
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              color: c.textMuted,
              fontSize: 13,
            }}
          >
            Built with
            <Heart
              size={14}
              style={{ color: accent, fill: accent }}
            />
            &amp; Next.js
          </div>
        </div>
      </footer>
    </div>
  );
}
