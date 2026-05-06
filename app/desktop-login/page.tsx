"use client";

import { useEffect, useRef, useState } from "react";
import { signIn, useSession } from "next-auth/react";

type Status = "loading" | "posting-message" | "ok" | "unauth";

export default function DesktopLoginPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [token, setToken] = useState<string | null>(null);
  const [pageStatus, setPageStatus] = useState<Status>("loading");
  const [copied, setCopied] = useState(false);
  const messageSent = useRef(false);

  // Step 1: if not authenticated, redirect to OAuth with callbackUrl=/desktop-login
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      signIn(undefined, { callbackUrl: "/desktop-login" });
    }
  }, [sessionStatus]);

  // Step 2: once authenticated, fetch the desktop token
  useEffect(() => {
    if (sessionStatus !== "authenticated" || !session?.user) return;

    fetch("/api/auth/desktop-token")
      .then((r) => {
        if (!r.ok) { setPageStatus("unauth"); return null; }
        return r.json();
      })
      .then((d) => {
        if (d?.token) {
          setToken(d.token);
          setPageStatus("posting-message");
        } else {
          setPageStatus("unauth");
        }
      })
      .catch(() => setPageStatus("unauth"));
  }, [sessionStatus, session]);

  // Step 3: once we have the token, postMessage to opener then auto-close
  useEffect(() => {
    if (pageStatus !== "posting-message" || !token || messageSent.current) return;
    messageSent.current = true;

    // Send token to the Overwolf overlay that opened this window
    try {
      if (window.opener && typeof window.opener.postMessage === "function") {
        window.opener.postMessage({ type: "desktop-token", token }, "*");
      }
    } catch {
      // opener may be cross-origin or unavailable; fallback to manual copy
    }

    setPageStatus("ok");

    // Auto-close after 3 seconds if opened as a popup
    const timer = setTimeout(() => {
      try { window.close(); } catch { /* may be blocked by browser policy */ }
    }, 3000);

    return () => clearTimeout(timer);
  }, [pageStatus, token]);

  const copy = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const S: Record<string, React.CSSProperties> = {
    root: {
      padding: "48px 32px",
      fontFamily: "monospace",
      background: "#08080f",
      color: "#fff",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-start",
    },
    title: { fontSize: 22, fontWeight: 800, color: "#00d4ff", marginBottom: 12, letterSpacing: 1 },
    desc: { fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 24, lineHeight: 1.7 },
    box: {
      background: "#111",
      border: "1px solid rgba(0,200,255,0.3)",
      borderRadius: 8,
      padding: "14px 16px",
      marginBottom: 16,
      wordBreak: "break-all",
      fontSize: 11,
      color: "#00d4ff",
      lineHeight: 1.6,
      maxWidth: 600,
      width: "100%",
    },
    btn: {
      background: "#0066ff",
      color: "#fff",
      border: "none",
      padding: "10px 28px",
      borderRadius: 6,
      cursor: "pointer",
      fontSize: 14,
      fontWeight: 700,
    },
    warn: { fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 16 },
    success: { fontSize: 13, color: "#00d4ff", marginBottom: 24, lineHeight: 1.7 },
  };

  if (sessionStatus === "loading" || pageStatus === "loading" || pageStatus === "posting-message") {
    return (
      <div style={S.root}>
        <div style={S.title}>ComboGG 데스크톱 로그인</div>
        <div style={S.desc}>처리 중…</div>
      </div>
    );
  }

  if (pageStatus === "unauth") {
    return (
      <div style={S.root}>
        <div style={S.title}>ComboGG 데스크톱 로그인</div>
        <div style={{ ...S.desc, color: "#ff5577" }}>
          로그인이 필요합니다.{" "}
          <button
            style={{ background: "none", border: "none", color: "#00d4ff", cursor: "pointer", fontSize: 13, padding: 0 }}
            onClick={() => signIn(undefined, { callbackUrl: "/desktop-login" })}
          >
            로그인하기 →
          </button>
        </div>
      </div>
    );
  }

  // pageStatus === "ok"
  return (
    <div style={S.root}>
      <div style={S.title}>ComboGG 데스크톱 로그인</div>
      <div style={S.success}>
        로그인 성공 — 앱으로 돌아가는 중…<br />
        창이 자동으로 닫힙니다. 닫히지 않으면 아래 토큰을 복사하여 앱에 붙여넣으세요.
      </div>
      <div style={S.box}>{token}</div>
      <button style={S.btn} onClick={copy}>
        {copied ? "✓ 복사됨" : "토큰 복사"}
      </button>
      <div style={S.warn}>이 토큰은 비밀번호와 같습니다. 타인에게 공유하지 마세요. 30일간 유효합니다.</div>
    </div>
  );
}
