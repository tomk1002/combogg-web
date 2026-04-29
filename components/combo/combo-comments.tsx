"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/utils";
import type { CommentDTO } from "@/lib/api/types";

interface Props {
  comboId: string;
  initialComments: CommentDTO[];
  currentUserId: string | null;
}

export default function ComboComments({ comboId, initialComments, currentUserId }: Props) {
  const router = useRouter();
  const [comments, setComments] = useState<CommentDTO[]>(initialComments);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) { router.push("/login"); return; }
    const text = content.trim();
    if (!text) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/combos/${comboId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) throw new Error();
      const comment: CommentDTO = await res.json();
      setComments((prev) => [comment, ...prev]);
      setContent("");
    } catch {
      setError("댓글 등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      await fetch(`/api/combos/${comboId}/comments/${commentId}`, { method: "DELETE" });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      // silently fail
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-bold">댓글 {comments.length > 0 ? `(${comments.length})` : ""}</h2>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={currentUserId ? "댓글을 입력하세요..." : "로그인 후 댓글을 달 수 있습니다"}
          disabled={isSubmitting}
          className="flex-1 h-10 px-3 rounded-lg border border-border bg-surface-raised text-sm focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="h-10 px-4 rounded-lg bg-surface-overlay border border-border text-sm font-semibold hover:bg-surface-raised disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          등록
        </button>
      </form>

      {error && <p className="text-xs text-hard">{error}</p>}

      {comments.length === 0 ? (
        <p className="text-sm text-text-muted py-4 text-center">첫 댓글을 남겨보세요</p>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {comments.map((c) => (
            <div key={c.id} className="py-3 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center text-[11px] font-bold text-gold shrink-0">
                {c.author.nickname[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className="text-xs font-semibold">{c.author.nickname}</span>
                  <span className="text-[10px] text-text-muted">{timeAgo(new Date(c.createdAt))}</span>
                </div>
                <p className="text-sm text-text-secondary break-words">{c.content}</p>
              </div>
              {currentUserId === c.author.id && (
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  className="text-[10px] text-text-muted hover:text-hard transition-colors shrink-0 cursor-pointer"
                >
                  삭제
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
