"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function ReportActionButtons({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const update = async (status: "resolved" | "dismissed") => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      alert("처리 실패");
      setBusy(false);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => update("resolved")}
        disabled={busy}
        className="px-3 py-1.5 rounded-md text-xs font-semibold bg-surface-overlay border border-border hover:bg-text hover:text-surface transition-colors disabled:opacity-50 cursor-pointer"
      >
        처리됨
      </button>
      <button
        type="button"
        onClick={() => update("dismissed")}
        disabled={busy}
        className="px-3 py-1.5 rounded-md text-xs font-semibold border border-border text-text-muted hover:text-text hover:bg-surface-overlay transition-colors disabled:opacity-50 cursor-pointer"
      >
        기각
      </button>
    </div>
  );
}
