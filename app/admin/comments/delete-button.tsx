"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function CommentDeleteButton({ commentId }: { commentId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const handleDelete = async () => {
    if (busy) return;
    if (!confirm("이 댓글을 삭제할까요?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      alert("삭제 실패");
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={busy}
      className="px-2.5 py-1 rounded-md border border-border text-xs font-semibold text-hard hover:bg-hard/10 transition-colors disabled:opacity-50 cursor-pointer"
    >
      삭제
    </button>
  );
}
