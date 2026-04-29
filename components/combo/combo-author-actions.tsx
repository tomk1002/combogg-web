"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  comboId: string;
}

export default function ComboAuthorActions({ comboId }: Props) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/combos/${comboId}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/");
      } else {
        setDeleting(false);
        setConfirmDelete(false);
        alert("삭제에 실패했습니다.");
      }
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
      alert("삭제에 실패했습니다.");
    }
  };

  return (
    <div className="bg-surface-raised rounded-xl p-5 border border-border">
      <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-3">관리</h2>
      <div className="flex flex-col gap-2">
        <Link
          href={`/combos/${comboId}/edit`}
          className="w-full h-9 px-4 rounded-lg border border-border text-sm font-semibold text-text-secondary hover:bg-surface-overlay hover:text-text transition-colors flex items-center justify-center"
        >
          수정
        </Link>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className={`flex-1 h-9 px-4 rounded-lg border text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              confirmDelete
                ? "border-hard/50 bg-hard/10 text-hard hover:bg-hard/20"
                : "border-border text-text-secondary hover:bg-surface-overlay hover:text-text"
            }`}
          >
            {deleting ? "삭제 중..." : confirmDelete ? "정말 삭제?" : "삭제"}
          </button>

          {confirmDelete && !deleting && (
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="h-9 px-4 rounded-lg border border-border text-sm font-semibold text-text-secondary hover:bg-surface-overlay hover:text-text transition-colors"
            >
              취소
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
