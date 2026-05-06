"use client";

import { useState, useRef, useCallback, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import DifficultyPips from "@/components/shared/difficulty-pips";
import LolUploadForm from "@/components/games/lol/lol-upload-form";
import InputKeyMapper, { type MappableEntry } from "@/components/upload/input-key-mapper";
import { KeyCap, inputToKeySequence } from "@/components/shared/keycap";
import VideoEditor from "@/components/combo/video-editor";
import type { Difficulty } from "@/types";
import type { LolGameSpecific } from "@/lib/games/lol/schema";

// ── Types ────────────────────────────────────────────────────
interface Step {
  id: string;
  start: number;
  end: number;
  title: string;
  tip: string;
}

interface Combo {
  id: string;
  title: string;
  description: string | null;
  tip: string | null;
  difficulty: string;
  tags: string[];
  gameSpecific: unknown;
  inputSummary: unknown;
  steps: unknown;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  durationMs: number | null;
  status: "draft" | "published" | "featured" | "removed";
  game: { slug: string };
  character: { slug: string; name: string } | null;
}

interface ItemMeta { id: string; name: string; iconUrl: string }

interface Props {
  combo: Combo;
  items: ItemMeta[];
  patch: string;
}

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const LOL_CATEGORIES = ["skill", "attack", "attack_cancel", "item", "summoner_spell", "recall", "ward"] as const;

// ── Helpers ───────────────────────────────────────────────────
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

function AiBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gold/15 text-gold text-xs font-bold">
      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/></svg>
      AI
    </span>
  );
}

function fieldCls(highlight: boolean) {
  return `h-10 px-3 rounded-lg border bg-surface-overlay text-sm focus:outline-none transition-colors ${
    highlight ? "border-gold/40 focus:border-gold/60" : "border-border focus:border-[rgba(255,255,255,0.3)]"
  }`;
}

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

// ── 인라인 아이템 픽커 (시퀀스 편집 시 슬롯별 아이템 선택) ────
function InlineItemPicker({ items, current, onSelect }: {
  items: ItemMeta[];
  current?: string;
  onSelect: (id: string | undefined) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen]   = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentItem = items.find((i) => i.id === current);
  const filtered = query.trim().length >= 1
    ? items.filter((i) =>
        i.name.toLowerCase().includes(query.toLowerCase()) ||
        i.id.includes(query)
      ).slice(0, 6)
    : [];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative w-44 shrink-0">
      {currentItem ? (
        <div className="flex items-center gap-1.5 h-7 px-1.5 rounded-md border border-border bg-surface-raised">
          <Image src={currentItem.iconUrl} alt={currentItem.name} width={18} height={18} sizes="18px" className="rounded-sm shrink-0" />
          <span className="text-[11px] font-semibold truncate flex-1">{currentItem.name}</span>
          <button
            type="button"
            onClick={() => { onSelect(undefined); setQuery(""); }}
            className="text-text-muted hover:text-text text-xs shrink-0 cursor-pointer"
          >×</button>
        </div>
      ) : (
        <input
          type="text"
          value={query}
          placeholder="아이템 선택..."
          onChange={(e) => { setQuery(e.target.value); setOpen(e.target.value.trim().length >= 1); }}
          onFocus={() => query.trim().length >= 1 && setOpen(true)}
          className="w-full h-7 px-2 rounded-md border border-border bg-surface-raised text-[11px] focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
        />
      )}
      {open && filtered.length > 0 && (
        <ul className="absolute z-30 mt-1 w-64 rounded-lg border border-border bg-surface-overlay shadow-lg overflow-hidden">
          {filtered.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); onSelect(item.id); setQuery(""); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-surface-raised transition-colors cursor-pointer"
              >
                <Image src={item.iconUrl} alt={item.name} width={20} height={20} sizes="20px" className="rounded-sm shrink-0" />
                <span className="truncate">{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// 입력이 "아이템 슬롯" 으로 다뤄져야 하는지 판정.
//  - category === "item"               → 명시적 아이템
//  - category === "key" 이고 ref 가 1~6 → 오버레이 녹화 시 매핑되지 않은 숫자키
function isItemSlotInput(inp: MappableEntry): { isItem: boolean; slot?: number } {
  if (inp.category === "item") {
    const slot = typeof inp.slot === "number" ? inp.slot : Number(inp.slot);
    return { isItem: true, slot: Number.isFinite(slot) ? slot : undefined };
  }
  if (inp.category === "key" && typeof inp.ref === "string" && /^[1-6]$/.test(inp.ref)) {
    return { isItem: true, slot: Number(inp.ref) };
  }
  return { isItem: false };
}

// ── SequenceEditor ────────────────────────────────────────────
function SequenceEditor({ inputs, onChange, characterSlug, items, patch }: {
  inputs: MappableEntry[];
  onChange: (v: MappableEntry[]) => void;
  characterSlug: string;
  items: ItemMeta[];
  patch: string;
}) {
  const [addCategory, setAddCategory] = useState<string>("skill");
  const [addSkill, setAddSkill]       = useState<"Q" | "W" | "E" | "R">("Q");
  const [addItemSlot, setAddItemSlot] = useState<number>(1);
  const [addSpellSlot, setAddSpellSlot] = useState<"D" | "F">("D");

  const move = (i: number, dir: -1 | 1) => {
    const next = [...inputs];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  const remove = (i: number) => onChange(inputs.filter((_, idx) => idx !== i));

  // 아이템 슬롯 입력의 ref 를 설정. 'key' 카테고리였다면 'item' 으로 승격.
  const setItemRef = (i: number, slot: number | undefined, ref: string | undefined) => {
    onChange(
      inputs.map((inp, idx) => {
        if (idx !== i) return inp;
        let resolvedSlot: number | string | undefined = slot;
        if (resolvedSlot === undefined) {
          if (typeof inp.slot === "number" || typeof inp.slot === "string") {
            resolvedSlot = inp.slot;
          } else if (typeof inp.ref === "string" && /^[1-6]$/.test(inp.ref)) {
            resolvedSlot = Number(inp.ref);
          }
        }
        return { ...inp, category: "item", slot: resolvedSlot, ref };
      }),
    );
  };

  const add = () => {
    let entry: MappableEntry;
    if (addCategory === "skill") {
      const champSlug = characterSlug.charAt(0).toUpperCase() + characterSlug.slice(1);
      entry = { category: "skill", ref: `${champSlug}${addSkill}` };
    } else if (addCategory === "item") {
      entry = { category: "item", slot: addItemSlot };
    } else if (addCategory === "summoner_spell") {
      entry = { category: "summoner_spell", slot: addSpellSlot };
    } else {
      entry = { category: addCategory };
    }
    onChange([...inputs, entry]);
  };

  const sequenceKeys = inputToKeySequence(inputs.map(({ category, ref, slot }) => ({ category, ref, slot })));

  const categoryLabel = (inp: MappableEntry) => {
    if (inp.category === "skill")           return `스킬 (${inp.ref ?? ""})`;
    if (inp.category === "attack")          return "평타 (AA)";
    if (inp.category === "attack_cancel")   return "평캔 (AA Cancel)";
    if (inp.category === "item")            return `아이템 슬롯 ${inp.slot ?? ""}`;
    if (inp.category === "summoner_spell")  return `소환사 주문 ${inp.slot ?? ""}`;
    return inp.category;
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Current sequence preview */}
      {sequenceKeys.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          {sequenceKeys.map((k, i) => (
            <KeyCap key={i} label={k.label} variant={k.variant} size="sm" />
          ))}
        </div>
      )}

      {/* Input list */}
      {inputs.length === 0 ? (
        <p className="text-xs text-text-muted py-2">시퀀스가 비어 있습니다. 아래에서 입력을 추가하세요.</p>
      ) : (
        <div className="flex flex-col gap-1 max-h-72 overflow-y-auto">
          {inputs.map((inp, i) => {
            const itemMeta = isItemSlotInput(inp);
            return (
              <div key={i} className="flex items-center gap-2 h-9 px-3 rounded-lg bg-surface-overlay border border-border">
                <span className="text-[10px] font-mono text-text-muted w-6 shrink-0">#{i}</span>
                <KeyCap label={sequenceKeys[i]?.label ?? "?"} variant={sequenceKeys[i]?.variant} size="sm" />
                {itemMeta.isItem ? (
                  <>
                    <span className="text-xs text-text-secondary shrink-0">아이템 슬롯 {itemMeta.slot ?? "?"}</span>
                    <InlineItemPicker
                      items={items}
                      current={typeof inp.ref === "string" ? inp.ref : undefined}
                      onSelect={(id) => setItemRef(i, itemMeta.slot, id)}
                    />
                  </>
                ) : (
                  <span className="flex-1 text-xs text-text-secondary truncate">{categoryLabel(inp)}</span>
                )}
                <div className="flex gap-1 shrink-0 ml-auto">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0}
                    className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-text disabled:opacity-30 transition-colors text-xs">↑</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === inputs.length - 1}
                    className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-text disabled:opacity-30 transition-colors text-xs">↓</button>
                  <button type="button" onClick={() => remove(i)}
                    className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-hard transition-colors text-xs">×</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add input */}
      <div className="border-t border-border pt-3 flex flex-col gap-2">
        <p className="text-xs font-semibold text-text-secondary">입력 추가</p>
        <div className="flex gap-2 flex-wrap">
          <select value={addCategory} onChange={(e) => setAddCategory(e.target.value)}
            className="h-8 px-2 rounded-lg border border-border bg-surface-overlay text-xs focus:outline-none">
            {LOL_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {addCategory === "skill" && (
            <div className="flex gap-1">
              {(["Q", "W", "E", "R"] as const).map((k) => (
                <button key={k} type="button" onClick={() => setAddSkill(k)}
                  className={`w-8 h-8 rounded-lg border text-xs font-bold transition-colors ${addSkill === k ? "border-gold text-gold bg-gold/10" : "border-border text-text-secondary hover:text-text"}`}>
                  {k}
                </button>
              ))}
            </div>
          )}

          {addCategory === "item" && (
            <select value={addItemSlot} onChange={(e) => setAddItemSlot(Number(e.target.value))}
              className="h-8 px-2 rounded-lg border border-border bg-surface-overlay text-xs focus:outline-none">
              {[1,2,3,4,5,6].map((n) => <option key={n} value={n}>슬롯 {n}</option>)}
            </select>
          )}

          {addCategory === "summoner_spell" && (
            <div className="flex gap-1">
              {(["D", "F"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setAddSpellSlot(s)}
                  className={`w-8 h-8 rounded-lg border text-xs font-bold transition-colors ${addSpellSlot === s ? "border-gold text-gold bg-gold/10" : "border-border text-text-secondary hover:text-text"}`}>
                  {s}
                </button>
              ))}
            </div>
          )}

          <button type="button" onClick={add}
            className="h-8 px-3 rounded-lg bg-surface-overlay border border-border text-xs font-bold hover:border-[rgba(255,255,255,0.24)] transition-colors">
            + 추가
          </button>
        </div>
      </div>

      <div className="border-t border-border pt-3">
        <InputKeyMapper inputs={inputs} items={items} patch={patch} onChange={onChange} />
        {inputs.filter(i => i.category === "item" || i.category === "summoner_spell").length === 0 && (
          <p className="text-xs text-text-muted px-1">아이템·소환사 주문 입력이 없습니다. 위에서 추가하면 여기서 세부 설정이 가능합니다.</p>
        )}
      </div>
    </div>
  );
}

// ── StepsEditor (input-index based) ───────────────────────────
//
// Step.start/end 는 ms 로 저장되지만 UI 는 input 인덱스 기준.
// inputSummary 는 t 가 없으므로 durationMs 를 N 등분해 synthetic 한 t 를
// 계산한다. 진짜 t 가 있으면 그대로 사용.
//
// 변환 규칙:
//   load: ms → idx via 가장 가까운 (또는 첫 ≥) 입력
//   save: idx → ms = inputs[idx].t (end 는 next input.t 또는 +꼬리)
//
// 입력이 없는 콤보(legacy)에서는 ms 모드로 폴백.
const TAIL_MS = 200;

interface MappableTimedEntry extends MappableEntry {
  t?: number;
}

function inputTimes(inputs: MappableTimedEntry[], durationMs: number): number[] {
  const N = inputs.length;
  if (N === 0) return [];
  const hasReal = inputs.some((i) => typeof i.t === "number");
  if (hasReal) return inputs.map((i, idx) => (typeof i.t === "number" ? i.t : Math.round((idx * durationMs) / Math.max(1, N))));
  // Synthetic 균등 분할 — durationMs 를 (N) 분할하고 각 입력은 그 시작점
  const span = Math.max(durationMs, 100);
  return inputs.map((_, idx) => Math.round((idx * span) / Math.max(1, N)));
}

function msToIdx(ms: number, times: number[]): number {
  if (times.length === 0) return 0;
  // 가장 가까운 인덱스
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < times.length; i++) {
    const d = Math.abs(times[i] - ms);
    if (d < bestDist) { bestDist = d; bestIdx = i; }
  }
  return bestIdx;
}

function startIdxToMs(idx: number, times: number[]): number {
  return times[idx] ?? 0;
}

function endIdxToMs(idx: number, times: number[], durationMs: number): number {
  const cur = times[idx] ?? 0;
  const next = times[idx + 1];
  if (typeof next === "number") return next;
  return Math.max(cur + TAIL_MS, durationMs);
}

function StepsEditor({ steps, onChange, inputs, durationMs }: {
  steps: Step[];
  onChange: (v: Step[]) => void;
  inputs: MappableTimedEntry[];
  durationMs: number;
}) {
  const hasInputs = inputs.length > 0;
  const times = hasInputs ? inputTimes(inputs, durationMs) : [];
  const sequenceKeys = inputToKeySequence(inputs.map(({ category, ref, slot }) => ({ category, ref, slot })));

  const addStep = () => {
    if (hasInputs) {
      const lastEndIdx = steps.length > 0 ? msToIdx(steps[steps.length - 1].end, times) : -1;
      const fromIdx = Math.min(inputs.length - 1, lastEndIdx + 1);
      const toIdx   = Math.min(inputs.length - 1, fromIdx + 2);
      onChange([
        ...steps,
        {
          id:    Math.random().toString(36).slice(2),
          start: startIdxToMs(fromIdx, times),
          end:   endIdxToMs(toIdx, times, durationMs),
          title: `${steps.length + 1}단계`,
          tip:   "",
        },
      ]);
    } else {
      // Legacy ms-only 폴백
      const lastEnd = steps.length > 0 ? steps[steps.length - 1].end : 0;
      onChange([
        ...steps,
        {
          id:    Math.random().toString(36).slice(2),
          start: lastEnd,
          end:   Math.max(lastEnd + 500, durationMs),
          title: `${steps.length + 1}단계`,
          tip:   "",
        },
      ]);
    }
  };

  const updateRange = (id: string, fromIdx: number, toIdx: number) => {
    const safeFrom = Math.max(0, Math.min(inputs.length - 1, fromIdx));
    const safeTo   = Math.max(safeFrom, Math.min(inputs.length - 1, toIdx));
    onChange(
      steps.map((s) =>
        s.id === id
          ? { ...s, start: startIdxToMs(safeFrom, times), end: endIdxToMs(safeTo, times, durationMs) }
          : s,
      ),
    );
  };

  const updateField = (id: string, field: "title" | "tip", value: string) => {
    onChange(steps.map((s) => s.id === id ? { ...s, [field]: value } : s));
  };

  const remove = (id: string) => onChange(steps.filter((s) => s.id !== id));

  if (!hasInputs) {
    // Fallback: 시간 기반 입력이 없는 legacy 콤보 — 기존 ms 단위 UI 유지
    return (
      <div className="flex flex-col gap-3">
        <p className="text-xs text-text-muted">입력 타이밍 정보가 없어 시간(ms) 기준으로 편집합니다.</p>
        {steps.length === 0 ? (
          <p className="text-xs text-text-muted">구간이 없습니다.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col gap-2 p-3 rounded-lg bg-surface-overlay border border-border">
                <div className="flex items-center gap-2">
                  <input type="number" min={0} value={step.start}
                    onChange={(e) => onChange(steps.map((s) => s.id === step.id ? { ...s, start: Number(e.target.value) || 0 } : s))}
                    className="w-20 h-7 px-2 rounded border border-border bg-surface-raised text-xs text-center focus:outline-none" />
                  <span className="text-xs text-text-muted">→</span>
                  <input type="number" min={0} value={step.end}
                    onChange={(e) => onChange(steps.map((s) => s.id === step.id ? { ...s, end: Number(e.target.value) || 0 } : s))}
                    className="w-20 h-7 px-2 rounded border border-border bg-surface-raised text-xs text-center focus:outline-none" />
                  <span className="text-xs text-text-muted">ms</span>
                  <input type="text" value={step.title}
                    onChange={(e) => updateField(step.id, "title", e.target.value)}
                    placeholder="구간 이름"
                    className="flex-1 h-7 px-2 rounded border border-border bg-surface-raised text-xs focus:outline-none" />
                  <button type="button" onClick={() => remove(step.id)}
                    className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-hard transition-colors text-sm shrink-0">×</button>
                </div>
                <input type="text" value={step.tip}
                  onChange={(e) => updateField(step.id, "tip", e.target.value)}
                  placeholder="이 구간 팁 (선택)"
                  className="h-7 px-2 rounded border border-border bg-surface-raised text-xs focus:outline-none" />
              </div>
            ))}
          </div>
        )}
        <button type="button" onClick={addStep}
          className="h-8 rounded-lg border border-dashed border-border text-xs font-semibold text-text-secondary hover:border-[rgba(255,255,255,0.24)] hover:text-text transition-colors">
          + 구간 추가
        </button>
      </div>
    );
  }

  const maxIdx = inputs.length - 1;

  return (
    <div className="flex flex-col gap-3">
      {steps.length === 0 ? (
        <p className="text-xs text-text-muted">구간이 없습니다. 추가하면 콤보를 단계별로 나눌 수 있습니다.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {steps.map((step, sIdx) => {
            const fromIdx = msToIdx(step.start, times);
            const toIdx   = msToIdx(Math.max(step.start, step.end - 1), times);
            const safeTo  = Math.max(fromIdx, toIdx);
            const previewKeys = sequenceKeys.slice(fromIdx, safeTo + 1);

            return (
              <div key={step.id} className="flex flex-col gap-2 p-3 rounded-lg bg-surface-overlay border border-border">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-gold shrink-0">Step {sIdx + 1}</span>
                  <input type="text" value={step.title}
                    onChange={(e) => updateField(step.id, "title", e.target.value)}
                    placeholder="구간 이름"
                    className="flex-1 min-w-[120px] h-7 px-2 rounded border border-border bg-surface-raised text-xs focus:outline-none focus:border-[rgba(255,255,255,0.3)]" />
                  <button type="button" onClick={() => remove(step.id)}
                    className="w-6 h-6 flex items-center justify-center text-text-muted hover:text-hard transition-colors text-sm shrink-0">×</button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] uppercase tracking-wide text-text-muted font-bold">입력</span>
                  <span className="text-xs text-text-muted">#</span>
                  <input
                    type="number" min={0} max={maxIdx} step={1} value={fromIdx}
                    onChange={(e) => updateRange(step.id, Number(e.target.value) || 0, safeTo)}
                    className="w-14 h-7 px-2 rounded border border-border bg-surface-raised text-xs text-center font-mono focus:outline-none focus:border-[rgba(255,255,255,0.3)]"
                  />
                  <span className="text-xs text-text-muted">~ #</span>
                  <input
                    type="number" min={fromIdx} max={maxIdx} step={1} value={safeTo}
                    onChange={(e) => updateRange(step.id, fromIdx, Number(e.target.value) || fromIdx)}
                    className="w-14 h-7 px-2 rounded border border-border bg-surface-raised text-xs text-center font-mono focus:outline-none focus:border-[rgba(255,255,255,0.3)]"
                  />
                  <span className="text-[10px] text-text-muted ml-1">
                    ({(step.start / 1000).toFixed(2)}s → {(step.end / 1000).toFixed(2)}s)
                  </span>
                </div>

                {previewKeys.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap pt-1">
                    {previewKeys.map((k, i) => (
                      <KeyCap key={i} label={k.label} variant={k.variant} size="sm" />
                    ))}
                  </div>
                )}

                <input type="text" value={step.tip}
                  onChange={(e) => updateField(step.id, "tip", e.target.value)}
                  placeholder="이 구간 팁 (선택)"
                  className="h-7 px-2 rounded border border-border bg-surface-raised text-xs focus:outline-none focus:border-[rgba(255,255,255,0.3)]" />
              </div>
            );
          })}
        </div>
      )}
      <button type="button" onClick={addStep}
        className="h-8 rounded-lg border border-dashed border-border text-xs font-semibold text-text-secondary hover:border-[rgba(255,255,255,0.24)] hover:text-text transition-colors">
        + 구간 추가
      </button>
    </div>
  );
}

// ── ComboEditForm ─────────────────────────────────────────────
export default function ComboEditForm({ combo, items, patch }: Props) {
  const router = useRouter();

  const [title,       setTitle]       = useState(combo.title);
  const [description, setDescription] = useState(combo.description ?? "");
  const [tip,         setTip]         = useState(combo.tip ?? "");
  const [inputSummary, setInputSummary] = useState<MappableEntry[]>(
    (combo.inputSummary as MappableEntry[]) ?? []
  );
  const [steps, setSteps] = useState<Step[]>(() => {
    const raw = combo.steps as Array<{ start: number; end: number; title: string; tip?: string }> | null;
    if (!Array.isArray(raw)) return [];
    return raw.map((s) => ({ ...s, tip: s.tip ?? "", id: Math.random().toString(36).slice(2) }));
  });
  const [difficulty, setDifficulty] = useState<Difficulty>((combo.difficulty as Difficulty) ?? "medium");
  const [tagsInput,  setTagsInput]  = useState(combo.tags.join(", "));
  const [gameSpecific, setGameSpecific] = useState<Partial<LolGameSpecific>>(
    (combo.gameSpecific as Partial<LolGameSpecific>) ?? {}
  );

  // Media
  const [newThumbnailFile, setNewThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(combo.thumbnailUrl);
  const [newVideoFile,     setNewVideoFile]     = useState<File | null>(null);
  const [videoSrc,         setVideoSrc]         = useState<string | null>(null);
  const [showVideoEditor,  setShowVideoEditor]  = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef     = useRef<HTMLInputElement>(null);

  // Editing toggles
  const [seqEditMode, setSeqEditMode] = useState(false);

  // AI
  const [aiPending, startAiTransition] = useTransition();
  const [aiError,        setAiError]       = useState<string | null>(null);
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    return () => { if (videoSrc) URL.revokeObjectURL(videoSrc); };
  }, [videoSrc]);

  const handleThumbnailFile = (f: File) => {
    setNewThumbnailFile(f);
    setThumbnailPreview(URL.createObjectURL(f));
  };

  const handleVideoFile = (f: File) => {
    if (videoSrc) URL.revokeObjectURL(videoSrc);
    setNewVideoFile(f);
    setVideoSrc(URL.createObjectURL(f));
    setShowVideoEditor(true);
  };

  const handleVideoDone = useCallback((blob: Blob, ext: string) => {
    if (videoSrc) URL.revokeObjectURL(videoSrc);
    const processed = new File([blob], `video.${ext}`, { type: blob.type });
    setNewVideoFile(processed);
    setVideoSrc(URL.createObjectURL(processed));
    setShowVideoEditor(false);
  }, [videoSrc]);

  // ── AI autofill ─────────────────────────────────────────────
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
        title: string; description: string; difficulty: Difficulty;
        tags: string[]; required_level: number | null;
        ability_haste_min: number | null; attack_speed_min: number | null;
        detected_items: string[]; detected_spells: string[];
      };
      const filled = new Set<string>();
      if (data.title)       { setTitle(data.title);                   filled.add("title"); }
      if (data.description) { setDescription(data.description);       filled.add("description"); }
      if (data.difficulty)  { setDifficulty(data.difficulty);         filled.add("difficulty"); }
      if (data.tags?.length){ setTagsInput(data.tags.join(", "));     filled.add("tags"); }

      if (combo.game.slug === "lol") {
        const hasConditions = data.required_level || data.ability_haste_min || data.attack_speed_min
          || data.detected_items?.length || data.detected_spells?.length;
        if (hasConditions) {
          setGameSpecific((prev) => ({
            ...prev,
            ...(data.required_level     && { required_level:    data.required_level! }),
            ...(data.ability_haste_min  && { ability_haste_min: data.ability_haste_min! }),
            ...(data.attack_speed_min   && { attack_speed_min:  data.attack_speed_min! }),
            ...(data.detected_items?.length   && { required_items:  data.detected_items }),
            ...(data.detected_spells?.length  && { summoner_spells: data.detected_spells }),
          }));
          filled.add("lol_conditions");
        }
      }
      setAiFilledFields(filled);
    });
  };

  // ── Submit ───────────────────────────────────────────────────
  type SaveAction = "save" | "publish";
  const [savingAction, setSavingAction] = useState<SaveAction | null>(null);
  const [error,  setError]  = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isBusy = savingAction !== null || deleting;

  const persist = async (action: SaveAction) => {
    if (!title.trim()) { setError("제목을 입력해주세요."); return; }
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    setSavingAction(action);
    setError(null);
    try {
      let newThumbnailUrl: string | undefined;
      let newVideoUrl: string | undefined;
      if (newThumbnailFile) newThumbnailUrl = await uploadFile(newThumbnailFile, "thumbnails");
      if (newVideoFile)     newVideoUrl     = await uploadFile(newVideoFile, "videos");

      const stepsPayload = steps.map(({ start, end, title: t, tip: tp }) => ({ start, end, title: t, tip: tp }));

      // status: 'publish' 액션은 published, 'save' 액션은 현재 상태 유지
      // (현재 draft → 그대로 draft, published/featured → 그대로 published/featured)
      // featured 콤보는 어드민 영역이므로 사용자 PATCH로 status 보내지 않음
      const sendStatus =
        action === "publish"
          ? "published"
          : combo.status === "draft"
          ? "draft"
          : undefined;

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
          steps: stepsPayload,
          ...(newThumbnailUrl && { thumbnailUrl: newThumbnailUrl }),
          ...(newVideoUrl     && { videoUrl: newVideoUrl }),
          ...(sendStatus !== undefined && { status: sendStatus }),
        }),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        setError(json.error ?? "저장에 실패했습니다.");
        setSavingAction(null);
        return;
      }

      if (action === "publish") {
        // 공개 게시 후엔 상세 페이지로
        router.push(`/combos/${combo.id}`);
      } else {
        // draft 유지 저장 — 페이지 갱신해 최신 상태 반영
        router.refresh();
        setSavingAction(null);
      }
    } catch {
      setError("저장 중 오류가 발생했습니다.");
      setSavingAction(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 폼 기본 submit (Enter 키 등) — 기본 액션은 "저장"
    void persist("save");
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/combos/${combo.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        setError(json.error ?? "삭제에 실패했습니다.");
        setDeleting(false);
        setConfirmDelete(false);
        return;
      }
      router.push("/library");
    } catch {
      setError("삭제 중 오류가 발생했습니다.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const isAiFilled = aiFilledFields.size > 0;
  const durationSec = combo.durationMs ? combo.durationMs / 1000 : 0;
  // durationSec is still used in the input sequence header summary below

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* ── 입력 시퀀스 ──────────────────────────────── */}
      <div className="bg-surface-raised rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">입력 시퀀스</p>
            <p className="text-xs text-text-muted mt-0.5">총 {inputSummary.length}개 입력{combo.durationMs ? ` · ${durationSec.toFixed(1)}초` : ""}</p>
          </div>
          <button type="button" onClick={() => setSeqEditMode((v) => !v)}
            className={`h-7 px-3 rounded-lg border text-xs font-semibold transition-colors ${seqEditMode ? "border-gold/40 text-gold bg-gold/10" : "border-border text-text-secondary hover:text-text"}`}>
            {seqEditMode ? "편집 완료" : "시퀀스 편집"}
          </button>
        </div>

        <div className="px-5 pb-5">
          {seqEditMode ? (
            <SequenceEditor
              inputs={inputSummary}
              onChange={setInputSummary}
              characterSlug={combo.character?.slug ?? ""}
              items={items}
              patch={patch}
            />
          ) : (
            <>
              {inputSummary.length > 0 ? (
                <>
                  <div className="flex items-center gap-1 flex-wrap">
                    {inputToKeySequence(inputSummary).map((k, i) => (
                      <KeyCap key={i} label={k.label} variant={k.variant} size="sm" />
                    ))}
                  </div>
                  {combo.game.slug === "lol" && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-1">슬롯 매핑</p>
                      <p className="text-xs text-text-muted mb-3">아이템·소환사 주문 슬롯을 실제 아이템으로 설정하세요</p>
                      <InputKeyMapper inputs={inputSummary} items={items} patch={patch} onChange={setInputSummary} />
                      {inputSummary.filter(i => i.category === "item" || i.category === "summoner_spell").length === 0 && (
                        <p className="text-xs text-text-muted">아이템·소환사 주문 입력이 없습니다. &quot;시퀀스 편집&quot;에서 추가할 수 있습니다.</p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-text-muted">저장된 입력 시퀀스가 없습니다. &quot;시퀀스 편집&quot;으로 추가하세요.</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── 구간 (스텝) ───────────────────────────────── */}
      <div className="bg-surface-raised rounded-xl border border-border p-5">
        <p className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-1">구간 나누기 (스텝)</p>
        <p className="text-xs text-text-muted mb-4">입력 인덱스 범위로 구간을 지정하세요. 저장 시 자동으로 ms 로 변환됩니다.</p>
        <StepsEditor steps={steps} onChange={setSteps} inputs={inputSummary} durationMs={combo.durationMs ?? 0} />
      </div>

      {/* ── AI 자동 완성 ──────────────────────────────── */}
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
                  ? `제목·설명·난이도·태그·LoL 조건 자동 입력 — 수정 후 저장하세요`
                  : `${combo.character.name} 콤보를 분석해 제목·설명·난이도·태그·스킬가속·조건을 자동으로 채워줍니다`}
              </p>
            </div>
          </div>
          <button type="button" onClick={handleAiAutofill} disabled={aiPending}
            className={`shrink-0 h-9 px-4 rounded-lg text-sm font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap ${isAiFilled ? "border border-gold/40 text-gold hover:bg-gold/10" : "bg-gold text-white hover:bg-gold-light"}`}>
            {aiPending ? (
              <span className="flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="animate-spin"><path d="M12 3v3m0 12v3M3 12h3m12 0h3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>
                분석 중...
              </span>
            ) : isAiFilled ? "다시 생성" : "자동 완성"}
          </button>
        </div>
      )}
      {aiError && <p className="text-xs text-hard -mt-3">{aiError}</p>}

      {/* ── 미디어 ────────────────────────────────────── */}
      <div className="bg-surface-raised rounded-xl p-5 border border-border flex flex-col gap-5">
        <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary">미디어</h2>

        {/* Thumbnail */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">썸네일</span>
            <button type="button" onClick={() => thumbnailInputRef.current?.click()}
              className="text-xs font-semibold text-text-secondary hover:text-text transition-colors">
              이미지 선택
            </button>
          </div>
          <input ref={thumbnailInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleThumbnailFile(e.target.files[0])} />
          {thumbnailPreview ? (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-surface-overlay cursor-pointer"
              onClick={() => thumbnailInputRef.current?.click()}>
              <Image src={thumbnailPreview} alt="썸네일" fill sizes="672px" className="object-cover" />
              {newThumbnailFile && (
                <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-xs font-semibold text-white">변경됨</div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <span className="text-xs font-semibold text-white">클릭해서 변경</span>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => thumbnailInputRef.current?.click()}
              className="w-full h-20 rounded-lg border border-dashed border-border bg-surface-overlay flex items-center justify-center text-sm text-text-muted hover:border-[rgba(255,255,255,0.24)] hover:text-text transition-colors">
              + 썸네일 이미지 선택
            </button>
          )}
        </div>

        {/* Video */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">영상 <span className="text-text-muted text-xs font-normal">(mp4 / webm)</span></span>
            {videoSrc && !showVideoEditor && (
              <button type="button" onClick={() => setShowVideoEditor(true)}
                className="text-xs font-semibold text-gold hover:text-gold-light transition-colors">편집 (Trim/Crop)</button>
            )}
          </div>
          <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleVideoFile(e.target.files[0])} />

          {/* 우선: 새로 선택한 파일 미리보기 → 없으면 기존 영상 → 없으면 빈 상태 */}
          {videoSrc ? (
            <video
              src={videoSrc}
              controls
              className="w-full max-h-[400px] rounded-lg border border-border bg-black"
            >
              영상을 재생할 수 없습니다.
            </video>
          ) : combo.videoUrl ? (
            <video
              src={combo.videoUrl}
              controls
              preload="metadata"
              className="w-full max-h-[400px] rounded-lg border border-border bg-black"
            >
              영상을 재생할 수 없습니다.
            </video>
          ) : (
            <div className="w-full h-32 rounded-lg border border-dashed border-border bg-surface-overlay flex items-center justify-center text-sm text-text-muted">
              영상 없음 — 오버레이에서 녹화 후 아래에서 업로드하세요
            </div>
          )}

          {newVideoFile && (
            <div className="flex items-center gap-2 px-3 h-8 rounded-md bg-gold/10 border border-gold/30 text-xs">
              <span className="text-gold font-bold shrink-0">새 파일</span>
              <span className="flex-1 truncate">{newVideoFile.name}</span>
              <span className="text-text-muted shrink-0">{(newVideoFile.size / 1024 / 1024).toFixed(1)} MB</span>
            </div>
          )}

          {/* 교체 / 업로드는 보조 액션 — 플레이어 아래 작은 버튼 */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="text-xs font-semibold text-text-muted hover:text-text transition-colors"
            >
              {combo.videoUrl || newVideoFile ? "다른 영상으로 교체" : "영상 업로드"}
            </button>
          </div>

          {showVideoEditor && videoSrc && (
            <VideoEditor
              src={videoSrc}
              onDone={handleVideoDone}
              onCancel={() => setShowVideoEditor(false)}
            />
          )}
        </div>
      </div>

      {/* ── 기본 정보 ─────────────────────────────────── */}
      <div className="bg-surface-raised rounded-xl p-5 border border-border flex flex-col gap-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary">기본 정보</h2>

        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-sm font-semibold">
            제목 <span className="text-hard">*</span>{aiFilledFields.has("title") && <AiBadge />}
          </span>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            required maxLength={100} className={fieldCls(aiFilledFields.has("title"))} />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-sm font-semibold">
            콤보 설명 {aiFilledFields.has("description") && <AiBadge />}
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
            난이도 {aiFilledFields.has("difficulty") && <AiBadge />}
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
            태그 {aiFilledFields.has("tags") && <AiBadge />}
          </span>
          <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)}
            placeholder="쉼표로 구분 (예: 풀콤보, 라인전)"
            className={fieldCls(aiFilledFields.has("tags"))} />
          <p className="text-xs text-text-muted">쉼표(,)로 태그를 구분하세요</p>
        </label>
      </div>

      {/* ── LoL 조건 ──────────────────────────────────── */}
      {combo.game.slug === "lol" && (
        <div className={`rounded-xl border overflow-hidden transition-colors ${aiFilledFields.has("lol_conditions") ? "border-gold/40" : "border-border"}`}>
          {aiFilledFields.has("lol_conditions") && (
            <div className="flex items-center gap-2 px-5 py-2.5 bg-gold/5 border-b border-gold/20">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-gold"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/></svg>
              <span className="text-xs text-gold font-semibold">AI가 콤보에서 조건을 자동 추출했습니다 — 확인 후 저장하세요</span>
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

      {/* ── 액션 버튼 ─────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* 좌측: 삭제 */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isBusy}
            className={`h-10 px-4 rounded-lg border text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              confirmDelete
                ? "border-hard/50 bg-hard/10 text-hard hover:bg-hard/20"
                : "border-border text-text-secondary hover:bg-surface-overlay hover:text-text"
            }`}
          >
            {deleting ? "삭제 중..." : confirmDelete ? "정말 삭제?" : "삭제"}
          </button>
          {confirmDelete && !deleting && (
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="h-10 px-4 rounded-lg border border-border text-sm font-semibold text-text-secondary hover:bg-surface-overlay hover:text-text transition-colors"
            >
              취소
            </button>
          )}
        </div>

        {/* 우측: 저장 / 공개 게시 */}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => persist("save")}
            disabled={isBusy}
            className="h-10 px-5 rounded-lg border border-border text-sm font-semibold text-text-secondary hover:bg-surface-overlay hover:text-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingAction === "save"
              ? "저장 중..."
              : combo.status === "draft"
              ? "저장 (draft 유지)"
              : "저장"}
          </button>
          <button
            type="button"
            onClick={() => persist("publish")}
            disabled={isBusy}
            className="h-10 px-6 rounded-lg bg-gold text-white text-sm font-bold hover:bg-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingAction === "publish"
              ? "게시 중..."
              : combo.status === "draft"
              ? "공개 게시"
              : "저장 후 보기"}
          </button>
        </div>
      </div>

      {/* 공개 페이지 링크 (published / featured 만) */}
      {(combo.status === "published" || combo.status === "featured") && (
        <div className="flex justify-end -mt-2">
          <Link
            href={`/combos/${combo.id}`}
            className="text-xs font-semibold text-text-muted hover:text-text transition-colors"
          >
            공개 페이지 보기 →
          </Link>
        </div>
      )}
    </form>
  );
}
