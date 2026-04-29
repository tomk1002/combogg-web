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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

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

  const startEdit = (comment: CommentDTO) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleEdit = async (commentId: string) => {
    const text = editContent.trim();
    if (!text) return;
    try {
      const res = await fetch(`/api/combos/${comboId}/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) throw new Error();
      const { content: newContent } = await res.json();
      setComments((prev) => prev.map((c) => c.id === commentId ? { ...c, content: newContent } : c));
      cancelEdit();
    } catch {
      setError("댓글 수정에 실패했습니다.");
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
                {editingId === c.id ? (
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleEdit(c.id); if (e.key === "Escape") cancelEdit(); }}
                      autoFocus
                      className="flex-1 h-8 px-2 rounded-md border border-border bg-surface-overlay text-sm focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
                    />
                    <button type="button" onClick={() => handleEdit(c.id)} className="text-[10px] text-gold hover:text-gold-light font-semibold transition-colors cursor-pointer">저장</button>
                    <button type="button" onClick={cancelEdit} className="text-[10px] text-text-muted hover:text-text transition-colors cursor-pointer">취소</button>
                  </div>
                ) : (
                  <p className="text-sm text-text-secondary break-words">{c.content}</p>
                )}
              </div>
              {currentUserId === c.author.id && editingId !== c.id && (
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(c)}
                    className="text-[10px] text-text-muted hover:text-text transition-colors cursor-pointer"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="text-[10px] text-text-muted hover:text-hard transition-colors cursor-pointer"
                  >
                    삭제
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
