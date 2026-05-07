"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

type ManualStatus = "loading" | "posting-message" | "ok" | "unauth";
type NonceStatus = "loading" | "claiming" | "claimed" | "error";

function DesktopLoginInner() {
  const { data: session, status: sessionStatus } = useSession();
  const searchParams = useSearchParams();
  const nonce = searchParams.get("nonce");

  // ─── Nonce auto-pickup flow ────────────────────────────────────────
  const [nonceStatus, setNonceStatus] = useState<NonceStatus>("loading");
  const [nonceError, setNonceError] = useState<string | null>(null);
  const claimedRef = useRef(false);

  // ─── Manual fallback flow (no nonce) ───────────────────────────────
  const [token, setToken] = useState<string | null>(null);
  const [manualStatus, setManualStatus] = useState<ManualStatus>("loading");
  const [copied, setCopied] = useState(false);
  const messageSent = useRef(false);

  const callbackUrl = nonce
    ? `/desktop-login?nonce=${encodeURIComponent(nonce)}`
    : "/desktop-login";

  // Step 1: if not authenticated, redirect to OAuth (preserve nonce)
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      signIn(undefined, { callbackUrl });
    }
  }, [sessionStatus, callbackUrl]);

  // Step 2a (nonce flow): once authenticated AND nonce present, claim once
  useEffect(() => {
    if (!nonce) return;
    if (sessionStatus !== "authenticated" || !session?.user) return;
    if (claimedRef.current) return;
    claimedRef.current = true;

    setNonceStatus("claiming");
    fetch("/api/auth/desktop-login-claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nonce }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const text = await r.text().catch(() => "");
          throw new Error(text || `claim failed (${r.status})`);
        }
        return r.json();
      })
      .then(() => {
        setNonceStatus("claimed");
        // Auto-close after 3 seconds if opened as a popup
        setTimeout(() => {
          try {
            window.close();
          } catch {
            /* may be blocked by browser policy */
          }
        }, 3000);
      })
      .catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : "토큰 등록 실패";
        setNonceError(msg);
        setNonceStatus("error");
      });
  }, [nonce, sessionStatus, session]);

  // Step 2b (manual flow): once authenticated AND no nonce, fetch token
  useEffect(() => {
    if (nonce) return;
    if (sessionStatus !== "authenticated" || !session?.user) return;

    fetch("/api/auth/desktop-token")
      .then((r) => {
        if (!r.ok) {
          setManualStatus("unauth");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d?.token) {
          setToken(d.token);
          setManualStatus("posting-message");
        } else {
          setManualStatus("unauth");
        }
      })
      .catch(() => setManualStatus("unauth"));
  }, [nonce, sessionStatus, session]);

  // Step 3 (manual flow): postMessage to opener then auto-close
  useEffect(() => {
    if (nonce) return;
    if (manualStatus !== "posting-message" || !token || messageSent.current) return;
    messageSent.current = true;

    try {
      if (window.opener && typeof window.opener.postMessage === "function") {
        window.opener.postMessage({ type: "desktop-token", token }, "*");
      }
    } catch {
      // opener may be cross-origin or unavailable; fallback to manual copy
    }

    setManualStatus("ok");

    const timer = setTimeout(() => {
      try {
        window.close();
      } catch {
        /* may be blocked by browser policy */
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [nonce, manualStatus, token]);

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
    error: { fontSize: 13, color: "#ff5577", marginBottom: 24, lineHeight: 1.7 },
  };

  // ─── Loading state (any flow) ──────────────────────────────────────
  if (sessionStatus === "loading") {
    return (
      <div style={S.root}>
        <div style={S.title}>ComboGG 데스크톱 로그인</div>
        <div style={S.desc}>처리 중…</div>
      </div>
    );
  }

  // ─── Nonce auto-pickup flow ────────────────────────────────────────
  if (nonce) {
    if (sessionStatus === "unauthenticated") {
      return (
        <div style={S.root}>
          <div style={S.title}>ComboGG 데스크톱 로그인</div>
          <div style={S.desc}>로그인 페이지로 이동 중…</div>
        </div>
      );
    }

    if (nonceStatus === "loading" || nonceStatus === "claiming") {
      return (
        <div style={S.root}>
          <div style={S.title}>ComboGG 데스크톱 로그인</div>
          <div style={S.desc}>토큰 발급 중…</div>
        </div>
      );
    }

    if (nonceStatus === "claimed") {
      return (
        <div style={S.root}>
          <div style={S.title}>ComboGG 데스크톱 로그인</div>
          <div style={S.success}>
            완료! 앱으로 돌아가세요.<br />
            창이 자동으로 닫힙니다.
          </div>
        </div>
      );
    }

    // nonceStatus === "error" — fall back to manual UI below
    return (
      <div style={S.root}>
        <div style={S.title}>ComboGG 데스크톱 로그인</div>
        <div style={S.error}>
          자동 토큰 등록에 실패했습니다.{nonceError ? ` (${nonceError})` : ""}<br />
          아래 고급 모드로 토큰을 직접 복사해 앱에 붙여넣을 수 있습니다.
        </div>
        <ManualFallback
          token={token}
          manualStatus={manualStatus}
          setManualStatus={setManualStatus}
          setToken={setToken}
          copied={copied}
          copy={copy}
          styles={S}
          callbackUrl={callbackUrl}
        />
      </div>
    );
  }

  // ─── Manual fallback flow (no nonce — backward compat) ─────────────
  if (manualStatus === "loading" || manualStatus === "posting-message") {
    return (
      <div style={S.root}>
        <div style={S.title}>ComboGG 데스크톱 로그인</div>
        <div style={S.desc}>처리 중…</div>
      </div>
    );
  }

  if (manualStatus === "unauth") {
    return (
      <div style={S.root}>
        <div style={S.title}>ComboGG 데스크톱 로그인</div>
        <div style={{ ...S.desc, color: "#ff5577" }}>
          로그인이 필요합니다.{" "}
          <button
            style={{
              background: "none",
              border: "none",
              color: "#00d4ff",
              cursor: "pointer",
              fontSize: 13,
              padding: 0,
            }}
            onClick={() => signIn(undefined, { callbackUrl })}
          >
            로그인하기 →
          </button>
        </div>
      </div>
    );
  }

  // manualStatus === "ok"
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
      <div style={S.warn}>
        이 토큰은 비밀번호와 같습니다. 타인에게 공유하지 마세요. 30일간 유효합니다.
      </div>
    </div>
  );
}

// Helper for the nonce-error fallback path: lazily fetch the manual token.
function ManualFallback({
  token,
  manualStatus,
  setManualStatus,
  setToken,
  copied,
  copy,
  styles,
  callbackUrl,
}: {
  token: string | null;
  manualStatus: ManualStatus;
  setManualStatus: (s: ManualStatus) => void;
  setToken: (t: string | null) => void;
  copied: boolean;
  copy: () => Promise<void>;
  styles: Record<string, React.CSSProperties>;
  callbackUrl: string;
}) {
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetch("/api/auth/desktop-token")
      .then((r) => {
        if (!r.ok) {
          setManualStatus("unauth");
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (d?.token) {
          setToken(d.token);
          setManualStatus("ok");
        } else {
          setManualStatus("unauth");
        }
      })
      .catch(() => setManualStatus("unauth"));
  }, [setManualStatus, setToken]);

  if (manualStatus === "loading" || manualStatus === "posting-message") {
    return <div style={styles.desc}>고급 모드 토큰 발급 중…</div>;
  }

  if (manualStatus === "unauth") {
    return (
      <div style={{ ...styles.desc, color: "#ff5577" }}>
        토큰 발급에 실패했습니다.{" "}
        <button
          style={{
            background: "none",
            border: "none",
            color: "#00d4ff",
            cursor: "pointer",
            fontSize: 13,
            padding: 0,
          }}
          onClick={() => signIn(undefined, { callbackUrl })}
        >
          다시 로그인 →
        </button>
      </div>
    );
  }

  return (
    <>
      <div style={styles.box}>{token}</div>
      <button style={styles.btn} onClick={copy}>
        {copied ? "✓ 복사됨" : "토큰 복사"}
      </button>
      <div style={styles.warn}>
        이 토큰은 비밀번호와 같습니다. 타인에게 공유하지 마세요. 30일간 유효합니다.
      </div>
    </>
  );
}

export default function DesktopLoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            padding: "48px 32px",
            fontFamily: "monospace",
            background: "#08080f",
            color: "#fff",
            minHeight: "100vh",
          }}
        >
          처리 중…
        </div>
      }
    >
      <DesktopLoginInner />
    </Suspense>
  );
}
