"use client";

import { useEffect, useState } from "react";

export default function DesktopTokenPage() {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "unauth">("loading");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/auth/desktop-token")
      .then((r) => {
        if (r.status === 401) { setStatus("unauth"); return null; }
        return r.json();
      })
      .then((d) => {
        if (d?.token) { setToken(d.token); setStatus("ok"); }
      })
      .catch(() => setStatus("unauth"));
  }, []);

  const copy = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const S: Record<string, React.CSSProperties> = {
    root: { padding: "48px 32px", fontFamily: "monospace", background: "#08080f", color: "#fff", minHeight: "100vh" },
    title: { fontSize: 22, fontWeight: 800, color: "#00d4ff", marginBottom: 12, letterSpacing: 1 },
    desc: { fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 24, lineHeight: 1.7 },
    box: { background: "#111", border: "1px solid rgba(0,200,255,0.3)", borderRadius: 8, padding: "14px 16px", marginBottom: 16, wordBreak: "break-all", fontSize: 11, color: "#00d4ff", lineHeight: 1.6 },
    btn: { background: "#0066ff", color: "#fff", border: "none", padding: "10px 28px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 700 },
    warn: { fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 16 },
  };

  if (status === "loading") return <div style={S.root}>로딩 중…</div>;

  if (status === "unauth") return (
    <div style={S.root}>
      <div style={S.title}>ComboGG 데스크톱 토큰</div>
      <div style={{ ...S.desc, color: "#ff5577" }}>
        로그인이 필요합니다.{" "}
        <a href="/login" style={{ color: "#00d4ff" }}>로그인 →</a>
      </div>
    </div>
  );

  return (
    <div style={S.root}>
      <div style={S.title}>ComboGG 데스크톱 토큰</div>
      <div style={S.desc}>
        아래 토큰을 복사하여 오버레이 녹화 위젯의 토큰 입력창에 붙여넣으세요.<br />
        토큰은 30일간 유효합니다.
      </div>
      <div style={S.box}>{token}</div>
      <button style={S.btn} onClick={copy}>
        {copied ? "✓ 복사됨" : "복사하기"}
      </button>
      <div style={S.warn}>⚠ 이 토큰은 비밀번호와 같습니다. 타인에게 공유하지 마세요.</div>
    </div>
  );
}
