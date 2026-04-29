"use client";

import { useState, useRef, useCallback, useTransition } from "react";
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

// ── ChampionPicker ─────────────────────────────────────────────
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
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="챔피언 검색..."
        className="h-9 px-3 rounded-lg border border-border bg-surface-overlay text-sm focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
      />
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
                <Image src={iconUrl} alt={c.name} fill sizes="40px" className="object-cover" />
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

  // AI autofill state
  const [aiPending, startAiTransition] = useTransition();
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());

  const handleFile = useCallback(async (f: File) => {
    setError(null);
    setAiFilledFields(new Set());

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

  // ── AI 자동 완성 ──────────────────────────────────────────────
  const handleAiAutofill = () => {
    if (!parsed || !characterSlug) return;
    setAiError(null);

    startAiTransition(async () => {
      const res = await fetch("/api/ai/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character: characterSlug,
          inputs: parsed.inputs,
          durationMs: parsed.manifest.duration_ms,
          patch: parsed.manifest.patch_version,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAiError(data.error ?? "AI 자동 완성에 실패했습니다");
        return;
      }

      const data = await res.json() as {
        title: string;
        description: string;
        difficulty: Difficulty;
        tags: string[];
        required_level: number | null;
      };

      const filled = new Set<string>();

      if (data.title) { setTitle(data.title); filled.add("title"); }
      if (data.description) { setDescription(data.description); filled.add("description"); }
      if (data.difficulty) { setDifficulty(data.difficulty); filled.add("difficulty"); }
      if (data.tags?.length) { setTags(data.tags.join(", ")); filled.add("tags"); }

      // LoL game specific — items/summoner_spells from inputs, required_level from AI
      if (parsed.manifest.game === "lol") {
        const requiredItems = [...new Set(
          parsed.inputs
            .filter((i) => i.category === "item" && i.ref)
            .map((i) => i.ref as string)
        )];
        const summonerSpells = [...new Set(
          parsed.inputs
            .filter((i) => i.category === "summoner_spell" && i.ref)
            .map((i) => i.ref as string)
        )];

        setGameSpecific((prev) => ({
          ...prev,
          ...(requiredItems.length && { required_items: requiredItems }),
          ...(summonerSpells.length && { summoner_spells: summonerSpells }),
          ...(data.required_level && { required_level: data.required_level }),
        }));

        if (requiredItems.length || summonerSpells.length || data.required_level) {
          filled.add("lol_conditions");
        }
      }

      setAiFilledFields(filled);
    });
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
      let thumbnailUrl: string | undefined;
      if (thumbnailFile) {
        const t = await uploadFile("thumbnails", thumbnailFile, thumbnailFile.type || "image/jpeg");
        thumbnailUrl = t.publicUrl;
      }

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
        if (!comboRes.ok) throw new Error((await comboRes.json()).error ?? "콤보 등록 실패");
        const { id } = await comboRes.json();
        setStep("done");
        setTimeout(() => router.push(`/combos/${id}`), 800);
        return;
      }

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
      if (!comboRes.ok) throw new Error((await comboRes.json()).error ?? "콤보 등록 실패");
      const { id } = await comboRes.json();
      setStep("done");
      setTimeout(() => router.push(`/combos/${id}`), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Step: drop ────────────────────────────────────────────────
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
            isDragging ? "border-gold bg-gold/5" : "border-border hover:border-[rgba(255,255,255,0.24)] bg-surface-raised"
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

  // ── Step: done ────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <div className="w-16 h-16 rounded-full bg-easy/20 flex items-center justify-center text-2xl text-easy">✓</div>
        <p className="font-bold text-lg">게시 완료! 콤보 페이지로 이동 중...</p>
      </div>
    );
  }

  // ── Step: form ────────────────────────────────────────────────
  const keys = parsed ? inputToKeySequence(parsed.inputs.map(({ category, ref, slot }) => ({ category, ref, slot }))) : [];
  const isAiFilled = aiFilledFields.size > 0;

  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight mb-1">콤보 정보 입력</h1>
          <p className="text-text-secondary text-sm">{file?.name}</p>
        </div>
        <button type="button"
          onClick={() => { setStep("drop"); setFile(null); setParsed(null); setError(null); setVideoFile(null); setIsJsonMode(false); setAiFilledFields(new Set()); }}
          className="text-sm text-text-secondary hover:text-text transition-colors">
          ← 다시 선택
        </button>
      </div>

      {/* 입력 시퀀스 미리보기 */}
      {keys.length > 0 && (
        <div className="bg-surface-raised rounded-xl p-5 border border-border">
          <p className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-3">파싱된 입력 시퀀스</p>
          <KeySequence keys={keys} size="sm" maxKeys={12} />
          {parsed && (
            <p className="text-[11px] text-text-muted mt-2">
              총 {parsed.inputs.length}개 입력{parsed.manifest.duration_ms ? ` · ${(parsed.manifest.duration_ms / 1000).toFixed(1)}초` : ""}
            </p>
          )}
        </div>
      )}

      {/* AI 자동 완성 배너 */}
      <div className={`rounded-xl border p-4 flex items-center justify-between gap-4 transition-colors ${
        isAiFilled ? "border-gold/40 bg-gold/5" : "border-border bg-surface-raised"
      }`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isAiFilled ? "bg-gold/20" : "bg-surface-overlay"}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className={isAiFilled ? "text-gold" : "text-text-muted"}>
              <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zm7 10l.75 2.25L22 16l-2.25.75L19 19l-.75-2.25L16 16l2.25-.75L19 13zM5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5L5 17z" fill="currentColor"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold">
              {isAiFilled ? "AI 자동 완성됨" : "AI 자동 완성"}
            </p>
            <p className="text-xs text-text-muted truncate">
              {isAiFilled
                ? `제목, 설명, 난이도, 태그${aiFilledFields.has("lol_conditions") ? ", LoL 조건" : ""} 자동 입력 — 수정 후 게시하세요`
                : "입력 시퀀스를 분석해 제목·설명·난이도·태그·조건을 한 번에 채워줍니다"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleAiAutofill}
          disabled={aiPending || !characterSlug}
          className={`shrink-0 h-9 px-4 rounded-lg text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap ${
            isAiFilled
              ? "border border-gold/40 text-gold hover:bg-gold/10"
              : "bg-gold text-white hover:bg-gold-light"
          }`}
        >
          {aiPending ? (
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="animate-spin">
                <path d="M12 3v3m0 12v3M3 12h3m12 0h3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              분석 중...
            </span>
          ) : isAiFilled ? "다시 생성" : "자동 완성"}
        </button>
      </div>
      {aiError && <p className="text-xs text-hard -mt-3">{aiError}</p>}
      {!characterSlug && (
        <p className="text-xs text-text-muted -mt-3">챔피언을 먼저 선택하면 AI 자동 완성을 사용할 수 있습니다</p>
      )}

      {/* 기본 정보 */}
      <div className="flex flex-col gap-5 bg-surface-raised rounded-xl p-6 border border-border">
        <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">기본 정보</p>

        {/* 제목 */}
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-sm font-semibold">
            제목 <span className="text-hard">*</span>
            {aiFilledFields.has("title") && <AiBadge />}
          </span>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="콤보 제목을 입력하세요"
            className={fieldClass(aiFilledFields.has("title"))}
          />
        </label>

        {/* 설명 */}
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-sm font-semibold">
            설명
            {aiFilledFields.has("description") && <AiBadge />}
          </span>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="콤보에 대한 추가 설명 (선택)"
            className={`px-3 py-2 rounded-lg border bg-surface-overlay text-sm resize-none focus:outline-none transition-colors ${
              aiFilledFields.has("description")
                ? "border-gold/40 focus:border-gold/60"
                : "border-border focus:border-[rgba(255,255,255,0.3)]"
            }`}
          />
        </label>

        {/* 챔피언 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">챔피언 <span className="text-hard">*</span></span>
          <ChampionPicker characters={characters} patch={patch} value={characterSlug} onChange={setCharacterSlug} />
        </div>

        {/* 난이도 */}
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-sm font-semibold">
            난이도
            {aiFilledFields.has("difficulty") && <AiBadge />}
          </span>
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
          <span className="flex items-center gap-2 text-sm font-semibold">
            태그
            {aiFilledFields.has("tags") && <AiBadge />}
          </span>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="풀콤보, 라인전, 6레벨 (쉼표로 구분)"
            className={fieldClass(aiFilledFields.has("tags"))}
          />
        </label>

        {/* 동영상 (JSON 모드) */}
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
              <input type="file" accept="video/mp4,video/*" className="hidden" onChange={(e) => e.target.files?.[0] && setVideoFile(e.target.files[0])} />
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
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && handleThumbnailChange(e.target.files[0])} />
          </label>
        </div>
      </div>

      {/* LoL 조건 */}
      {parsed?.manifest.game === "lol" && (
        <div className={`rounded-xl border overflow-hidden transition-colors ${
          aiFilledFields.has("lol_conditions") ? "border-gold/40" : "border-border"
        }`}>
          {aiFilledFields.has("lol_conditions") && (
            <div className="flex items-center gap-2 px-5 py-2.5 bg-gold/5 border-b border-gold/20">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-gold">
                <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
              </svg>
              <span className="text-xs text-gold font-semibold">AI가 입력 시퀀스에서 조건을 자동 추출했습니다</span>
            </div>
          )}
          <div className="bg-surface-raised">
            <LolUploadForm value={gameSpecific} onChange={setGameSpecific} items={items} patch={patch} />
          </div>
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

// ── Helpers ───────────────────────────────────────────────────
function AiBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gold/15 text-gold text-[10px] font-bold">
      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
      </svg>
      AI
    </span>
  );
}

function fieldClass(aiHighlight: boolean) {
  return `h-10 px-3 rounded-lg border bg-surface-overlay text-sm focus:outline-none transition-colors ${
    aiHighlight
      ? "border-gold/40 focus:border-gold/60"
      : "border-border focus:border-[rgba(255,255,255,0.3)]"
  }`;
}
