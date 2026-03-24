"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input:focus { border-color: #0f172a !important; box-shadow: 0 0 0 3px rgba(0,0,0,0.08) !important; }
        .auth-input { transition: border-color 0.2s, box-shadow 0.2s; }
        .auth-btn { transition: background 0.2s, transform 0.1s; }
        .auth-btn:active { transform: scale(0.98); }
      `}</style>

      {/* Left - Visual */}
      <div style={{
        flex: 1, background: "#fefefe",
        display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: 60, position: "relative", overflow: "hidden",
      }}>
        {/* Grid bg */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
        <div style={{ position: "relative", textAlign: "center", maxWidth: 400 }}>
          <h2 style={{
            fontSize: 32, fontWeight: 700, color: "#0f172a",
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: "-0.02em", margin: "0 0 16px",
          }}>Stay in the Loop</h2>
          <p style={{
            fontSize: 16, color: "#64748b",
            lineHeight: 1.7,
          }}>
            The latest in AI, hardware breakdowns, developer tools, and gaming culture — all in one place for builders and creators.
          </p>
        </div>
      </div>

      {/* Right - Form */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center",
        padding: "40px 24px", background: "#fff",
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          {/* Back link */}
          <Link href="/" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 14, color: "#64748b", textDecoration: "none",
            marginBottom: 40, fontWeight: 500,
          }}>
            <ArrowLeft size={16} /> Back to home
          </Link>

          {/* Heading */}
          <h1 style={{
            fontSize: 28, fontWeight: 700, color: "#0f172a",
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: "-0.02em", margin: "0 0 8px",
          }}>Good to see you again</h1>
          <p style={{ fontSize: 15, color: "#64748b", margin: "0 0 32px" }}>
            Log in to pick up where you left off
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 20 }}>
              <label style={{
                display: "block", fontSize: 13, fontWeight: 600,
                color: "#0f172a", marginBottom: 6,
              }}>Email address</label>
              <input
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 10,
                  border: "1.5px solid #e2e8f0", fontSize: 15, outline: "none",
                  color: "#0f172a", background: "#f8fafc",
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 12 }}>
              <label style={{
                display: "block", fontSize: 13, fontWeight: 600,
                color: "#0f172a", marginBottom: 6,
              }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  style={{
                    width: "100%", padding: "12px 48px 12px 16px", borderRadius: 10,
                    border: "1.5px solid #e2e8f0", fontSize: 15, outline: "none",
                    color: "#0f172a", background: "#f8fafc",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#94a3b8",
                    display: "flex", alignItems: "center",
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: "right", marginBottom: 28 }}>
              <a href="#" style={{
                fontSize: 13, color: "#64748b", textDecoration: "none", fontWeight: 500,
              }}>Forgot password?</a>
            </div>

            {/* Submit */}
            <button className="auth-btn" type="submit" style={{
              width: "100%", padding: "14px", borderRadius: 10,
              background: "#0f172a", color: "#fff",
              fontSize: 15, fontWeight: 700, border: "none", cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}>Sign In</button>
          </form>

          {/* Divider */}
          <div style={{
            display: "flex", alignItems: "center", gap: 16,
            margin: "28px 0",
          }}>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          </div>

          {/* Google */}
          <button className="auth-btn" style={{
            width: "100%", padding: "13px", borderRadius: 10,
            background: "#fff", border: "1.5px solid #e2e8f0",
            fontSize: 14, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            color: "#0f172a", fontFamily: "'DM Sans', sans-serif",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Sign up link */}
          <p style={{
            textAlign: "center", marginTop: 28,
            fontSize: 14, color: "#64748b",
          }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" style={{
              color: "#0f172a", fontWeight: 700, textDecoration: "none",
            }}>Sign up</Link>
          </p>
        </div>
      </div>

    </div>
  );
}
