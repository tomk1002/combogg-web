"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type AspectRatio = "original" | "16:9" | "1:1" | "9:16";

const AR_OPTIONS: { value: AspectRatio; label: string }[] = [
  { value: "original", label: "원본" },
  { value: "16:9",     label: "16:9" },
  { value: "1:1",      label: "1:1" },
  { value: "9:16",     label: "9:16" },
];

function computeCrop(vw: number, vh: number, ar: AspectRatio) {
  if (ar === "original") return { sx: 0, sy: 0, sw: vw, sh: vh };
  const [wRatio, hRatio] = ar === "9:16" ? [9, 16] : ar === "1:1" ? [1, 1] : [16, 9];
  const targetRatio = wRatio / hRatio;
  const videoRatio  = vw / vh;
  if (videoRatio > targetRatio) {
    const sw = Math.round(vh * targetRatio);
    return { sx: Math.round((vw - sw) / 2), sy: 0, sw, sh: vh };
  } else {
    const sh = Math.round(vw / targetRatio);
    return { sx: 0, sy: Math.round((vh - sh) / 2), sw: vw, sh };
  }
}

// ── DualRangeSlider ─────────────────────────────────────────
function DualRangeSlider({ min, max, start, end, onChange }: {
  min: number; max: number; start: number; end: number;
  onChange: (start: number, end: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging  = useRef<"start" | "end" | null>(null);

  const getPercent = (v: number) => ((v - min) / (max - min)) * 100;

  const valueFromEvent = useCallback((e: MouseEvent | TouchEvent) => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return min + x * (max - min);
  }, [min, max]);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const val = valueFromEvent(e);
      if (dragging.current === "start") onChange(Math.min(val, end - 0.1), end);
      else                               onChange(start, Math.max(val, start + 0.1));
    };
    const onUp = () => { dragging.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend",  onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend",  onUp);
    };
  }, [start, end, onChange, valueFromEvent]);

  const startHandle = (handle: "start" | "end") => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    dragging.current = handle;
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="flex flex-col gap-1.5">
      <div ref={trackRef} className="relative h-8 flex items-center select-none">
        {/* Track background */}
        <div className="w-full h-2 bg-surface-overlay rounded-full overflow-visible relative">
          {/* Selected region */}
          <div className="absolute h-full bg-gold/50 rounded-full"
            style={{ left: `${getPercent(start)}%`, right: `${100 - getPercent(end)}%` }} />
        </div>
        {/* Start handle */}
        <div
          className="absolute w-5 h-5 bg-white border-2 border-gold rounded-full shadow-md cursor-grab z-10"
          style={{ left: `${getPercent(start)}%`, transform: "translateX(-50%)" }}
          onMouseDown={startHandle("start")}
          onTouchStart={startHandle("start")}
        />
        {/* End handle */}
        <div
          className="absolute w-5 h-5 bg-white border-2 border-gold rounded-full shadow-md cursor-grab z-10"
          style={{ left: `${getPercent(end)}%`, transform: "translateX(-50%)" }}
          onMouseDown={startHandle("end")}
          onTouchStart={startHandle("end")}
        />
      </div>
      <div className="flex justify-between text-xs font-mono text-text-muted">
        <span>{fmt(start)}</span>
        <span className="text-text-secondary font-semibold">{(end - start).toFixed(1)}초 선택</span>
        <span>{fmt(end)}</span>
      </div>
    </div>
  );
}

// ── VideoEditor ───────────────────────────────────────────────
interface Props {
  src: string;
  onDone: (blob: Blob, ext: string) => void;
  onCancel: () => void;
}

export default function VideoEditor({ src, onDone, onCancel }: Props) {
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const [duration,   setDuration]   = useState(0);
  const [startTime,  setStartTime]  = useState(0);
  const [endTime,    setEndTime]    = useState(0);
  const [aspect,     setAspect]     = useState<AspectRatio>("original");
  const [processing, setProcessing] = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [preview,    setPreview]    = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.src = src;
    video.onloadedmetadata = () => {
      setDuration(video.duration);
      setEndTime(video.duration);
      video.currentTime = video.duration / 2;
    };
  }, [src]);

  // Draw preview on canvas
  const drawPreview = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;
    const { sx, sy, sw, sh } = computeCrop(video.videoWidth, video.videoHeight, aspect);
    canvas.width  = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
    setPreview(canvas.toDataURL("image/jpeg", 0.8));
  }, [aspect]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handler = () => drawPreview();
    video.addEventListener("seeked", handler);
    drawPreview();
    return () => video.removeEventListener("seeked", handler);
  }, [drawPreview]);

  const handleTrimChange = (s: number, e: number) => {
    setStartTime(s);
    setEndTime(e);
    if (videoRef.current) videoRef.current.currentTime = s;
  };

  const handleProcess = async () => {
    const video = videoRef.current;
    if (!video || processing || duration === 0) return;
    setProcessing(true);
    setProgress(0);

    try {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      const { sx, sy, sw, sh } = computeCrop(vw, vh, aspect);

      const offCanvas = document.createElement("canvas");
      offCanvas.width  = sw;
      offCanvas.height = sh;
      const ctx = offCanvas.getContext("2d")!;

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4";

      const stream   = offCanvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

      await new Promise<void>((resolve, reject) => {
        recorder.onstop  = () => resolve();
        recorder.onerror = (e) => reject(e);

        video.muted = true;
        video.playbackRate = 1;

        const drawLoop = () => {
          const t = video.currentTime;
          setProgress((t - startTime) / Math.max(0.01, endTime - startTime));
          if (t >= endTime || video.ended) {
            recorder.stop();
            video.pause();
            return;
          }
          ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
          requestAnimationFrame(drawLoop);
        };

        recorder.start();
        video.currentTime = startTime;
        video.onseeked = () => {
          video.play().then(() => requestAnimationFrame(drawLoop)).catch(reject);
        };
      });

      const ext  = mimeType.includes("webm") ? "webm" : "mp4";
      const blob = new Blob(chunks, { type: mimeType });
      onDone(blob, ext);
    } catch (err) {
      console.error("video processing failed:", err);
      setProcessing(false);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div className="flex flex-col gap-4 bg-surface-raised rounded-xl border border-border p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold">영상 편집</p>
        <button type="button" onClick={onCancel} disabled={processing}
          className="text-xs text-text-secondary hover:text-text transition-colors disabled:opacity-50">닫기</button>
      </div>

      {/* Hidden source video + preview canvas */}
      <video ref={videoRef} className="hidden" muted playsInline preload="auto" crossOrigin="anonymous" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Preview */}
      <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ minHeight: "120px" }}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="미리보기" className="w-full h-auto" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-text-muted border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {processing && (
          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-3">
            <div className="w-48 h-1.5 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full bg-gold transition-all duration-300" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <p className="text-sm text-white font-semibold">처리 중... {Math.round(progress * 100)}%</p>
            <p className="text-xs text-white/60">실시간 인코딩 중 ({fmt(startTime + progress * (endTime - startTime))} / {fmt(endTime)})</p>
          </div>
        )}
      </div>

      {/* Aspect ratio */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wide text-text-secondary">화면 비율 (중앙 크롭)</span>
        <div className="flex gap-2">
          {AR_OPTIONS.map(({ value, label }) => (
            <button key={value} type="button" onClick={() => { setAspect(value); drawPreview(); }}
              disabled={processing}
              className={`flex-1 h-8 rounded-lg border text-xs font-bold transition-colors disabled:opacity-40 ${aspect === value ? "bg-surface-overlay border-[rgba(255,255,255,0.24)] text-text" : "border-border text-text-secondary hover:text-text"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Trim */}
      {duration > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-text-secondary">
            구간 선택 (Trim) · 전체: {fmt(duration)}
          </span>
          <DualRangeSlider
            min={0} max={duration}
            start={startTime} end={endTime}
            onChange={handleTrimChange}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button type="button" onClick={onCancel} disabled={processing}
          className="flex-1 h-10 rounded-lg border border-border text-sm font-semibold text-text-secondary hover:text-text transition-colors disabled:opacity-40">
          취소
        </button>
        <button type="button" onClick={handleProcess} disabled={processing || duration === 0}
          className="flex-1 h-10 rounded-lg bg-gold text-white text-sm font-bold hover:bg-gold-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          {processing ? "처리 중..." : "처리 완료"}
        </button>
      </div>
    </div>
  );
}
