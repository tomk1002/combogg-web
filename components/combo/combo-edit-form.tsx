"use client";

import { useState, useRef, useCallback, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import DifficultyPips from "@/components/shared/difficulty-pips";
import LolUploadForm from "@/components/games/lol/lol-upload-form";
import InputKeyMapper, { type MappableEntry } from "@/components/upload/input-key-mapper";
import { KeySequence, inputToKeySequence } from "@/components/shared/keycap";
import type { Difficulty } from "@/types";
import type { LolGameSpecific } from "@/lib/games/lol/schema";

interface Combo {
  id: string;
  title: string;
  description: string | null;
  tip: string | null;
  difficulty: string;
  tags: string[];
  gameSpecific: unknown;
  inputSummary: unknown;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  durationMs: number | null;
  game: { slug: string };
  character: { slug: string; name: string } | null;
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

async function uploadFile(file: File, bucket: string): Promise<string> {
  const res = await fetch("/api/uploads/presigned-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucket, filename: file.name }),
  });
  if (!res.ok) throw new Error("presigned URL 발급 실패");
  const { uploadUrl, path } = await res.json() as { uploadUrl: string; path: string };
  await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${path}`;
}

function VideoThumbnailPicker({ videoSrc, onCapture }: {
  videoSrc: string;
  onCapture: (file: File, preview: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

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
      onCapture(new File([blob], "thumbnail.jpg", { type: "image/jpeg" }), url);
    }, "image/jpeg", 0.88);
  }, [onCapture]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setReady(false);
    setPreview(null);
    video.onloadedmetadata = () => {
      const mid = video.duration / 2;
      setDuration(video.duration);
      setCurrentTime(mid);
      video.currentTime = mid;
    };
    video.onseeked = () => { setReady(true); captureFrame(); };
    video.src = videoSrc;
    video.load();
  }, [videoSrc, captureFrame]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="flex flex-col gap-2 mt-2">
      <video ref={videoRef} className="hidden" muted playsInline preload="auto" crossOrigin="anonymous" />
      <canvas ref={canvasRef} className="hidden" />
      <p className="text-xs text-text-muted">타임라인을 드래그해서 원하는 프레임을 선택하세요</p>
      <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-surface-overlay">
        {preview ? (
          <Image src={preview} alt="추출 프레임" fill sizes="672px" className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      {ready && duration > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-text-muted w-8 shrink-0">{fmt(currentTime)}</span>
          <input
            type="range" min={0} max={duration} step={0.05} value={currentTime}
            onChange={(e) => {
              const t = parseFloat(e.target.value);
              setCurrentTime(t);
              if (videoRef.current) videoRef.current.currentTime = t;
            }}
            onMouseUp={captureFrame}
            onTouchEnd={captureFrame}
            className="flex-1 h-1.5 accent-gold cursor-pointer"
          />
          <span className="text-xs font-mono text-text-muted w-8 text-right">{fmt(duration)}</span>
        </div>
      )}
    </div>
  );
}

function AiBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gold/15 text-gold text-xs font-bold">
      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/></svg>
      AI
    </span>
  );
}

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export default function ComboEditForm({ combo, items, patch }: Props) {
  const router = useRouter();

  const [title, setTitle] = useState(combo.title);
  const [description, setDescription] = useState(combo.description ?? "");
  const [tip, setTip] = useState(combo.tip ?? "");
  const [inputSummary, setInputSummary] = useState<MappableEntry[]>(
    (combo.inputSummary as MappableEntry[]) ?? []
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(
    (combo.difficulty as Difficulty) ?? "medium"
  );
  const [tagsInput, setTagsInput] = useState(combo.tags.join(", "));
  const [gameSpecific, setGameSpecific] = useState<Partial<LolGameSpecific>>(
    (combo.gameSpecific as Partial<LolGameSpecific>) ?? {}
  );
  const [newThumbnailFile, setNewThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(combo.thumbnailUrl);
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [showFramePicker, setShowFramePicker] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // AI autofill
  const [aiPending, startAiTransition] = useTransition();
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    return () => { if (videoSrc) URL.revokeObjectURL(videoSrc); };
  }, [videoSrc]);

  const handleThumbnailFile = (f: File) => {
    setNewThumbnailFile(f);
    setThumbnailPreview(URL.createObjectURL(f));
    setShowFramePicker(false);
  };

  const handleVideoFile = (f: File) => {
    if (videoSrc) URL.revokeObjectURL(videoSrc);
    setNewVideoFile(f);
    setVideoSrc(URL.createObjectURL(f));
    setShowFramePicker(true);
  };

  const handleFrameCapture = (file: File, preview: string) => {
    setNewThumbnailFile(file);
    setThumbnailPreview(preview);
  };

  const handleAiAutofill = () => {
    if (!combo.character?.slug || inputSummary.length === 0) return;
    setAiError(null);
    startAiTransition(async () => {
      const res = await fetch("/api/ai/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character: combo.character!.slug,
          inputs: inputSummary,
          durationMs: combo.durationMs,
          patch,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        setAiError(d.error ?? "AI 자동 완성 실패");
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
      if (data.tags?.length) { setTagsInput(data.tags.join(", ")); filled.add("tags"); }
      if (combo.game.slug === "lol" && data.required_level) {
        setGameSpecific((prev) => ({ ...prev, required_level: data.required_level! }));
        filled.add("lol_conditions");
      }
      setAiFilledFields(filled);
    });
  };

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("제목을 입력해주세요."); return; }

    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    setSaving(true);
    setError(null);

    try {
      let newThumbnailUrl: string | undefined;
      let newVideoUrl: string | undefined;
      if (newThumbnailFile) newThumbnailUrl = await uploadFile(newThumbnailFile, "thumbnails");
      if (newVideoFile) newVideoUrl = await uploadFile(newVideoFile, "videos");

      const res = await fetch(`/api/combos/${combo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          tip: tip.trim() || null,
          difficulty,
          tags,
          gameSpecific: combo.game.slug === "lol" ? gameSpecific : undefined,
          inputSummary,
          ...(newThumbnailUrl && { thumbnailUrl: newThumbnailUrl }),
          ...(newVideoUrl && { videoUrl: newVideoUrl }),
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

  const isAiFilled = aiFilledFields.size > 0;
  const keys = inputToKeySequence(
    inputSummary.map(({ category, ref, slot }) => ({ category, ref, slot }))
  );

  const fieldCls = (highlight: boolean) =>
    `h-10 px-3 rounded-lg border bg-surface-overlay text-sm focus:outline-none transition-colors ${
      highlight ? "border-gold/40 focus:border-gold/60" : "border-border focus:border-[rgba(255,255,255,0.3)]"
    }`;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* 입력 시퀀스 미리보기 */}
      {keys.length > 0 && (
        <div className="bg-surface-raised rounded-xl border border-border overflow-hidden">
          <div className="p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-3">입력 시퀀스</p>
            <KeySequence keys={keys} size="sm" maxKeys={16} />
            <p className="text-xs text-text-muted mt-2">
              총 {inputSummary.length}개 입력
              {combo.durationMs ? ` · ${(combo.durationMs / 1000).toFixed(1)}초` : ""}
            </p>
          </div>
          {combo.game.slug === "lol" && (
            <div className="border-t border-border">
              <div className="px-5 pt-4 pb-1">
                <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">슬롯 매핑</p>
                <p className="text-xs text-text-muted mt-0.5">아이템 슬롯·소환사 주문을 실제 아이템으로 수정할 수 있습니다</p>
              </div>
              <InputKeyMapper inputs={inputSummary} items={items} patch={patch} onChange={setInputSummary} />
            </div>
          )}
        </div>
      )}

      {/* AI 자동 완성 */}
      {combo.character && inputSummary.length > 0 && (
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
                  ? "제목, 설명, 난이도, 태그 자동 입력 — 수정 후 저장하세요"
                  : `${combo.character.name} 콤보를 분석해 정보를 자동으로 채워줍니다`}
              </p>
            </div>
          </div>
          <button type="button" onClick={handleAiAutofill} disabled={aiPending}
            className={`shrink-0 h-9 px-4 rounded-lg text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap ${isAiFilled ? "border border-gold/40 text-gold hover:bg-gold/10" : "bg-gold text-white hover:bg-gold-light"}`}>
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
      )}
      {aiError && <p className="text-xs text-hard -mt-3">{aiError}</p>}

      {/* 미디어 */}
      <div className="bg-surface-raised rounded-xl p-5 border border-border flex flex-col gap-5">
        <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary">미디어</h2>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">썸네일</span>
            <div className="flex gap-2">
              {videoSrc && (
                <button type="button" onClick={() => setShowFramePicker((v) => !v)}
                  className="text-xs font-semibold text-gold hover:text-gold-light transition-colors">
                  {showFramePicker ? "닫기" : "영상에서 추출"}
                </button>
              )}
              <button type="button" onClick={() => thumbnailInputRef.current?.click()}
                className="text-xs font-semibold text-text-secondary hover:text-text transition-colors">
                이미지 직접 선택
              </button>
            </div>
          </div>
          <input ref={thumbnailInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleThumbnailFile(e.target.files[0])} />
          {thumbnailPreview ? (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-surface-overlay">
              <Image src={thumbnailPreview} alt="썸네일" fill sizes="672px" className="object-cover" />
              {newThumbnailFile && (
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-xs font-semibold text-white">변경됨</div>
              )}
            </div>
          ) : (
            <div className="w-full h-20 rounded-lg border border-dashed border-border bg-surface-overlay flex items-center justify-center text-sm text-text-muted">
              썸네일 없음 — 영상을 업로드하면 프레임을 자동 추출합니다
            </div>
          )}
          {showFramePicker && videoSrc && (
            <VideoThumbnailPicker videoSrc={videoSrc} onCapture={handleFrameCapture} />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">영상 <span className="text-text-muted text-xs font-normal">(mp4)</span></span>
            <button type="button" onClick={() => videoInputRef.current?.click()}
              className="text-xs font-semibold text-text-secondary hover:text-text transition-colors">
              {combo.videoUrl || newVideoFile ? "영상 교체" : "영상 업로드"}
            </button>
          </div>
          <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleVideoFile(e.target.files[0])} />
          <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-border bg-surface-overlay text-sm text-text-secondary">
            {newVideoFile ? (
              <>
                <span className="text-gold text-xs font-bold">새 파일</span>
                <span className="flex-1 truncate">{newVideoFile.name}</span>
                <span className="text-text-muted text-xs shrink-0">{(newVideoFile.size / 1024 / 1024).toFixed(1)} MB</span>
              </>
            ) : combo.videoUrl ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-text-muted shrink-0">
                  <path d="M15 10l4.553-2.277A1 1 0 0 1 21 8.723v6.554a1 1 0 0 1-1.447.9L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="flex-1 truncate">영상 있음</span>
              </>
            ) : (
              <span className="text-text-muted">영상 없음 — 오버레이에서 녹화 후 여기서 업로드하세요</span>
            )}
          </div>
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="bg-surface-raised rounded-xl p-5 border border-border flex flex-col gap-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary">기본 정보</h2>

        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-sm font-semibold">
            제목 <span className="text-hard">*</span>
            {aiFilledFields.has("title") && <AiBadge />}
          </span>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            required maxLength={100} className={fieldCls(aiFilledFields.has("title"))} />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-sm font-semibold">
            콤보 설명
            {aiFilledFields.has("description") && <AiBadge />}
            <span className={`ml-auto text-xs font-normal ${description.length > 100 ? "text-hard" : "text-text-muted"}`}>{description.length} / 100</span>
          </span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 100))}
            rows={2} maxLength={100} placeholder="한 줄 요약 (최대 100자)"
            className={`px-3 py-2 rounded-lg border bg-surface-overlay text-sm focus:outline-none transition-colors resize-none ${aiFilledFields.has("description") ? "border-gold/40 focus:border-gold/60" : "border-border focus:border-[rgba(255,255,255,0.3)]"}`} />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-sm font-semibold">
            팁
            <span className={`ml-auto text-xs font-normal ${tip.length > 200 ? "text-hard" : "text-text-muted"}`}>{tip.length} / 200</span>
          </span>
          <textarea value={tip} onChange={(e) => setTip(e.target.value.slice(0, 200))}
            rows={3} maxLength={200} placeholder="상세 팁, 주의사항, 상황 설명 등 (최대 200자, 선택)"
            className="px-3 py-2 rounded-lg border border-border bg-surface-overlay text-sm focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors resize-none" />
        </div>

        <div className="flex flex-col gap-2">
          <span className="flex items-center gap-2 text-sm font-semibold">
            난이도
            {aiFilledFields.has("difficulty") && <AiBadge />}
          </span>
          <div className="flex gap-2">
            {DIFFICULTIES.map((d) => (
              <button key={d} type="button" onClick={() => setDifficulty(d)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                  difficulty === d
                    ? "border-[rgba(255,255,255,0.24)] bg-surface-overlay"
                    : "border-border text-text-secondary hover:border-[rgba(255,255,255,0.16)] hover:text-text"
                }`}>
                <DifficultyPips difficulty={d} />
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-sm font-semibold">
            태그
            {aiFilledFields.has("tags") && <AiBadge />}
          </span>
          <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
            placeholder="쉼표로 구분 (예: 풀콤보, 라인전)"
            className={fieldCls(aiFilledFields.has("tags"))} />
          <p className="text-xs text-text-muted">쉼표(,)로 태그를 구분하세요</p>
        </label>
      </div>

      {/* LoL 조건 */}
      {combo.game.slug === "lol" && (
        <div className={`rounded-xl border overflow-hidden transition-colors ${aiFilledFields.has("lol_conditions") ? "border-gold/40" : "border-border"}`}>
          {aiFilledFields.has("lol_conditions") && (
            <div className="flex items-center gap-2 px-5 py-2.5 bg-gold/5 border-b border-gold/20">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-gold"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/></svg>
              <span className="text-xs text-gold font-semibold">AI가 입력 시퀀스에서 조건을 자동 추출했습니다</span>
            </div>
          )}
          <div className="bg-surface-raised">
            <LolUploadForm value={gameSpecific} onChange={setGameSpecific} items={items} patch={patch} />
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-hard bg-hard/10 border border-hard/30 rounded-lg px-4 py-3">{error}</p>
      )}

      <div className="flex gap-3 justify-end">
        <button type="button" onClick={() => router.back()}
          className="h-10 px-5 rounded-lg border border-border text-sm font-semibold text-text-secondary hover:bg-surface-overlay hover:text-text transition-colors">
          취소
        </button>
        <button type="submit" disabled={saving}
          className="h-10 px-6 rounded-lg bg-gold text-white text-sm font-bold hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}
