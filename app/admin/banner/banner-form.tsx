"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const VARIANTS = [
  { value: "info", label: "정보" },
  { value: "warning", label: "경고" },
  { value: "announcement", label: "공지" },
] as const;

const VARIANT_PREVIEW: Record<string, string> = {
  info: "bg-surface-overlay text-text border-border",
  warning: "bg-medium/15 text-medium border-medium/40",
  announcement: "bg-gold/15 text-gold border-gold/40",
};

interface Props {
  initial: {
    enabled: boolean;
    message: string;
    variant: string;
  };
}

export default function BannerForm({ initial }: Props) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initial.enabled);
  const [message, setMessage] = useState(initial.message);
  const [variant, setVariant] = useState(initial.variant);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/banner", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, message, variant }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "저장 실패");
      }
      setSavedAt(new Date());
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const previewClass = VARIANT_PREVIEW[variant] ?? VARIANT_PREVIEW.info;

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <div>
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">미리보기</div>
        <div
          className={`w-full rounded-md border ${previewClass} px-4 py-2 text-sm text-center ${
            !enabled || !message.trim() ? "opacity-40" : ""
          }`}
        >
          {message.trim() || "(메시지 없음)"}
        </div>
        {!enabled && (
          <p className="text-xs text-text-muted mt-1">현재 비활성화 상태 — 사이트에 표시되지 않음</p>
        )}
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="w-4 h-4"
        />
        <span className="text-sm font-semibold">배너 활성화</span>
      </label>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="banner-message" className="text-sm font-semibold">
          메시지
        </label>
        <textarea
          id="banner-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="예: 5월 10일 02:00 ~ 04:00 점검 예정"
          className="px-3 py-2 rounded-md border border-border bg-surface-raised text-sm focus:outline-none focus:border-[rgba(255,255,255,0.3)]"
        />
        <p className="text-xs text-text-muted">{message.length} / 500</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="banner-variant" className="text-sm font-semibold">
          종류
        </label>
        <select
          id="banner-variant"
          value={variant}
          onChange={(e) => setVariant(e.target.value)}
          className="h-9 px-2 rounded-md border border-border bg-surface-raised text-sm w-fit"
        >
          {VARIANTS.map((v) => (
            <option key={v.value} value={v.value}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-sm text-hard">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="h-10 px-4 rounded-md bg-text text-surface text-sm font-bold disabled:opacity-50 cursor-pointer"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
        {savedAt && (
          <span className="text-xs text-text-muted">
            저장됨 ({savedAt.toLocaleTimeString("ko-KR")})
          </span>
        )}
      </div>
    </form>
  );
}
