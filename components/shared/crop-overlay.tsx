"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// ── Types ────────────────────────────────────────────────────
//
// Crop 좌표는 모두 **정규화된 0~1 값** (미디어 픽셀 기준 비율).
// 화면 좌표로 옮길 때만 컨테이너 크기를 곱해서 계산.
export interface NormalizedCrop {
  x: number; // 좌상단 x (0..1)
  y: number; // 좌상단 y (0..1)
  w: number; // width (0..1)
  h: number; // height (0..1)
}

export interface CropResult extends NormalizedCrop {
  ratio: string; // "16:9" | "4:3" | "1:1" | "9:16" | "free"
}

export type AspectRatioPreset = "16:9" | "4:3" | "1:1" | "9:16" | "free";

// crop 비율은 detail 페이지 컨테이너 비율(16:9)에 통일.
// 다른 비율을 허용하면 썸네일/영상/컨테이너 간 cover-fit 잘림이 생겨 중앙 정렬·일관성이 깨짐.
const RATIOS: { value: AspectRatioPreset; label: string; ratio: number | null }[] = [
  { value: "16:9", label: "16:9", ratio: 16 / 9 },
];

interface Props {
  imageUrl?: string;
  videoUrl?: string;
  initialCrop?: NormalizedCrop;
  onApply: (crop: CropResult) => void;
  onCancel: () => void;
}

type DragMode =
  | { type: "move"; startX: number; startY: number; origCrop: NormalizedCrop }
  | { type: "resize"; handle: Handle; startX: number; startY: number; origCrop: NormalizedCrop }
  | null;

type Handle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

// ── 비율 보존 헬퍼 ───────────────────────────────────────────
// 자유 모드가 아닌 경우, w/h 가 주어진 ratio 를 따르도록 보정.
// stage(컨테이너) 의 가로:세로 비도 함께 고려 — 정규화 좌표는 비율이 컨테이너 크기에 따라 달라지므로.
function adjustForRatio(
  w: number,
  h: number,
  pixelRatio: number, // 목표 픽셀 비 (가로/세로)
  stageW: number,
  stageH: number,
): { w: number; h: number } {
  // 정규화 좌표에서의 비율 r_norm 은 (w * stageW) / (h * stageH) = pixelRatio 가 되어야 함
  // → w / h = pixelRatio * stageH / stageW
  const targetNormRatio = pixelRatio * (stageH / stageW);
  const currentRatio = w / h;
  if (currentRatio > targetNormRatio) {
    // w 가 너무 큼 → w 를 줄임
    return { w: h * targetNormRatio, h };
  } else {
    return { w, h: w / targetNormRatio };
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ── Component ───────────────────────────────────────────────
export default function CropOverlay({
  imageUrl,
  videoUrl,
  initialCrop,
  onApply,
  onCancel,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const mediaWrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [ratio] = useState<AspectRatioPreset>("16:9");
  const [crop, setCrop] = useState<NormalizedCrop>(
    initialCrop ?? { x: 0.1, y: 0.1, w: 0.8, h: 0.8 }
  );
  const dragRef = useRef<DragMode>(null);

  // stage(미디어 표시 영역) 의 픽셀 크기.
  // crop 비율 보정에 stage 의 가로/세로 비를 알아야 하므로 measure.
  const [stageSize, setStageSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // stage 크기 측정
  useEffect(() => {
    const el = mediaWrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setStageSize({ w: rect.width, h: rect.height });
    });
    ro.observe(el);
    // 초기 측정
    const rect = el.getBoundingClientRect();
    setStageSize({ w: rect.width, h: rect.height });
    return () => ro.disconnect();
  }, []);

  // 16:9 비율 보정 (stageSize 알게 된 뒤, initialCrop 유무와 무관하게 1회).
  // 기존에 다른 비율로 저장된 crop 도 강제로 16:9 로 맞춤.
  const didInitRatioRef = useRef(false);
  useEffect(() => {
    if (didInitRatioRef.current) return;
    if (stageSize.w === 0 || stageSize.h === 0) return;
    const preset = RATIOS.find((r) => r.value === ratio);
    if (!preset?.ratio) { didInitRatioRef.current = true; return; }
    setCrop((c) => {
      const adjusted = adjustForRatio(c.w, c.h, preset.ratio!, stageSize.w, stageSize.h);
      // 중심 유지
      const cx = c.x + c.w / 2;
      const cy = c.y + c.h / 2;
      const nx = clamp(cx - adjusted.w / 2, 0, 1 - adjusted.w);
      const ny = clamp(cy - adjusted.h / 2, 0, 1 - adjusted.h);
      return { x: nx, y: ny, w: adjusted.w, h: adjusted.h };
    });
    didInitRatioRef.current = true;
  }, [stageSize, ratio]);

  // pointer → 정규화 좌표
  const pointerToNorm = useCallback((clientX: number, clientY: number) => {
    const el = mediaWrapRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  }, []);

  // ── pointer events ─────────────────────────────────────────
  const onPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    type: "move" | "resize",
    handle?: Handle,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    const start = pointerToNorm(e.clientX, e.clientY);
    if (type === "move") {
      dragRef.current = { type: "move", startX: start.x, startY: start.y, origCrop: { ...crop } };
    } else if (handle) {
      dragRef.current = { type: "resize", handle, startX: start.x, startY: start.y, origCrop: { ...crop } };
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const cur = pointerToNorm(e.clientX, e.clientY);
    const dx = cur.x - drag.startX;
    const dy = cur.y - drag.startY;

    if (drag.type === "move") {
      const nx = clamp(drag.origCrop.x + dx, 0, 1 - drag.origCrop.w);
      const ny = clamp(drag.origCrop.y + dy, 0, 1 - drag.origCrop.h);
      setCrop({ ...drag.origCrop, x: nx, y: ny });
      return;
    }

    // resize
    const orig = drag.origCrop;
    let { x, y, w, h } = orig;
    const handle = drag.handle;
    const minSize = 0.05; // 최소 5%
    // 핸들에 따라 좌/우/상/하 중 무엇을 움직일지 결정
    if (handle.includes("e")) {
      w = clamp(orig.w + dx, minSize, 1 - orig.x);
    }
    if (handle.includes("w")) {
      const newX = clamp(orig.x + dx, 0, orig.x + orig.w - minSize);
      w = orig.w + (orig.x - newX);
      x = newX;
    }
    if (handle.includes("s")) {
      h = clamp(orig.h + dy, minSize, 1 - orig.y);
    }
    if (handle.includes("n")) {
      const newY = clamp(orig.y + dy, 0, orig.y + orig.h - minSize);
      h = orig.h + (orig.y - newY);
      y = newY;
    }

    // 비율 보존 모드
    const preset = RATIOS.find((r) => r.value === ratio);
    if (preset?.ratio && stageSize.w > 0 && stageSize.h > 0) {
      const adjusted = adjustForRatio(w, h, preset.ratio, stageSize.w, stageSize.h);
      // 상하 핸들이면 h 우선, 좌우 핸들이면 w 우선, 코너면 큰 값 우선
      const isCorner = handle.length === 2;
      const isVertical = handle === "n" || handle === "s";
      const isHorizontal = handle === "e" || handle === "w";
      const finalW = isVertical ? adjusted.w : adjusted.w;
      const finalH = isHorizontal ? adjusted.h : adjusted.h;
      // 위 두 라인 모두 adjusted 자체로 통일 (가독성)
      void isCorner;
      w = finalW;
      h = finalH;

      // 핸들 방향에 따라 anchor 유지
      // anchor = handle 의 반대 corner/edge
      if (handle.includes("w")) {
        x = orig.x + orig.w - w;
      } else if (handle === "n" || handle === "s") {
        // 상/하: x 중심 고정
        x = orig.x + (orig.w - w) / 2;
      }
      if (handle.includes("n")) {
        y = orig.y + orig.h - h;
      } else if (handle === "e" || handle === "w") {
        y = orig.y + (orig.h - h) / 2;
      }

      // 경계 클램프
      x = clamp(x, 0, 1 - w);
      y = clamp(y, 0, 1 - h);
    }

    setCrop({ x, y, w, h });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
  };

  // ── Apply ─────────────────────────────────────────────────
  const handleApply = () => {
    onApply({ ...crop, ratio });
  };

  // 비디오 첫 프레임 표시: muted + autoplay → 0.1초 즈음 일시정지
  const onVideoLoaded = () => {
    const v = videoRef.current;
    if (!v) return;
    try {
      v.currentTime = Math.min(0.1, (v.duration || 1) - 0.05);
      v.pause();
    } catch {
      /* noop */
    }
  };

  // ── Render ────────────────────────────────────────────────
  // crop 박스를 픽셀 위치로 변환 — stage 의 contentRect 기준.
  const cropStyle: React.CSSProperties = {
    left: `${crop.x * 100}%`,
    top: `${crop.y * 100}%`,
    width: `${crop.w * 100}%`,
    height: `${crop.h * 100}%`,
  };

  return (
    <div
      ref={stageRef}
      className="fixed inset-0 z-50 flex flex-col items-stretch bg-black/85 backdrop-blur-sm"
      role="dialog"
      aria-label="크롭 편집"
    >
      {/* 헤더 — 비율 안내 (16:9 고정) */}
      <div className="flex items-center justify-center gap-2 px-4 py-3 border-b border-white/10 bg-black/50">
        <span className="text-xs font-bold uppercase tracking-wide text-white/60">비율</span>
        <span className="h-8 px-3 inline-flex items-center rounded-md border border-gold bg-gold/20 text-gold text-xs font-bold">16:9</span>
        <span className="text-[11px] text-white/40">컨테이너 일관성을 위해 16:9 고정</span>
      </div>

      {/* 미디어 + 크롭 박스 */}
      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div
          ref={mediaWrapRef}
          className="relative max-w-full max-h-full select-none"
          // 미디어 자체 크기에 맞춰지도록 inline-block 대신 wrapper.
          style={{ touchAction: "none" }}
        >
          {/* 미디어 */}
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="크롭 대상"
              draggable={false}
              className="block max-w-[90vw] max-h-[70vh] object-contain pointer-events-none"
            />
          ) : videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              muted
              playsInline
              preload="metadata"
              onLoadedMetadata={onVideoLoaded}
              className="block max-w-[90vw] max-h-[70vh] object-contain pointer-events-none"
            />
          ) : null}

          {/* 어두운 overlay (4분할 — top/left/right/bottom) */}
          {stageSize.w > 0 && (
            <>
              <div
                className="absolute bg-black/55 pointer-events-none"
                style={{
                  left: 0,
                  top: 0,
                  width: "100%",
                  height: `${crop.y * 100}%`,
                }}
              />
              <div
                className="absolute bg-black/55 pointer-events-none"
                style={{
                  left: 0,
                  top: `${crop.y * 100}%`,
                  width: `${crop.x * 100}%`,
                  height: `${crop.h * 100}%`,
                }}
              />
              <div
                className="absolute bg-black/55 pointer-events-none"
                style={{
                  left: `${(crop.x + crop.w) * 100}%`,
                  top: `${crop.y * 100}%`,
                  right: 0,
                  height: `${crop.h * 100}%`,
                }}
              />
              <div
                className="absolute bg-black/55 pointer-events-none"
                style={{
                  left: 0,
                  top: `${(crop.y + crop.h) * 100}%`,
                  width: "100%",
                  bottom: 0,
                }}
              />

              {/* Crop 박스 */}
              <div
                className="absolute border-2 border-dashed border-gold cursor-move shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
                style={cropStyle}
                onPointerDown={(e) => onPointerDown(e, "move")}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
              >
                {/* 8개 핸들 */}
                {(["nw", "n", "ne", "e", "se", "s", "sw", "w"] as Handle[]).map((h) => (
                  <div
                    key={h}
                    className={`absolute w-3 h-3 bg-gold border border-black/50 ${handlePosClass(h)} ${handleCursorClass(h)}`}
                    onPointerDown={(e) => onPointerDown(e, "resize", h)}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 푸터 — 적용 / 취소 */}
      <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/10 bg-black/50">
        <span className="mr-auto text-[11px] text-white/50 hidden sm:block">
          드래그로 이동 · 핸들로 크기 조절
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="h-9 px-4 rounded-lg border border-white/20 text-sm font-semibold text-white/80 hover:bg-white/10 transition-colors"
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="h-9 px-5 rounded-lg bg-gold text-white text-sm font-bold hover:bg-gold-light transition-colors"
        >
          적용
        </button>
      </div>
    </div>
  );
}

// ── handle 위치/커서 클래스 ─────────────────────────────────
function handlePosClass(h: Handle): string {
  // 박스 모서리/엣지 중앙에 위치, translate 로 상자 위에 정확히 겹치게.
  const map: Record<Handle, string> = {
    nw: "left-0 top-0 -translate-x-1/2 -translate-y-1/2",
    n:  "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2",
    ne: "right-0 top-0 translate-x-1/2 -translate-y-1/2",
    e:  "right-0 top-1/2 translate-x-1/2 -translate-y-1/2",
    se: "right-0 bottom-0 translate-x-1/2 translate-y-1/2",
    s:  "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2",
    sw: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2",
    w:  "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2",
  };
  return map[h];
}

function handleCursorClass(h: Handle): string {
  const map: Record<Handle, string> = {
    nw: "cursor-nwse-resize",
    n:  "cursor-ns-resize",
    ne: "cursor-nesw-resize",
    e:  "cursor-ew-resize",
    se: "cursor-nwse-resize",
    s:  "cursor-ns-resize",
    sw: "cursor-nesw-resize",
    w:  "cursor-ew-resize",
  };
  return map[h];
}
