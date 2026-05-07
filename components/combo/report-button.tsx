"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Props {
  targetType: "combo" | "comment";
  targetId: string;
  variant?: "button" | "icon";
  className?: string;
}

export default function ReportButton({
  targetType,
  targetId,
  variant = "button",
  className,
}: Props) {
  const router = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const triggerOpen = () => {
    if (!session?.user) {
      router.push("/login");
      return;
    }
    setOpen(true);
    setError(null);
    setDone(false);
  };

  const close = () => {
    setOpen(false);
    setReason("");
    setError(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason: reason.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "신고 실패");
      }
      setDone(true);
      setTimeout(close, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "신고 실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={triggerOpen}
          className={
            className ??
            "text-xs text-text-muted hover:text-hard transition-colors cursor-pointer"
          }
          aria-label="신고"
          title="신고"
        >
          신고
        </button>
      ) : (
        <button
          type="button"
          onClick={triggerOpen}
          className={
            className ??
            "w-full h-10 rounded-xl border border-border font-semibold text-sm text-text-secondary hover:bg-surface-overlay hover:text-text transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          }
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 21V4m0 0h11l-2 4 2 4H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          신고
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-xl border border-border bg-surface-raised p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-bold mb-1">신고하기</h2>
            <p className="text-xs text-text-muted mb-4">
              {targetType === "combo" ? "이 콤보를" : "이 댓글을"} 검토 요청합니다. 관리자가 확인 후 조치합니다.
            </p>

            <form onSubmit={submit} className="flex flex-col gap-3">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={1000}
                rows={4}
                placeholder="사유 (선택, 1000자 이내)"
                className="px-3 py-2 rounded-md border border-border bg-surface text-sm focus:outline-none focus:border-[rgba(255,255,255,0.3)]"
                autoFocus
              />

              {error && <p className="text-xs text-hard">{error}</p>}
              {done && <p className="text-xs text-good">신고가 접수되었습니다.</p>}

              <div className="flex justify-end gap-2 mt-1">
                <button
                  type="button"
                  onClick={close}
                  disabled={submitting}
                  className="h-9 px-3 rounded-md border border-border text-sm font-semibold hover:bg-surface-overlay disabled:opacity-50 cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting || done}
                  className="h-9 px-3 rounded-md bg-hard text-white text-sm font-bold disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "전송 중..." : "신고"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
