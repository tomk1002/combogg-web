"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["draft", "published", "featured", "removed"] as const;
type Status = typeof STATUSES[number];

export default function ComboStatusSelect({
  comboId,
  initialStatus,
}: {
  comboId: string;
  initialStatus: Status;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  const handleChange = async (next: Status) => {
    if (next === status || saving) return;
    setSaving(true);
    const prev = status;
    setStatus(next);
    try {
      const res = await fetch(`/api/admin/combos/${comboId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      setStatus(prev);
      alert("상태 변경 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      value={status}
      onChange={(e) => handleChange(e.target.value as Status)}
      disabled={saving}
      className="h-7 px-2 rounded-md border border-border bg-surface-raised text-xs font-semibold disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
