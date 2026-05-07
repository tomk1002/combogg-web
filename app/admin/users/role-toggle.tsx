"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Role = "USER" | "ADMIN";

export default function UserRoleToggle({
  userId,
  initialRole,
}: {
  userId: string;
  initialRole: Role;
}) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(initialRole);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  const toggle = async () => {
    if (busy) return;
    const next: Role = role === "ADMIN" ? "USER" : "ADMIN";
    if (!confirm(`이 사용자의 권한을 ${next}로 변경할까요?`)) return;
    setBusy(true);
    const prev = role;
    setRole(next);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: next }),
      });
      if (!res.ok) throw new Error();
      startTransition(() => router.refresh());
    } catch {
      setRole(prev);
      alert("권한 변경 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={
        "px-2.5 py-1 rounded-md border text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer " +
        (role === "ADMIN"
          ? "border-gold/40 text-gold hover:bg-gold/10"
          : "border-border text-text-secondary hover:bg-surface-overlay")
      }
    >
      {role}
    </button>
  );
}
