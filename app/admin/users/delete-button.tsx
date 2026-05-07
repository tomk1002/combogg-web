"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function UserDeleteButton({
  userId,
  nickname,
}: {
  userId: string;
  nickname: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const handleDelete = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "삭제 실패");
      }
      startTransition(() => router.refresh());
    } catch (err) {
      alert(err instanceof Error ? err.message : "삭제 실패");
      setBusy(false);
      setConfirming(false);
    }
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="px-2.5 py-1 rounded-md border border-hard/40 text-xs font-semibold text-hard hover:bg-hard/10 transition-colors cursor-pointer"
      >
        삭제
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-hard">정말 {nickname} 삭제?</span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={busy}
        className="px-2 py-1 rounded-md border border-hard text-xs font-semibold text-hard hover:bg-hard/10 transition-colors disabled:opacity-50 cursor-pointer"
      >
        확인
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        disabled={busy}
        className="px-2 py-1 rounded-md border border-border text-xs font-semibold text-text-secondary hover:bg-surface-overlay transition-colors disabled:opacity-50 cursor-pointer"
      >
        취소
      </button>
    </div>
  );
}
