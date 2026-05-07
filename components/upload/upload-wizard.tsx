"use client";

import { useState, useRef, useCallback, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { parseTutfile, parseAppComboJson, buildInputSummary, type ParsedTutfile, type ParsedInput } from "@/lib/tutfile";
import { KeySequence, inputToKeySequence } from "@/components/shared/keycap";
import DifficultyPips from "@/components/shared/difficulty-pips";
import LolUploadForm from "@/components/games/lol/lol-upload-form";
import InputKeyMapper from "@/components/upload/input-key-mapper";
import InputTimelineEditor from "@/components/upload/input-timeline-editor";
import VideoEditor from "@/components/combo/video-editor";
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

type Step = "drop" | "form" | "done";

// ── Draft helpers ─────────────────────────────────────────────
const DRAFT_KEY = "combogg_upload_draft";

interface DraftData {
  title: string;
  description: string;
  tip: string;
  difficulty: Difficulty;
  tagsInput: string;
  character: string;
  gameSpecific: Partial<LolGameSpecific>;
}

function saveDraft(data: DraftData) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    // localStorage unavailable (SSR, private mode, etc.)
  }
}

function loadDraft(): DraftData | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DraftData;
  } catch {
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: "easy",   label: "쉬움" },
  { value: "medium", label: "보통" },
  { value: "hard",   label: "어려움" },
];

// ── ChampionPicker ─────────────────────────────────────────────
function ChampionPicker({ characters, patch, value, onChange }: {
  characters: Character[];
  patch: string;
  value: string;
  onChange: (slug: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = search.trim()
    ? characters.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.slug.toLowerCase().includes(search.toLowerCase())
      )
    : characters;
  const selected = characters.find((c) => c.slug === value);

  return (
    <div className="flex flex-col gap-2">
      {selected && (
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Image src={selected.iconUrl ?? getChampIconUrl(selected.slug, patch)} alt={selected.name} width={24} height={24} sizes="24px" className="rounded-md shrink-0" />
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
            const iconUrl = c.iconUrl ?? getChampIconUrl(c.slug, patch);
            return (
              <button key={c.slug} type="button" title={c.name} onClick={() => onChange(c.slug)}
                className={`relative w-10 h-10 rounded-md overflow-hidden transition-all cursor-pointer ${
                  c.slug === value ? "ring-2 ring-gold ring-offset-1 ring-offset-surface-overlay" : "hover:ring-1 hover:ring-[rgba(255,255,255,0.3)]"
                }`}>
                <Image src={iconUrl} alt={c.name} fill sizes="40px" className="object-cover" />
              </button>
            );
          })}
          {filtered.length === 0 && <p className="col-span-full text-xs text-text-muted py-2 text-center">검색 결과 없음</p>}
        </div>
      </div>
    </div>
  );
}

// ── ThumbnailPicker ────────────────────────────────────────────
function ThumbnailPicker({ videoSrc, onCapture }: {
  videoSrc: string | null;
  onCapture: (file: File, preview: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [isManual, setIsManual] = useState(false);
  const [videoReady, setVideoReady] = useState(false);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setPreview(url);
      setIsManual(false);
      onCapture(new File([blob], "thumbnail.jpg", { type: "image/jpeg" }), url);
    }, "image/jpeg", 0.88);
  }, [onCapture]);

  // 비디오 소스 변경 시 초기화
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) { setVideoReady(false); setPreview(null); setDuration(0); return; }

    setVideoReady(false);
    setPreview(null);

    video.onloadedmetadata = () => {
      const mid = video.duration / 2;
      setDuration(video.duration);
      setCurrentTime(mid);
      video.currentTime = mid;
    };
    video.onseeked = () => {
      setVideoReady(true);
      captureFrame();
    };
    video.onerror = () => setVideoReady(false);
    video.src = videoSrc;
    video.load();
  }, [videoSrc, captureFrame]);

  const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    setCurrentTime(t);
    if (videoRef.current) videoRef.current.currentTime = t;
  };

  const handleSliderRelease = () => captureFrame();

  const handleManualFile = (f: File) => {
    const url = URL.createObjectURL(f);
    setPreview(url);
    setIsManual(true);
    onCapture(f, url);
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  // 영상 없음 → 수동 업로드만
  if (!videoSrc) {
    return (
      <label className="cursor-pointer block">
        {preview ? (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-surface-overlay">
            <Image src={preview} alt="썸네일" fill sizes="(max-width: 672px) 100vw, 672px" className="object-cover" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-xs font-semibold text-white">클릭해서 변경</span>
            </div>
          </div>
        ) : (
          <div className="w-full h-24 rounded-lg border border-dashed border-border bg-surface-overlay flex items-center justify-center text-sm text-text-muted hover:border-[rgba(255,255,255,0.24)] hover:text-text transition-colors">
            + 이미지 선택 (jpg, png, webp)
          </div>
        )}
        <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && handleManualFile(e.target.files[0])} />
      </label>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* 히든 video + canvas */}
      <video ref={videoRef} className="hidden" muted playsInline preload="auto" crossOrigin="anonymous" />
      <canvas ref={canvasRef} className="hidden" />

      {/* 프리뷰 */}
      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-surface-overlay">
        {preview ? (
          <>
            <Image src={preview} alt="썸네일" fill sizes="(max-width: 672px) 100vw, 672px" className="object-cover" />
            {isManual && (
              <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-xs font-semibold text-white">직접 선택</div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* 타임라인 슬라이더 */}
      {videoReady && duration > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-text-muted w-8 shrink-0">{fmt(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.05}
            value={currentTime}
            onChange={handleSlider}
            onMouseUp={handleSliderRelease}
            onTouchEnd={handleSliderRelease}
            className="flex-1 h-1.5 accent-gold cursor-pointer"
          />
          <span className="text-xs font-mono text-text-muted w-8 shrink-0 text-right">{fmt(duration)}</span>
        </div>
      )}

      {/* 수동 업로드 대체 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-text-muted">슬라이더로 원하는 장면 선택</span>
        <label className="ml-auto cursor-pointer text-xs text-text-secondary hover:text-text transition-colors font-semibold">
          직접 업로드
          <input ref={manualInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && handleManualFile(e.target.files[0])} />
        </label>
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
  const [tip, setTip] = useState("");
  const [editedInputs, setEditedInputs] = useState<ParsedInput[]>([]);
  const [characterSlug, setCharacterSlug] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [tags, setTags] = useState("");
  const [gameSpecific, setGameSpecific] = useState<Partial<LolGameSpecific>>({});
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isJsonMode, setIsJsonMode] = useState(false);
  const [showVideoEditor, setShowVideoEditor] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [champPickerOpen, setChampPickerOpen] = useState(false);

  // AI autofill
  const [aiPending, startAiTransition] = useTransition();
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());

  // Blob URL 정리
  useEffect(() => {
    return () => { if (videoSrc) URL.revokeObjectURL(videoSrc); };
  }, [videoSrc]);

  // 마운트 시 임시저장 복원
  useEffect(() => {
    const draft = loadDraft();
    if (!draft) return;
    if (draft.title)       setTitle(draft.title);
    if (draft.description) setDescription(draft.description);
    if (draft.tip)         setTip(draft.tip);
    if (draft.difficulty)  setDifficulty(draft.difficulty);
    if (draft.tagsInput)   setTags(draft.tagsInput);
    if (draft.character)   setCharacterSlug(draft.character);
    if (draft.gameSpecific && Object.keys(draft.gameSpecific).length > 0) {
      setGameSpecific(draft.gameSpecific);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 업로드 완료 시 임시저장 삭제
  useEffect(() => {
    if (step === "done") clearDraft();
  }, [step]);

  const resetForm = () => {
    setStep("drop"); setFile(null); setParsed(null); setError(null);
    setEditedInputs([]); setVideoFile(null); setIsJsonMode(false); setAiFilledFields(new Set());
    setThumbnailFile(null);
    if (videoSrc) { URL.revokeObjectURL(videoSrc); setVideoSrc(null); }
  };

  const handleFile = useCallback(async (f: File) => {
    setError(null);
    setAiFilledFields(new Set());

    if (f.name.endsWith(".tutfile")) {
      try {
        const buffer = await f.arrayBuffer();
        const data = await parseTutfile(buffer);
        setFile(f);
        setParsed(data);
        setEditedInputs(data.inputs);
        setTitle(data.manifest.title);
        setCharacterSlug(data.manifest.character);
        setDifficulty(data.manifest.difficulty);
        setTags(data.manifest.tags.join(", "));
        const parsedGs = (data.manifest.game_specific as Partial<LolGameSpecific>) ?? {};
        setGameSpecific(parsedGs);
        setIsJsonMode(false);
        saveDraft({ title: data.manifest.title, description, tip, difficulty: data.manifest.difficulty, tagsInput: data.manifest.tags.join(", "), character: data.manifest.character, gameSpecific: parsedGs });
        // 영상이 있으면 blob URL 생성
        if (data.videoBuffer) {
          const blob = new Blob([data.videoBuffer.buffer as ArrayBuffer], { type: "video/mp4" });
          setVideoSrc(URL.createObjectURL(blob));
        } else {
          setVideoSrc(null);
        }
        setStep("form");
      } catch (e) {
        setError(e instanceof Error ? e.message : "파일을 파싱할 수 없습니다");
      }
      return;
    }

    if (f.name.endsWith(".json")) {
      try {
        const text = await f.text();
        const parsedJson = parseAppComboJson(JSON.parse(text));
        const syntheticParsed: ParsedTutfile = {
          manifest: { version: "1", id: "", title: parsedJson.title, game: parsedJson.game, character: parsedJson.characterSlug, difficulty: "medium", tags: parsedJson.tags, duration_ms: parsedJson.duration_ms, game_specific: {} },
          inputs: parsedJson.inputs,
          steps: [],
          videoBuffer: null,
        };
        setFile(f);
        setParsed(syntheticParsed);
        setEditedInputs(parsedJson.inputs);
        setTitle(parsedJson.title);
        setCharacterSlug(parsedJson.characterSlug);
        setTags(parsedJson.tags.join(", "));
        setGameSpecific({});
        setIsJsonMode(true);
        setVideoSrc(null);
        setStep("form");
        saveDraft({ title: parsedJson.title, description, tip, difficulty, tagsInput: parsedJson.tags.join(", "), character: parsedJson.characterSlug, gameSpecific: {} });
      } catch (e) {
        setError(e instanceof Error ? e.message : "JSON 파일을 파싱할 수 없습니다");
      }
      return;
    }

    setError(".tutfile 또는 .json 파일만 업로드할 수 있습니다");
  }, []);

  const handleVideoSelect = (f: File) => {
    setVideoFile(f);
    if (videoSrc) URL.revokeObjectURL(videoSrc);
    setVideoSrc(URL.createObjectURL(f));
    setShowVideoEditor(true);
  };

  const handleVideoDone = (blob: Blob, ext: string) => {
    if (videoSrc) URL.revokeObjectURL(videoSrc);
    const processed = new File([blob], `video.${ext}`, { type: blob.type });
    setVideoFile(processed);
    setVideoSrc(URL.createObjectURL(processed));
    setShowVideoEditor(false);
  };

  // ── AI 자동 완성 ──────────────────────────────────────────────
  const handleAiAutofill = () => {
    if (!parsed || !characterSlug) return;
    setAiError(null);
    startAiTransition(async () => {
      const res = await fetch("/api/ai/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character: characterSlug, inputs: parsed.inputs, durationMs: parsed.manifest.duration_ms, patch: parsed.manifest.patch_version }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setAiError(d.error ?? "AI 자동 완성 실패"); return; }
      const data = await res.json() as {
        title: string; description: string; difficulty: Difficulty; tags: string[];
        required_level: number | null; ability_haste_min: number | null; attack_speed_min: number | null;
        detected_items: string[]; detected_spells: string[];
      };
      const filled = new Set<string>();
      if (data.title)       { setTitle(data.title);                   filled.add("title"); }
      if (data.description) { setDescription(data.description);       filled.add("description"); }
      if (data.difficulty)  { setDifficulty(data.difficulty);         filled.add("difficulty"); }
      if (data.tags?.length){ setTags(data.tags.join(", "));          filled.add("tags"); }
      if (parsed.manifest.game === "lol") {
        const reqItems  = data.detected_items?.length  ? data.detected_items  : [...new Set(parsed.inputs.filter((i) => i.category === "item" && i.ref).map((i) => i.ref as string))];
        const sumSpells = data.detected_spells?.length ? data.detected_spells : [...new Set(parsed.inputs.filter((i) => i.category === "summoner_spell" && i.ref).map((i) => i.ref as string))];
        const hasConditions = data.required_level || data.ability_haste_min || data.attack_speed_min || reqItems.length || sumSpells.length;
        if (hasConditions) {
          setGameSpecific((prev) => ({
            ...prev,
            ...(data.required_level    && { required_level:    data.required_level! }),
            ...(data.ability_haste_min && { ability_haste_min: data.ability_haste_min! }),
            ...(data.attack_speed_min  && { attack_speed_min:  data.attack_speed_min! }),
            ...(reqItems.length        && { required_items:    reqItems }),
            ...(sumSpells.length       && { summoner_spells:   sumSpells }),
          }));
          filled.add("lol_conditions");
        }
      }
      setAiFilledFields(filled);
    });
  };

  // ── 파일 업로드 헬퍼 ──────────────────────────────────────────
  const uploadFile = async (bucket: string, f: File, contentType: string) => {
    const r = await fetch("/api/uploads/presigned-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bucket, filename: f.name }) });
    if (!r.ok) throw new Error(`${bucket} URL 발급 실패`);
    const { uploadUrl, path } = await r.json();
    const up = await fetch(uploadUrl, { method: "PUT", body: f, headers: { "Content-Type": contentType } });
    if (!up.ok) throw new Error(`${bucket} 업로드 실패`);
    return { path, publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${path}` };
  };

  const onSubmit = async () => {
    if (!file || !parsed) return;
    setIsSubmitting(true); setError(null);
    try {
      let thumbnailUrl: string | undefined;
      if (thumbnailFile) {
        const t = await uploadFile("thumbnails", thumbnailFile, thumbnailFile.type || "image/jpeg");
        thumbnailUrl = t.publicUrl;
      }
      if (isJsonMode) {
        let videoUrl: string | undefined;
        if (videoFile) { const v = await uploadFile("videos", videoFile, "video/mp4"); videoUrl = v.publicUrl; }
        const { path: jsonPath } = await uploadFile("tutfiles", file, "application/json");
        const r = await fetch("/api/combos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: title.trim(), description: description.trim() || undefined, tip: tip.trim() || undefined, gameSlug: parsed.manifest.game, characterSlug, difficulty, tags: tags.split(",").map((t) => t.trim()).filter(Boolean), durationMs: parsed.manifest.duration_ms, inputSummary: buildInputSummary(editedInputs.length ? editedInputs : parsed.inputs), gameSpecific, thumbnailUrl, videoUrl, tutfileUrl: jsonPath }) });
        if (!r.ok) throw new Error((await r.json()).error ?? "콤보 등록 실패");
        const { id } = await r.json();
        setStep("done"); setTimeout(() => router.push(`/combos/${id}`), 800);
        return;
      }
      const { path } = await uploadFile("tutfiles", file, "application/octet-stream");
      let extraVideoUrl: string | undefined;
      if (videoFile) {
        const v = await uploadFile("videos", videoFile, videoFile.type || "video/mp4");
        extraVideoUrl = v.publicUrl;
      }
      // editedInputs 가 원본 inputs 와 다르면 서버에서 .tutfile 의 inputs 대신 사용
      const inputsChanged = editedInputs.length !== (parsed?.inputs.length ?? 0)
        || editedInputs.some((inp, i) => {
          const orig = parsed?.inputs[i];
          return !orig || inp.t !== orig.t || inp.category !== orig.category || inp.ref !== orig.ref || inp.slot !== orig.slot;
        });
      const r = await fetch("/api/combos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tutfilePath: path, title: title.trim(), description: description.trim() || undefined, tip: tip.trim() || undefined, characterSlug, difficulty, tags: tags.split(",").map((t) => t.trim()).filter(Boolean), gameSpecific, thumbnailUrl, ...(extraVideoUrl && { videoUrl: extraVideoUrl }), ...(inputsChanged && { editedInputs }) }) });
      if (!r.ok) throw new Error((await r.json()).error ?? "콤보 등록 실패");
      const { id } = await r.json();
      setStep("done"); setTimeout(() => router.push(`/combos/${id}`), 800);
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

        {/* Guide callout */}
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-gold/8 border border-gold/20">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-gold mt-0.5">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <div className="text-sm leading-relaxed">
            <span className="font-semibold text-text">.tutfile이 없다면?</span>
            <span className="text-text-secondary"> combo.gg 앱으로 게임에서 콤보를 녹화하면 자동으로 생성됩니다.</span>
            <Link href="/download" className="ml-1.5 text-gold font-semibold hover:underline whitespace-nowrap">
              앱 다운로드 →
            </Link>
          </div>
        </div>

        <button type="button"
          className={`w-full border-2 border-dashed rounded-2xl p-16 flex flex-col items-center gap-4 transition-colors cursor-pointer ${isDragging ? "border-gold bg-gold/5" : "border-border hover:border-[rgba(255,255,255,0.24)] bg-surface-raised"}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
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
  // editedInputs 는 파일 로드 시점에 parsed.inputs 로 초기화되므로 여기서는
  // 항상 신뢰할 수 있다. 삭제로 비어 있는 경우(빈 배열)도 그대로 반영해야
  // 사용자가 본 화면과 실제 제출 결과(editedInputs)가 일치한다.
  const displayInputs = editedInputs;
  const keys = inputToKeySequence(displayInputs.map(({ category, ref, slot }) => ({ category, ref, slot })), patch);
  const isAiFilled = aiFilledFields.size > 0;

  return (
    <form className="flex flex-col gap-6" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>

      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight mb-1">콤보 정보 입력</h1>
          <p className="text-text-secondary text-sm">{file?.name}</p>
        </div>
        <button type="button" onClick={resetForm} className="text-sm text-text-secondary hover:text-text transition-colors">
          ← 다시 선택
        </button>
      </div>

      {/* 입력 시퀀스 미리보기 + 키 매핑 편집 */}
      {parsed && (
        <div className="bg-surface-raised rounded-xl border border-border overflow-hidden">
          {keys.length > 0 && (
            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-3">파싱된 입력 시퀀스</p>
              <KeySequence keys={keys} size="sm" maxKeys={12} />
              <p className="text-xs text-text-muted mt-2">
                총 {displayInputs.length}개 입력{parsed.manifest.duration_ms ? ` · ${(parsed.manifest.duration_ms / 1000).toFixed(1)}초` : ""}
              </p>
            </div>
          )}
          {parsed.manifest.game === "lol" && keys.length > 0 && (
            <div className={keys.length > 0 ? "border-t border-border" : ""}>
              <div className="px-5 pt-4 pb-1">
                <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">슬롯 매핑</p>
                <p className="text-xs text-text-muted mt-0.5">아이템 슬롯·소환사 주문을 실제 스킬/아이템으로 지정하세요</p>
              </div>
              <InputKeyMapper
                inputs={displayInputs}
                items={items}
                patch={patch}
                onChange={(updated) =>
                  setEditedInputs((prev) =>
                    prev.map((inp, i) => ({ ...inp, ref: updated[i]?.ref ?? inp.ref }))
                  )
                }
              />
            </div>
          )}

          {/* 타임라인 편집 — 입력별 카테고리/타이밍/삭제·추가. 입력이 0개여도
              빈 트랙을 클릭해 새로 추가할 수 있도록 항상 노출. */}
          <div className={keys.length > 0 ? "border-t border-border" : ""}>
            <div className="px-5 pt-4 pb-1">
              <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">타임라인 편집</p>
              <p className="text-xs text-text-muted mt-0.5">개별 입력의 타이밍·카테고리를 조정하거나 삭제·추가할 수 있습니다</p>
            </div>
            <div className="px-5 pb-5 pt-3">
              <InputTimelineEditor
                inputs={displayInputs}
                durationMs={parsed.manifest.duration_ms ?? 0}
                onChange={(updated) => setEditedInputs(updated)}
                patch={patch}
              />
            </div>
          </div>
        </div>
      )}

      {/* AI 자동 완성 배너 */}
      <div className={`rounded-xl border p-4 flex items-center justify-between gap-4 transition-colors ${isAiFilled ? "border-gold/40 bg-gold/5" : "border-border bg-surface-raised"}`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isAiFilled ? "bg-gold/20" : "bg-surface-overlay"}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={isAiFilled ? "text-gold" : "text-text-muted"}>
              <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zm7 10l.75 2.25L22 16l-2.25.75L19 19l-.75-2.25L16 16l2.25-.75L19 13zM5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5L5 17z"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold">{isAiFilled ? "AI 자동 완성됨" : "AI 자동 완성"}</p>
            <p className="text-xs text-text-muted truncate">
              {isAiFilled
                ? `제목, 설명, 난이도, 태그${aiFilledFields.has("lol_conditions") ? ", LoL 조건" : ""} 자동 입력 — 수정 후 게시하세요`
                : "입력 시퀀스를 분석해 제목·설명·난이도·태그·조건을 한 번에 채워줍니다"}
            </p>
          </div>
        </div>
        <button type="button" onClick={handleAiAutofill} disabled={aiPending || !characterSlug}
          className={`shrink-0 h-9 px-4 rounded-lg text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap ${isAiFilled ? "border border-gold/40 text-gold hover:bg-gold/10" : "bg-gold text-white hover:bg-gold-light"}`}>
          {aiPending ? (
            <span className="flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="animate-spin"><path d="M12 3v3m0 12v3M3 12h3m12 0h3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
              분석 중...
            </span>
          ) : isAiFilled ? "다시 생성" : "자동 완성"}
        </button>
      </div>
      {aiError && <p className="text-xs text-hard -mt-3">{aiError}</p>}
      {!characterSlug && <p className="text-xs text-text-muted -mt-3">챔피언을 먼저 선택하면 AI 자동 완성을 사용할 수 있습니다</p>}

      {/* 기본 정보 */}
      <div className="flex flex-col gap-5 bg-surface-raised rounded-xl p-6 border border-border">
        <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">기본 정보</p>

        {/* 제목 */}
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-sm font-semibold">제목 <span className="text-hard">*</span>{aiFilledFields.has("title") && <AiBadge />}</span>
          <input type="text" required value={title} onChange={(e) => { setTitle(e.target.value); saveDraft({ title: e.target.value, description, tip, difficulty, tagsInput: tags, character: characterSlug, gameSpecific }); }} placeholder="콤보 제목을 입력하세요" className={fieldCls(aiFilledFields.has("title"))} />
        </label>

        {/* 콤보 설명 */}
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-sm font-semibold">
            콤보 설명{aiFilledFields.has("description") && <AiBadge />}
            <span className={`ml-auto text-xs font-normal ${description.length > 100 ? "text-hard" : "text-text-muted"}`}>{description.length} / 100</span>
          </span>
          <textarea
            rows={2}
            maxLength={100}
            value={description}
            onChange={(e) => { setDescription(e.target.value); saveDraft({ title, description: e.target.value, tip, difficulty, tagsInput: tags, character: characterSlug, gameSpecific }); }}
            placeholder="한 줄 요약 (최대 100자)"
            className={`px-3 py-2 rounded-lg border bg-surface-overlay text-sm resize-none focus:outline-none transition-colors ${aiFilledFields.has("description") ? "border-gold/40 focus:border-gold/60" : "border-border focus:border-[rgba(255,255,255,0.3)]"}`}
          />
        </div>

        {/* 팁 */}
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-sm font-semibold">
            팁
            <span className={`ml-auto text-xs font-normal ${tip.length > 200 ? "text-hard" : "text-text-muted"}`}>{tip.length} / 200</span>
          </span>
          <textarea
            rows={3}
            maxLength={200}
            value={tip}
            onChange={(e) => { setTip(e.target.value); saveDraft({ title, description, tip: e.target.value, difficulty, tagsInput: tags, character: characterSlug, gameSpecific }); }}
            placeholder="상세 팁, 주의사항, 상황 설명 등 (최대 200자, 선택)"
            className="px-3 py-2 rounded-lg border border-border bg-surface-overlay text-sm resize-none focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
          />
        </div>

        {/* 챔피언 */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">챔피언 <span className="text-hard">*</span></span>
            {characterSlug && !champPickerOpen && (
              <button type="button" onClick={() => setChampPickerOpen(true)} className="text-xs text-text-secondary hover:text-text transition-colors">변경</button>
            )}
          </div>
          {characterSlug && !champPickerOpen ? (
            <div className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-surface-overlay">
              {(() => {
                const champ = characters.find((c) => c.slug === characterSlug);
                const iconUrl = champ?.iconUrl ?? getChampIconUrl(characterSlug, patch);
                return (
                  <>
                    <Image src={iconUrl} alt={champ?.name ?? characterSlug} width={20} height={20} sizes="20px" className="rounded shrink-0" />
                    <span className="text-sm font-semibold">{champ?.name ?? characterSlug}</span>
                    <span className="ml-auto text-xs text-text-muted">.tutfile에서 자동 인식됨</span>
                  </>
                );
              })()}
            </div>
          ) : (
            <ChampionPicker characters={characters} patch={patch} value={characterSlug} onChange={(slug) => { setCharacterSlug(slug); setChampPickerOpen(false); saveDraft({ title, description, tip, difficulty, tagsInput: tags, character: slug, gameSpecific }); }} />
          )}
        </div>

        {/* 난이도 */}
        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-sm font-semibold">난이도{aiFilledFields.has("difficulty") && <AiBadge />}</span>
          <div className="flex gap-2">
            {DIFFICULTY_OPTIONS.map(({ value: v }) => (
              <button key={v} type="button" onClick={() => { setDifficulty(v); saveDraft({ title, description, tip, difficulty: v, tagsInput: tags, character: characterSlug, gameSpecific }); }}
                className={`flex-1 h-9 rounded-lg border text-sm font-semibold transition-colors cursor-pointer ${difficulty === v ? "bg-surface-overlay border-[rgba(255,255,255,0.24)] text-text" : "border-border text-text-secondary hover:text-text"}`}>
                <DifficultyPips difficulty={v} className="justify-center" />
              </button>
            ))}
          </div>
        </div>

        {/* 태그 */}
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-sm font-semibold">태그{aiFilledFields.has("tags") && <AiBadge />}</span>
          <input type="text" value={tags} onChange={(e) => { setTags(e.target.value); saveDraft({ title, description, tip, difficulty, tagsInput: e.target.value, character: characterSlug, gameSpecific }); }} placeholder="풀콤보, 라인전, 6레벨 (쉼표로 구분)" className={fieldCls(aiFilledFields.has("tags"))} />
        </label>

        {/* 동영상 (모든 모드) */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">
              동영상 <span className="text-text-muted font-normal text-xs">(선택, mp4/webm)</span>
            </span>
            {videoFile && !showVideoEditor && (
              <button type="button" onClick={() => setShowVideoEditor(true)}
                className="text-xs font-semibold text-gold hover:text-gold-light transition-colors">
                편집 (Trim/Crop)
              </button>
            )}
          </div>
          <label className="cursor-pointer">
            {videoFile ? (
              <div className="w-full h-12 rounded-lg border border-border bg-surface-overlay flex items-center justify-between px-3 hover:border-[rgba(255,255,255,0.24)] transition-colors">
                <span className="text-sm text-text truncate">{videoFile.name}</span>
                <span className="text-xs text-text-muted shrink-0">클릭해서 변경</span>
              </div>
            ) : (
              <div className="w-full h-12 rounded-lg border border-dashed border-border bg-surface-overlay flex items-center justify-center text-sm text-text-muted hover:border-[rgba(255,255,255,0.24)] hover:text-text transition-colors">
                + 동영상 선택
              </div>
            )}
            <input type="file" accept="video/mp4,video/webm,video/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleVideoSelect(e.target.files[0])} />
          </label>
          {showVideoEditor && videoSrc && (
            <VideoEditor src={videoSrc} onDone={handleVideoDone} onCancel={() => setShowVideoEditor(false)} />
          )}
        </div>

        {/* 썸네일 — 영상 프레임 선택기 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold">
            썸네일
            {videoSrc && <span className="ml-1.5 text-xs text-text-muted font-normal">영상에서 원하는 장면을 선택하세요</span>}
          </span>
          <ThumbnailPicker
            videoSrc={videoSrc}
            onCapture={(f, preview) => { setThumbnailFile(f); void preview; }}
          />
        </div>
      </div>

      {/* LoL 조건 */}
      {parsed?.manifest.game === "lol" && (
        <div className={`rounded-xl border overflow-hidden transition-colors ${aiFilledFields.has("lol_conditions") ? "border-gold/40" : "border-border"}`}>
          {aiFilledFields.has("lol_conditions") && (
            <div className="flex items-center gap-2 px-5 py-2.5 bg-gold/5 border-b border-gold/20">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-gold"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/></svg>
              <span className="text-xs text-gold font-semibold">AI가 입력 시퀀스에서 조건을 자동 추출했습니다</span>
            </div>
          )}
          <div className="bg-surface-raised">
            <LolUploadForm value={gameSpecific} onChange={(gs) => { setGameSpecific(gs); saveDraft({ title, description, tip, difficulty, tagsInput: tags, character: characterSlug, gameSpecific: gs }); }} items={items} patch={patch} />
          </div>
        </div>
      )}

      {error && <p className="text-sm text-hard">{error}</p>}

      <button type="submit" disabled={isSubmitting}
        className="h-12 rounded-xl bg-gold text-white font-bold text-sm shadow-[0_2px_8px_rgba(184,134,11,0.32)] hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer">
        {isSubmitting ? "업로드 중..." : "콤보 게시하기"}
      </button>
    </form>
  );
}

// ── Helpers ───────────────────────────────────────────────────
function AiBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gold/15 text-gold text-xs font-bold">
      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/></svg>
      AI
    </span>
  );
}

function fieldCls(highlight: boolean) {
  return `h-10 px-3 rounded-lg border bg-surface-overlay text-sm focus:outline-none transition-colors ${highlight ? "border-gold/40 focus:border-gold/60" : "border-border focus:border-[rgba(255,255,255,0.3)]"}`;
}
