"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ParsedInput } from "@/lib/tutfile";
import { INPUT_CATEGORIES, InputIcon } from "@/components/upload/input-display";

interface Props {
  inputs: ParsedInput[];
  durationMs: number;
  onChange: (inputs: ParsedInput[]) => void;
  patch?: string | null;
}

interface DragState {
  index: number;
  startX: number;
  startT: number;
  pointerId: number;
  moved: boolean;
}

const MIN_DURATION_MS = 100;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function sortByTime(inputs: ParsedInput[]): ParsedInput[] {
  return [...inputs].sort((a, b) => a.t - b.t);
}

export default function InputTimelineEditor({ inputs, durationMs, onChange, patch }: Props) {
  // durationMs 가 0/누락이면 입력 중 가장 큰 t 또는 1초 폴백
  const safeDuration = Math.max(
    MIN_DURATION_MS,
    durationMs || inputs.reduce((max, inp) => Math.max(max, inp.t), 0) + 500
  );

  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  // 입력 시퀀스가 외부에서 갱신되면(삭제 등) 선택을 유효한 범위로 보정
  useEffect(() => {
    if (selectedIdx !== null && selectedIdx >= inputs.length) {
      setSelectedIdx(null);
    }
  }, [inputs.length, selectedIdx]);

  // ── helpers ────────────────────────────────────────────────────
  const updateInput = useCallback((index: number, patch: Partial<ParsedInput>) => {
    const next = inputs.map((inp, i) => (i === index ? { ...inp, ...patch } : inp));
    onChange(next);
  }, [inputs, onChange]);

  const deleteInput = useCallback((index: number) => {
    const next = inputs.filter((_, i) => i !== index);
    onChange(next);
    setSelectedIdx(null);
  }, [inputs, onChange]);

  const insertInput = useCallback((t: number) => {
    const newInput: ParsedInput = { t: Math.round(t), category: "attack" };
    const next = sortByTime([...inputs, newInput]);
    onChange(next);
    // 새로 삽입한 입력의 인덱스 찾기
    const newIndex = next.findIndex((inp) => inp === newInput);
    setSelectedIdx(newIndex >= 0 ? newIndex : null);
  }, [inputs, onChange]);

  // ── pointer drag handlers ──────────────────────────────────────
  const onPointerDownMarker = (e: React.PointerEvent<HTMLButtonElement>, index: number) => {
    e.stopPropagation();
    e.preventDefault();
    const track = trackRef.current;
    if (!track) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      index,
      startX: e.clientX,
      startT: inputs[index].t,
      pointerId: e.pointerId,
      moved: false,
    };
    setDraggingIdx(index);
  };

  const onPointerMoveMarker = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    const track = trackRef.current;
    if (!drag || !track || drag.pointerId !== e.pointerId) return;
    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) return;
    const dx = e.clientX - drag.startX;
    const deltaMs = (dx / rect.width) * safeDuration;
    const nextT = clamp(Math.round(drag.startT + deltaMs), 0, safeDuration);
    if (Math.abs(dx) > 2) drag.moved = true;
    if (nextT !== inputs[drag.index]?.t) {
      updateInput(drag.index, { t: nextT });
    }
  };

  const onPointerUpMarker = (e: React.PointerEvent<HTMLButtonElement>, index: number) => {
    const drag = dragRef.current;
    const moved = drag?.moved ?? false;
    if (drag && drag.pointerId === e.pointerId) {
      try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
    }
    dragRef.current = null;
    setDraggingIdx(null);

    if (!moved) {
      // 드래그가 아니라 클릭으로 간주 → 선택 토글
      setSelectedIdx((prev) => (prev === index ? null : index));
    } else {
      // 드래그 종료 후 시간순으로 재정렬
      const sorted = sortByTime(inputs);
      const movedInput = inputs[index];
      const newIndex = sorted.findIndex((inp) => inp === movedInput);
      onChange(sorted);
      setSelectedIdx(newIndex >= 0 ? newIndex : index);
    }
  };

  // ── 트랙 빈 공간 클릭 → 새 입력 삽입 ────────────────────────
  const onTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // 마커 위 클릭은 onPointerUpMarker 가 처리하므로 여기는 빈 공간만
    if (e.target !== e.currentTarget) return;
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const t = clamp((x / rect.width) * safeDuration, 0, safeDuration);
    insertInput(t);
  };

  const selected = selectedIdx !== null ? inputs[selectedIdx] : null;

  return (
    <div className="flex flex-col gap-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between text-xs text-text-muted">
        <span>총 {inputs.length}개 · {(safeDuration / 1000).toFixed(2)}초</span>
        <span>마커 클릭으로 편집 · 드래그로 타이밍 조절 · 빈 공간 클릭으로 추가</span>
      </div>

      {/* 타임라인 트랙 */}
      <div className="relative">
        {/* 시간 눈금 */}
        <div className="flex justify-between text-[10px] text-text-muted mb-1 px-0.5 select-none">
          <span>0s</span>
          <span>{((safeDuration / 1000) / 2).toFixed(1)}s</span>
          <span>{(safeDuration / 1000).toFixed(1)}s</span>
        </div>

        <div
          ref={trackRef}
          onClick={onTrackClick}
          className="relative h-12 rounded-lg bg-surface-overlay border border-border cursor-crosshair"
          aria-label="입력 타임라인"
        >
          {/* 50% 가이드 */}
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-border pointer-events-none" />

          {inputs.map((input, i) => {
            const left = clamp((input.t / safeDuration) * 100, 0, 100);
            const isSelected = selectedIdx === i;
            const isDragging = draggingIdx === i;
            return (
              <button
                key={i}
                type="button"
                onPointerDown={(e) => onPointerDownMarker(e, i)}
                onPointerMove={onPointerMoveMarker}
                onPointerUp={(e) => onPointerUpMarker(e, i)}
                style={{ left: `${left}%` }}
                className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none transition-transform ${
                  isDragging ? "scale-125 z-20" : "hover:scale-110 z-10"
                } ${isSelected ? "ring-2 ring-gold ring-offset-1 ring-offset-surface-overlay rounded" : ""}`}
                title={`${input.category}${input.ref ? ` · ${input.ref}` : ""}${input.slot !== undefined ? ` · slot ${input.slot}` : ""} @ ${input.t}ms`}
              >
                <InputIcon input={input} size="sm" patch={patch} />
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택된 입력 편집 패널 */}
      {selected && selectedIdx !== null && (
        <div className="rounded-lg border border-gold/40 bg-gold/5 p-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <InputIcon input={selected} size="md" patch={patch} />
              <span className="text-xs font-bold text-text-secondary">입력 편집</span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedIdx(null)}
              className="text-xs text-text-muted hover:text-text transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* 카테고리 */}
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wide text-text-muted font-bold">카테고리</span>
              <select
                value={selected.category}
                onChange={(e) => updateInput(selectedIdx, { category: e.target.value })}
                className="h-8 px-2 rounded-md border border-border bg-surface-overlay text-xs focus:outline-none focus:border-[rgba(255,255,255,0.3)]"
              >
                {INPUT_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
                {!INPUT_CATEGORIES.some((c) => c.value === selected.category) && (
                  <option value={selected.category}>{selected.category}</option>
                )}
              </select>
            </label>

            {/* ref */}
            {(selected.category === "skill" ||
              selected.category === "item" ||
              selected.category === "summoner_spell" ||
              selected.category === "ward") && (
              <label className="flex flex-col gap-1">
                <span className="text-[10px] uppercase tracking-wide text-text-muted font-bold">참조 ID</span>
                <input
                  type="text"
                  value={selected.ref ?? ""}
                  onChange={(e) => updateInput(selectedIdx, { ref: e.target.value || undefined })}
                  placeholder={
                    selected.category === "skill" ? "RivenQ"
                    : selected.category === "item" ? "3142"
                    : selected.category === "summoner_spell" ? "SummonerFlash"
                    : ""
                  }
                  className="h-8 px-2 rounded-md border border-border bg-surface-overlay text-xs font-mono focus:outline-none focus:border-[rgba(255,255,255,0.3)]"
                />
              </label>
            )}

            {/* 타이밍 (ms) */}
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wide text-text-muted font-bold">타이밍 (ms)</span>
              <input
                type="number"
                min={0}
                max={safeDuration}
                step={10}
                value={selected.t}
                onChange={(e) => {
                  const t = clamp(Number(e.target.value) || 0, 0, safeDuration);
                  updateInput(selectedIdx, { t });
                }}
                onBlur={() => {
                  // 정렬 — 시간 변경 후 시퀀스 재정렬
                  const sorted = sortByTime(inputs);
                  const movedInput = inputs[selectedIdx];
                  const newIndex = sorted.findIndex((inp) => inp === movedInput);
                  if (newIndex !== selectedIdx) {
                    onChange(sorted);
                    setSelectedIdx(newIndex >= 0 ? newIndex : null);
                  }
                }}
                className="h-8 px-2 rounded-md border border-border bg-surface-overlay text-xs font-mono focus:outline-none focus:border-[rgba(255,255,255,0.3)]"
              />
            </label>
          </div>

          {/* slot 편집 (item/summoner_spell 용) */}
          {(selected.category === "item" || selected.category === "summoner_spell") && (
            <label className="flex flex-col gap-1">
              <span className="text-[10px] uppercase tracking-wide text-text-muted font-bold">슬롯</span>
              <input
                type="text"
                value={selected.slot?.toString() ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "") {
                    updateInput(selectedIdx, { slot: undefined });
                  } else {
                    const n = Number(v);
                    updateInput(selectedIdx, { slot: Number.isFinite(n) && /^\d+$/.test(v) ? n : v });
                  }
                }}
                placeholder={selected.category === "item" ? "1~6" : "D 또는 F"}
                className="h-8 px-2 rounded-md border border-border bg-surface-overlay text-xs font-mono focus:outline-none focus:border-[rgba(255,255,255,0.3)]"
              />
            </label>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => deleteInput(selectedIdx)}
              className="h-8 px-3 rounded-md border border-hard/40 text-hard text-xs font-bold hover:bg-hard/10 transition-colors cursor-pointer"
            >
              이 입력 삭제
            </button>
          </div>
        </div>
      )}

      {inputs.length === 0 && (
        <p className="text-xs text-text-muted text-center py-2">
          입력이 없습니다. 타임라인 빈 공간을 클릭해서 추가하세요.
        </p>
      )}
    </div>
  );
}
