"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { parseTutfile, parseAppComboJson, buildInputSummary, type ParsedTutfile } from "@/lib/tutfile";
import { KeySequence, inputToKeySequence } from "@/components/shared/keycap";
import DifficultyPips from "@/components/shared/difficulty-pips";
import LolUploadForm from "@/components/games/lol/lol-upload-form";
import type { LolGameSpecific } from "@/lib/games/lol/schema";
import type { Difficulty } from "@/types";
import { getChampIconUrl } from "@/lib/games/lol/ddragon";

interface Character {
  id: string;
  slug: string;
  name: string;
  iconUrl: string | null;
}

interface ItemMeta {
  id: string;
  name: string;
  iconUrl: string;
}

interface Props {
  characters: Character[];
  patch: string;
  items: ItemMeta[];
}

type Step = "drop" | "form" | "submitting" | "done";

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "easy",   label: "쉬움" },
  { value: "medium", label: "보통" },
  { value: "hard",   label: "어려움" },
];

// ── ChampionPicker (inline component) ────────────────────────
interface ChampionPickerProps {
  characters: Character[];
  patch: string;
  value: string;
  onChange: (slug: string) => void;
}

function ChampionPicker({ characters, patch, value, onChange }: ChampionPickerProps) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? characters.filter((c) =>
        c.name.toLowerCase().includes(search.trim().toLowerCase()) ||
        c.slug.toLowerCase().includes(search.trim().toLowerCase())
      )
    : characters;

  const selected = characters.find((c) => c.slug === value);

  return (
    <div className="flex flex-col gap-2">
      {/* Selected display */}
      {selected && (
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Image
            src={selected.iconUrl ?? getChampIconUrl(selected.slug, patch)}
            alt={selected.name}
            width={24}
            height={24}
            sizes="24px"
            className="rounded-md shrink-0"
          />
          <span>{selected.name}</span>
        </div>
      )}

      {/* Search input */}
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="챔피언 검색..."
        className="h-9 px-3 rounded-lg border border-border bg-surface-overlay text-sm focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
      />

      {/* Scrollable icon grid */}
      <div className="max-h-48 overflow-y-auto rounded-lg border border-border bg-surface-overlay p-2">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(44px,1fr))] gap-1.5">
          {filtered.map((c) => {
            const isSelected = c.slug === value;
            const iconUrl = c.iconUrl ?? getChampIconUrl(c.slug, patch);
            return (
              <button
                key={c.slug}
                type="button"
                title={c.name}
                onClick={() => onChange(c.slug)}
                className={`relative w-10 h-10 rounded-md overflow-hidden transition-all cursor-pointer ${
                  isSelected
                    ? "ring-2 ring-gold ring-offset-1 ring-offset-surface-overlay"
                    : "hover:ring-1 hover:ring-[rgba(255,255,255,0.3)]"
                }`}
              >
                <Image
                  src={iconUrl}
                  alt={c.name}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full text-xs text-text-muted py-2 text-center">검색 결과 없음</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── UploadWizard ──────────────────────────────────────────────
export default function UploadWizard({ characters, patch, items }: Props) {
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
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFile = useCallback(async (f: File) => {
    setError(null);

    if (f.name.endsWith(".tutfile")) {
      try {
        const buffer = await f.arrayBuffer();
        const data = await parseTutfile(buffer);
        setFile(f);
        setParsed(data);
        setTitle(data.manifest.title);
        setCharacterSlug(data.manifest.character);
        setDifficulty(data.manifest.difficulty);
        setTags(data.manifest.tags.join(", "));
        setGameSpecific((data.manifest.game_specific as Partial<LolGameSpecific>) ?? {});
        setIsJsonMode(false);
        setStep("form");
      } catch (e) {
        setError(e instanceof Error ? e.message : "파일을 파싱할 수 없습니다");
      }
      return;
    }

    if (f.name.endsWith(".json")) {
      try {
        const text = await f.text();
        const rawJson = JSON.parse(text);
        const parsedJson = parseAppComboJson(rawJson);
        const syntheticParsed: ParsedTutfile = {
          manifest: {
            version: "1",
            id: "",
            title: parsedJson.title,
            game: parsedJson.game,
            character: parsedJson.characterSlug,
            difficulty: "medium",
            tags: parsedJson.tags,
            duration_ms: parsedJson.duration_ms,
            game_specific: {},
          },
          inputs: parsedJson.inputs,
          steps: [],
          videoBuffer: null,
        };
        setFile(f);
        setParsed(syntheticParsed);
        setTitle(parsedJson.title);
        setCharacterSlug(parsedJson.characterSlug);
        setTags(parsedJson.tags.join(", "));
        setGameSpecific({});
        setIsJsonMode(true);
        setStep("form");
      } catch (e) {
        setError(e instanceof Error ? e.message : "JSON 파일을 파싱할 수 없습니다");
      }
      return;
    }

    setError(".tutfile 또는 .json 파일만 업로드할 수 있습니다");
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

  const uploadFile = async (bucket: string, f: File, contentType: string): Promise<{ path: string; publicUrl: string }> => {
    const presignedRes = await fetch("/api/uploads/presigned-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bucket, filename: f.name }),
    });
    if (!presignedRes.ok) throw new Error(`${bucket} URL 발급 실패`);
    const { uploadUrl, path } = await presignedRes.json();
    const uploadRes = await fetch(uploadUrl, { method: "PUT", body: f, headers: { "Content-Type": contentType } });
    if (!uploadRes.ok) throw new Error(`${bucket} 업로드 실패`);
    return { path, publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${path}` };
  };

  const onSubmit = async () => {
    if (!file || !parsed) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. 썸네일 업로드 (선택)
      let thumbnailUrl: string | undefined;
      if (thumbnailFile) {
        const t = await uploadFile("thumbnails", thumbnailFile, thumbnailFile.type || "image/jpeg");
        thumbnailUrl = t.publicUrl;
      }

      // ── JSON + MP4 모드 ──────────────────────────────────────
      if (isJsonMode) {
        let videoUrl: string | undefined;
        if (videoFile) {
          const v = await uploadFile("videos", videoFile, "video/mp4");
          videoUrl = v.publicUrl;
        }

        const { path: jsonPath } = await uploadFile("tutfiles", file, "application/json");

        const comboRes = await fetch("/api/combos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title:        title.trim(),
            description:  description.trim() || undefined,
            gameSlug:     parsed.manifest.game,
            characterSlug,
            difficulty,
            tags:         tags.split(",").map((t) => t.trim()).filter(Boolean),
            durationMs:   parsed.manifest.duration_ms,
            inputSummary: buildInputSummary(parsed.inputs),
            gameSpecific,
            thumbnailUrl,
            videoUrl,
            tutfileUrl:   jsonPath,
          }),
        });
        if (!comboRes.ok) {
          const err = await comboRes.json();
          throw new Error(err.error ?? "콤보 등록 실패");
        }
        const { id } = await comboRes.json();
        setStep("done");
        setTimeout(() => router.push(`/combos/${id}`), 800);
        return;
      }

      // ── .tutfile 모드 (서버 파싱) ─────────────────────────────
      const { path } = await uploadFile("tutfiles", file, "application/octet-stream");

      const comboRes = await fetch("/api/combos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutfilePath:  path,
          title:        title.trim(),
          description:  description.trim() || undefined,
          characterSlug,
          difficulty,
          tags:         tags.split(",").map((t) => t.trim()).filter(Boolean),
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
          <p className="text-text-secondary text-sm">데스크톱 앱에서 녹화한 .tutfile 또는 .json 파일을 업로드하세요</p>
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
            <p className="font-bold mb-1">{isDragging ? "여기에 놓으세요" : "파일 드래그 또는 클릭"}</p>
            <p className="text-sm text-text-secondary">.tutfile · .json 지원</p>
          </div>
          <input ref={fileRef} type="file" accept=".tutfile,.json" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
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
        <button type="button" onClick={() => { setStep("drop"); setFile(null); setParsed(null); setError(null); setVideoFile(null); setIsJsonMode(false); }}
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

        {/* 챔피언 — picker */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">
            챔피언 <span className="text-hard">*</span>
          </span>
          <ChampionPicker
            characters={characters}
            patch={patch}
            value={characterSlug}
            onChange={setCharacterSlug}
          />
        </div>

        {/* 난이도 */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">난이도</span>
          <div className="flex gap-2">
            {DIFFICULTY_OPTIONS.map(({ value: v }) => (
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

        {/* 동영상 (JSON 모드에서만 표시) */}
        {isJsonMode && (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold">동영상 <span className="text-text-muted font-normal">(선택)</span></span>
            <label className="cursor-pointer">
              {videoFile ? (
                <div className="w-full h-12 rounded-lg border border-border bg-surface-overlay flex items-center justify-between px-3 hover:border-[rgba(255,255,255,0.24)] transition-colors">
                  <span className="text-sm text-text truncate">{videoFile.name}</span>
                  <span className="text-xs text-text-muted shrink-0">클릭해서 변경</span>
                </div>
              ) : (
                <div className="w-full h-12 rounded-lg border border-dashed border-border bg-surface-overlay flex items-center justify-center text-sm text-text-muted hover:border-[rgba(255,255,255,0.24)] hover:text-text transition-colors">
                  + mp4 동영상 선택
                </div>
              )}
              <input
                type="file"
                accept="video/mp4,video/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && setVideoFile(e.target.files[0])}
              />
            </label>
          </div>
        )}

        {/* 썸네일 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">썸네일 <span className="text-text-muted font-normal">(선택)</span></span>
          <label className="cursor-pointer">
            {thumbnailPreview ? (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-surface-overlay">
                <Image src={thumbnailPreview} alt="썸네일 미리보기" fill sizes="(max-width: 672px) 100vw, 672px" className="object-cover" />
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
        <div className="bg-surface-raised rounded-xl border border-border overflow-hidden">
          <LolUploadForm value={gameSpecific} onChange={setGameSpecific} items={items} patch={patch} />
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
