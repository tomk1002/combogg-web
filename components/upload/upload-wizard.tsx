"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { parseTutfile, type ParsedTutfile } from "@/lib/tutfile";
import { KeySequence, inputToKeySequence } from "@/components/shared/keycap";
import DifficultyPips from "@/components/shared/difficulty-pips";
import LolUploadForm from "@/components/games/lol/lol-upload-form";
import type { LolGameSpecific } from "@/lib/games/lol/schema";
import type { Difficulty } from "@/types";

interface Character {
  id: string;
  slug: string;
  name: string;
  iconUrl: string | null;
}

interface Props {
  characters: Character[];
}

type Step = "drop" | "form" | "submitting" | "done";

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "easy",   label: "쉬움" },
  { value: "medium", label: "보통" },
  { value: "hard",   label: "어려움" },
];

export default function UploadWizard({ characters }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("drop");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedTutfile | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [characterSlug, setCharacterSlug] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [tags, setTags] = useState("");
  const [gameSpecific, setGameSpecific] = useState<Partial<LolGameSpecific>>({});
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFile = useCallback(async (f: File) => {
    if (!f.name.endsWith(".tutfile")) {
      setError(".tutfile 파일만 업로드할 수 있습니다");
      return;
    }
    setError(null);
    try {
      const buffer = await f.arrayBuffer();
      const data = await parseTutfile(buffer);
      setFile(f);
      setParsed(data);
      // 폼 초기값 세팅
      setTitle(data.manifest.title);
      setCharacterSlug(data.manifest.character);
      setDifficulty(data.manifest.difficulty);
      setTags(data.manifest.tags.join(", "));
      setGameSpecific((data.manifest.game_specific as Partial<LolGameSpecific>) ?? {});
      setStep("form");
    } catch (e) {
      setError(e instanceof Error ? e.message : "파일을 파싱할 수 없습니다");
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const handleThumbnailChange = (f: File) => {
    setThumbnailFile(f);
    setThumbnailPreview(URL.createObjectURL(f));
  };

  const onSubmit = async () => {
    if (!file || !parsed) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. 썸네일 업로드 (선택)
      let thumbnailUrl: string | undefined;
      if (thumbnailFile) {
        const tPresignedRes = await fetch("/api/uploads/presigned-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bucket: "thumbnails", filename: thumbnailFile.name }),
        });
        if (!tPresignedRes.ok) throw new Error("썸네일 URL 발급 실패");
        const { uploadUrl: tUrl, path: tPath } = await tPresignedRes.json();
        const tUploadRes = await fetch(tUrl, {
          method: "PUT",
          body: thumbnailFile,
          headers: { "Content-Type": thumbnailFile.type || "image/jpeg" },
        });
        if (!tUploadRes.ok) throw new Error("썸네일 업로드 실패");
        thumbnailUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${tPath}`;
      }

      // 2. Presigned URL 발급
      const presignedRes = await fetch("/api/uploads/presigned-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket: "tutfiles", filename: file.name }),
      });
      if (!presignedRes.ok) throw new Error("업로드 URL 발급 실패");
      const { uploadUrl, path } = await presignedRes.json();

      // 3. Supabase Storage에 tutfile 직접 업로드
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": "application/octet-stream" },
      });
      if (!uploadRes.ok) throw new Error("파일 업로드 실패");

      // 4. 콤보 생성 (서버에서 tutfile 파싱 + video 분리 처리)
      const comboRes = await fetch("/api/combos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutfilePath: path,
          title: title.trim(),
          description: description.trim() || undefined,
          characterSlug,
          difficulty,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          gameSpecific,
          thumbnailUrl,
        }),
      });
      if (!comboRes.ok) {
        const err = await comboRes.json();
        throw new Error(err.error ?? "콤보 등록 실패");
      }
      const { id } = await comboRes.json();
      setStep("done");
      setTimeout(() => router.push(`/combos/${id}`), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step: drop ───────────────────────────────────────────────
  if (step === "drop") {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight mb-1">콤보 업로드</h1>
          <p className="text-text-secondary text-sm">데스크톱 앱에서 녹화한 .tutfile을 업로드하세요</p>
        </div>

        <button
          type="button"
          className={`w-full border-2 border-dashed rounded-2xl p-16 flex flex-col items-center gap-4 transition-colors cursor-pointer ${
            isDragging
              ? "border-gold bg-gold/5"
              : "border-border hover:border-[rgba(255,255,255,0.24)] bg-surface-raised"
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
        >
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className={isDragging ? "text-gold" : "text-text-muted"}>
            <path d="M12 16V4m0 0L8 8m4-4 4 4M4 20h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="text-center">
            <p className="font-bold mb-1">{isDragging ? "여기에 놓으세요" : ".tutfile 드래그 또는 클릭"}</p>
            <p className="text-sm text-text-secondary">데스크톱 앱에서 내보낸 .tutfile 파일만 지원</p>
          </div>
          <input ref={fileRef} type="file" accept=".tutfile" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </button>

        {error && <p className="text-sm text-hard text-center">{error}</p>}
      </div>
    );
  }

  // ── Step: done ───────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <div className="w-16 h-16 rounded-full bg-easy/20 flex items-center justify-center text-2xl text-easy">✓</div>
        <p className="font-bold text-lg">게시 완료! 콤보 페이지로 이동 중...</p>
      </div>
    );
  }

  // ── Step: form ───────────────────────────────────────────────
  const keys = parsed ? inputToKeySequence(parsed.inputs.map(({ category, ref, slot }) => ({ category, ref, slot }))) : [];

  return (
    <form className="flex flex-col gap-8" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight mb-1">콤보 정보 입력</h1>
          <p className="text-text-secondary text-sm">{file?.name}</p>
        </div>
        <button type="button" onClick={() => { setStep("drop"); setFile(null); setParsed(null); setError(null); }}
          className="text-sm text-text-secondary hover:text-text transition-colors">
          ← 다시 선택
        </button>
      </div>

      {/* 파싱된 미리보기 */}
      {keys.length > 0 && (
        <div className="bg-surface-raised rounded-xl p-5 border border-border">
          <p className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-3">파싱된 입력 시퀀스</p>
          <KeySequence keys={keys} size="sm" maxKeys={12} />
          {parsed && (
            <p className="text-[11px] text-text-muted mt-2">
              총 {parsed.inputs.length}개 입력 · {parsed.manifest.duration_ms ? `${(parsed.manifest.duration_ms / 1000).toFixed(1)}초` : ""}
            </p>
          )}
        </div>
      )}

      {/* 기본 정보 */}
      <div className="flex flex-col gap-5 bg-surface-raised rounded-xl p-6 border border-border">
        <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">기본 정보</p>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">제목 <span className="text-hard">*</span></span>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="콤보 제목을 입력하세요"
            className="h-10 px-3 rounded-lg border border-border bg-surface-overlay text-sm focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">설명</span>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="콤보에 대한 추가 설명 (선택)"
            className="px-3 py-2 rounded-lg border border-border bg-surface-overlay text-sm resize-none focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
          />
        </label>

        {/* 챔피언 */}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">챔피언 <span className="text-hard">*</span></span>
          <div className="flex items-center gap-2">
            {characterSlug && (() => {
              const champ = characters.find((c) => c.slug === characterSlug);
              return champ?.iconUrl ? (
                <Image src={champ.iconUrl} alt={champ.name} width={28} height={28} className="rounded-md shrink-0" />
              ) : null;
            })()}
            <select
              required
              value={characterSlug}
              onChange={(e) => setCharacterSlug(e.target.value)}
              className="flex-1 h-10 px-3 rounded-lg border border-border bg-surface-overlay text-sm focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
            >
              <option value="">선택</option>
              {characters.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
        </label>

        {/* 난이도 */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">난이도</span>
          <div className="flex gap-2">
            {DIFFICULTY_OPTIONS.map(({ value: v, label }) => (
              <button
                key={v}
                type="button"
                onClick={() => setDifficulty(v)}
                className={`flex-1 h-9 rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${
                  difficulty === v
                    ? "bg-surface-overlay border-[rgba(255,255,255,0.24)] text-text"
                    : "border-border text-text-secondary hover:text-text"
                }`}
              >
                <DifficultyPips difficulty={v} className="justify-center" />
              </button>
            ))}
          </div>
        </div>

        {/* 태그 */}
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">태그</span>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="풀콤보, 라인전, 6레벨 (쉼표로 구분)"
            className="h-10 px-3 rounded-lg border border-border bg-surface-overlay text-sm focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
          />
        </label>

        {/* 썸네일 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">썸네일 <span className="text-text-muted font-normal">(선택)</span></span>
          <label className="cursor-pointer">
            {thumbnailPreview ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-surface-overlay">
                <Image src={thumbnailPreview} alt="썸네일 미리보기" fill className="object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-xs font-semibold text-white">클릭해서 변경</span>
                </div>
              </div>
            ) : (
              <div className="w-full h-24 rounded-lg border border-dashed border-border bg-surface-overlay flex items-center justify-center text-sm text-text-muted hover:border-[rgba(255,255,255,0.24)] hover:text-text transition-colors">
                + 이미지 선택 (jpg, png, webp)
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleThumbnailChange(e.target.files[0])}
            />
          </label>
        </div>
      </div>

      {/* LoL 조건 */}
      {parsed?.manifest.game === "lol" && (
        <div className="bg-surface-raised rounded-xl p-6 border border-border">
          <LolUploadForm value={gameSpecific} onChange={setGameSpecific} />
        </div>
      )}

      {error && <p className="text-sm text-hard">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-12 rounded-xl bg-gold text-white font-bold text-sm shadow-[0_2px_8px_rgba(184,134,11,0.32)] hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {isSubmitting ? "업로드 중..." : "콤보 게시하기"}
      </button>
    </form>
  );
}
