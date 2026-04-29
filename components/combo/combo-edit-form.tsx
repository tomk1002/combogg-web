"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  thumbnailUrl: string | null;
  videoUrl: string | null;
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

async function uploadFile(file: File, bucket: string): Promise<string> {
  const res = await fetch("/api/uploads/presigned-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bucket, filename: file.name }),
  });
  if (!res.ok) throw new Error("presigned URL 발급 실패");
  const { data } = await res.json() as { data: { uploadUrl: string; path: string } };
  await fetch(data.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${data.path}`;
}

// 영상 → 프레임 추출 섹션
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
      <p className="text-[11px] text-text-muted">타임라인을 드래그해서 원하는 프레임을 선택하세요</p>
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
          <span className="text-[10px] font-mono text-text-muted w-8 shrink-0">{fmt(currentTime)}</span>
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
          <span className="text-[10px] font-mono text-text-muted w-8 text-right">{fmt(duration)}</span>
        </div>
      )}
    </div>
  );
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
  // 미디어
  const [newThumbnailFile, setNewThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(combo.thumbnailUrl);
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string | null>(null); // blob URL for frame picker
  const [showFramePicker, setShowFramePicker] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // blob URL 정리
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
    const src = URL.createObjectURL(f);
    setVideoSrc(src);
    setShowFramePicker(true);
  };

  const handleFrameCapture = (file: File, preview: string) => {
    setNewThumbnailFile(file);
    setThumbnailPreview(preview);
  };

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
      // 파일 업로드 (변경된 경우만)
      let newThumbnailUrl: string | undefined;
      let newVideoUrl: string | undefined;

      if (newThumbnailFile) {
        newThumbnailUrl = await uploadFile(newThumbnailFile, "thumbnails");
      }
      if (newVideoFile) {
        newVideoUrl = await uploadFile(newVideoFile, "videos");
      }

      const res = await fetch(`/api/combos/${combo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          difficulty,
          tags,
          gameSpecific: combo.game.slug === "lol" ? gameSpecific : undefined,
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* Media */}
      <div className="bg-surface-raised rounded-xl p-5 border border-border flex flex-col gap-5">
        <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary">미디어</h2>

        {/* Thumbnail */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">썸네일</span>
            <div className="flex gap-2">
              {videoSrc && (
                <button
                  type="button"
                  onClick={() => setShowFramePicker((v) => !v)}
                  className="text-xs font-semibold text-gold hover:text-gold-light transition-colors"
                >
                  {showFramePicker ? "프레임 선택 닫기" : "영상에서 추출"}
                </button>
              )}
              <button
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
                className="text-xs font-semibold text-text-secondary hover:text-text transition-colors"
              >
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
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-[10px] font-semibold text-white">변경됨</div>
              )}
            </div>
          ) : (
            <div className="w-full h-20 rounded-lg border border-dashed border-border bg-surface-overlay flex items-center justify-center text-sm text-text-muted">
              썸네일 없음
            </div>
          )}

          {showFramePicker && videoSrc && (
            <VideoThumbnailPicker videoSrc={videoSrc} onCapture={handleFrameCapture} />
          )}
        </div>

        {/* Video */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">영상</span>
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="text-xs font-semibold text-text-secondary hover:text-text transition-colors"
            >
              영상 교체
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
                <span className="flex-1 truncate">현재 영상 있음</span>
              </>
            ) : (
              <span className="text-text-muted">영상 없음</span>
            )}
          </div>
          {newVideoFile && (
            <p className="text-[11px] text-text-muted">영상을 교체하면 위에서 새 썸네일도 추출할 수 있습니다.</p>
          )}
        </div>
      </div>

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
