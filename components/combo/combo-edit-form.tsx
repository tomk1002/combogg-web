"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DifficultyPips from "@/components/shared/difficulty-pips";
import LolUploadForm from "@/components/games/lol/lol-upload-form";
import type { Difficulty } from "@/types";
import type { LolGameSpecific } from "@/lib/games/lol/schema";

interface Combo {
  id: string;
  title: string;
  description: string | null;
  difficulty: string;
  tags: string[];
  gameSpecific: unknown;
  game: { slug: string };
}

interface ItemMeta {
  id: string;
  name: string;
  iconUrl: string;
}

interface Props {
  combo: Combo;
  items: ItemMeta[];
  patch: string;
}

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export default function ComboEditForm({ combo, items, patch }: Props) {
  const router = useRouter();

  const [title, setTitle] = useState(combo.title);
  const [description, setDescription] = useState(combo.description ?? "");
  const [difficulty, setDifficulty] = useState<Difficulty>(
    (combo.difficulty as Difficulty) ?? "medium"
  );
  const [tagsInput, setTagsInput] = useState(combo.tags.join(", "));
  const [gameSpecific, setGameSpecific] = useState<Partial<LolGameSpecific>>(
    (combo.gameSpecific as Partial<LolGameSpecific>) ?? {}
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/combos/${combo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          difficulty,
          tags,
          gameSpecific: combo.game.slug === "lol" ? gameSpecific : undefined,
        }),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setError(json.error ?? "저장에 실패했습니다.");
        setSaving(false);
        return;
      }

      router.push(`/combos/${combo.id}`);
    } catch {
      setError("저장 중 오류가 발생했습니다.");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Title */}
      <div className="bg-surface-raised rounded-xl p-5 border border-border flex flex-col gap-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary">기본 정보</h2>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">제목 <span className="text-hard">*</span></span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={100}
            className="h-10 px-3 rounded-lg border border-border bg-surface-overlay text-sm focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">설명</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="px-3 py-2 rounded-lg border border-border bg-surface-overlay text-sm focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors resize-none"
          />
        </label>

        {/* Difficulty */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">난이도</span>
          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                  difficulty === d
                    ? "border-[rgba(255,255,255,0.24)] bg-surface-overlay"
                    : "border-border text-text-secondary hover:border-[rgba(255,255,255,0.16)] hover:text-text"
                }`}
              >
                <DifficultyPips difficulty={d} />
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">태그</span>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="쉼표로 구분 (예: 풀콤보, 라인전)"
            className="h-10 px-3 rounded-lg border border-border bg-surface-overlay text-sm focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
          />
          <p className="text-[11px] text-text-muted">쉼표(,)로 태그를 구분하세요</p>
        </label>
      </div>

      {/* LoL-specific */}
      {combo.game.slug === "lol" && (
        <div className="bg-surface-raised rounded-xl border border-border overflow-hidden">
          <LolUploadForm
            value={gameSpecific}
            onChange={setGameSpecific}
            items={items}
            patch={patch}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-hard bg-hard/10 border border-hard/30 rounded-lg px-4 py-3">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-10 px-5 rounded-lg border border-border text-sm font-semibold text-text-secondary hover:bg-surface-overlay hover:text-text transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={saving}
          className="h-10 px-6 rounded-lg bg-gold text-white text-sm font-bold hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}
