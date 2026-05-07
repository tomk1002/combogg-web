"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import DifficultyPips from "@/components/shared/difficulty-pips";
import LolUploadForm from "@/components/games/lol/lol-upload-form";
import { type MappableEntry } from "@/components/upload/input-key-mapper";
import { getSummonerSpellIconUrl } from "@/lib/games/lol/ddragon";
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

const STEP_MARKER = "step_marker";

// 소환사 주문 한국어 라벨 — palette 표시용
const SUMMONER_SPELL_LABELS: Record<string, string> = {
  SummonerFlash:    "점멸",
  SummonerDot:      "점화",
  SummonerExhaust:  "탈진",
  SummonerHaste:    "유체화",
  SummonerHeal:     "회복",
  SummonerBarrier:  "방어막",
  SummonerSmite:    "강타",
  SummonerTeleport: "순간이동",
};

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

// ── Sequence entry types ──────────────────────────────────────
//
// 시퀀스는 일반 입력(category=skill/attack/...)과 step marker(category='step_marker')
// 두 종류를 같은 배열에 섞어서 다룬다. 저장 시 step_marker 들을 분리해
// inputSummary(입력만) + steps(start/end/title/tip) 로 변환한다.
//
// MappableEntry 자체에는 `t` 가 없지만 .tutfile 파싱 결과(원본 inputs)에는
// 있을 수 있으므로 `MappableTimedEntry` 로 다룬다 (있으면 사용, 없으면 무시).

type SeqEntry = MappableEntry & {
  t?: number;
  // step_marker 전용
  title?: string;
  tip?: string;
  // 안정적 React key (특히 step_marker — 순서 변경 시 popover 상태 안정)
  _id?: string;
};

function isStepMarker(e: SeqEntry): boolean {
  return e.category === STEP_MARKER;
}

function chipVariantClass(category: string): string {
  switch (category) {
    case "skill":          return "bg-blue-600/20 border-blue-500/40 text-blue-200 hover:border-blue-400/60";
    case "attack":         return "bg-yellow-600/20 border-yellow-500/40 text-yellow-100 hover:border-yellow-400/60";
    case "attack_cancel":  return "bg-orange-600/20 border-orange-500/40 text-orange-100 hover:border-orange-400/60";
    case "item":           return "bg-zinc-600/30 border-zinc-500/40 text-zinc-100 hover:border-zinc-400/60";
    case "summoner_spell": return "bg-purple-600/20 border-purple-500/40 text-purple-100 hover:border-purple-400/60";
    case "move":           return "bg-emerald-700/20 border-emerald-500/40 text-emerald-100 hover:border-emerald-400/60";
    case "recall":         return "bg-cyan-700/20 border-cyan-500/40 text-cyan-100 hover:border-cyan-400/60";
    case "ward":           return "bg-green-700/20 border-green-500/40 text-green-100 hover:border-green-400/60";
    default:               return "bg-surface-overlay border-border text-text-secondary hover:border-[rgba(255,255,255,0.24)]";
  }
}

function chipLabel(inp: SeqEntry): string {
  if (inp.category === "skill" && inp.ref) {
    const m = inp.ref.match(/([QWERqwer])\d*$/);
    return m ? m[1].toUpperCase() : "?";
  }
  if (inp.category === "attack")         return "AA";
  if (inp.category === "attack_cancel")  return "AC";
  if (inp.category === "item") {
    // slot 있으면 슬롯 번호, 없으면 ref 라도 보여주기 (e.g. "I3340")
    if (inp.slot !== undefined && inp.slot !== null && inp.slot !== "") {
      return `I${inp.slot}`;
    }
    if (typeof inp.ref === "string" && inp.ref) return `I${inp.ref}`;
    return "I?";
  }
  if (inp.category === "summoner_spell") return (inp.slot ?? "S").toString().toUpperCase();
  if (inp.category === "move")           return "MV";
  if (inp.category === "recall")         return "RC";
  if (inp.category === "ward")           return "WD";
  return inp.category.slice(0, 2).toUpperCase();
}

function genId(): string {
  return Math.random().toString(36).slice(2);
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

// ── ChipPopover (일반 입력) ───────────────────────────────────
function ChipPopover({
  entry, characterSlug, items, onChange, onClose,
}: {
  entry: SeqEntry;
  characterSlug: string;
  items: ItemMeta[];
  onChange: (next: SeqEntry) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const setCategory = (cat: string) => {
    let next: SeqEntry = { ...entry, category: cat };
    if (cat === "skill") {
      const champSlug = characterSlug.charAt(0).toUpperCase() + characterSlug.slice(1);
      next = { ...next, ref: typeof entry.ref === "string" && /[QWER]/i.test(entry.ref)
        ? entry.ref
        : `${champSlug}Q`, slot: undefined };
    } else if (cat === "item") {
      const existingSlot = typeof entry.slot === "number" ? entry.slot
        : typeof entry.slot === "string" && /^[1-6]$/.test(entry.slot) ? Number(entry.slot)
        : 1;
      next = { ...next, slot: existingSlot, ref: entry.category === "item" ? entry.ref : undefined };
    } else if (cat === "summoner_spell") {
      const existingSlot = entry.slot === "D" || entry.slot === "F" ? entry.slot : "D";
      next = { ...next, slot: existingSlot, ref: entry.category === "summoner_spell" ? entry.ref : undefined };
    } else {
      next = { ...next, ref: undefined, slot: undefined };
    }
    onChange(next);
  };

  const skillKey = (() => {
    if (entry.category !== "skill") return null;
    const m = typeof entry.ref === "string" ? entry.ref.match(/([QWER])\d*$/i) : null;
    return m ? m[1].toUpperCase() as "Q" | "W" | "E" | "R" : "Q";
  })();

  const setSkillKey = (k: "Q" | "W" | "E" | "R") => {
    const champSlug = characterSlug.charAt(0).toUpperCase() + characterSlug.slice(1);
    onChange({ ...entry, category: "skill", ref: `${champSlug}${k}`, slot: undefined });
  };

  return (
    <div
      ref={ref}
      className="absolute z-30 top-full left-0 mt-1 w-72 p-3 rounded-lg border border-border bg-surface-overlay shadow-xl flex flex-col gap-3"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wide text-text-muted font-bold">카테고리</span>
        <select
          value={entry.category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-8 px-2 rounded-md border border-border bg-surface-raised text-xs focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
        >
          {LOL_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {entry.category === "skill" && (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-text-muted font-bold">스킬</span>
          <div className="flex gap-1">
            {(["Q", "W", "E", "R"] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setSkillKey(k)}
                className={`w-9 h-9 rounded-md border text-xs font-bold transition-colors ${
                  skillKey === k ? "border-gold text-gold bg-gold/10" : "border-border text-text-secondary hover:text-text"
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      )}

      {entry.category === "item" && (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-text-muted font-bold">슬롯</span>
          <div className="flex gap-1 flex-wrap">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange({ ...entry, slot: n })}
                className={`w-9 h-9 rounded-md border text-xs font-bold transition-colors ${
                  entry.slot === n ? "border-gold text-gold bg-gold/10" : "border-border text-text-secondary hover:text-text"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <span className="text-[10px] uppercase tracking-wide text-text-muted font-bold mt-2">아이템</span>
          <InlineItemPicker
            items={items}
            current={typeof entry.ref === "string" ? entry.ref : undefined}
            onSelect={(id) => onChange({ ...entry, ref: id })}
          />
        </div>
      )}

      {entry.category === "summoner_spell" && (
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-text-muted font-bold">슬롯</span>
          <div className="flex gap-1">
            {(["D", "F"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange({ ...entry, slot: s })}
                className={`w-9 h-9 rounded-md border text-xs font-bold transition-colors ${
                  entry.slot === s ? "border-gold text-gold bg-gold/10" : "border-border text-text-secondary hover:text-text"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-1 border-t border-border">
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] font-semibold text-text-muted hover:text-text transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

// ── StepMarkerPopover (구간 marker — title + tip) ────────────
function StepMarkerPopover({
  entry, stepNumber, onChange, onClose,
}: {
  entry: SeqEntry;
  stepNumber: number;
  onChange: (next: SeqEntry) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-30 top-full left-0 mt-1 w-80 p-3 rounded-lg border border-gold/40 bg-surface-overlay shadow-xl flex flex-col gap-3"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-wide text-gold font-bold">{stepNumber}단계 marker</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wide text-text-muted font-bold">제목</span>
        <input
          type="text"
          value={entry.title ?? ""}
          onChange={(e) => onChange({ ...entry, title: e.target.value })}
          placeholder={`예: 평캔 풀콤`}
          className="h-8 px-2 rounded-md border border-border bg-surface-raised text-xs focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wide text-text-muted font-bold">팁 (선택)</span>
        <textarea
          value={entry.tip ?? ""}
          onChange={(e) => onChange({ ...entry, tip: e.target.value })}
          rows={3}
          placeholder="이 구간의 핵심 타이밍 / 주의사항"
          className="px-2 py-1.5 rounded-md border border-border bg-surface-raised text-xs focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors resize-none"
        />
      </div>
      <div className="flex justify-end pt-1 border-t border-border">
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] font-semibold text-text-muted hover:text-text transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

// 팔레트 → 시퀀스 사이 drag-and-drop 시 사용하는 dataTransfer MIME.
// `source` 가 'palette' 면 새 entry 를 삽입, 'sequence' 면 기존 인덱스를 옮긴다.
const CGG_CHIP_MIME = "application/x-cgg-chip";

type PaletteDragPayload = {
  source: "palette";
  data: Omit<SeqEntry, "_id" | "t">;
};

type SequenceDragPayload = {
  source: "sequence";
  index: number;
};

type ChipDragPayload = PaletteDragPayload | SequenceDragPayload;

// dataTransfer 에서 chip payload 를 안전하게 추출.
function readChipPayload(e: React.DragEvent): ChipDragPayload | null {
  try {
    const raw = e.dataTransfer.getData(CGG_CHIP_MIME);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.source === "palette" || parsed.source === "sequence")) {
        return parsed as ChipDragPayload;
      }
    }
  } catch { /* fall through */ }
  // sequence 내부 reorder 의 fallback (text/plain 에 인덱스만 들어 있는 경우)
  try {
    const raw = e.dataTransfer.getData("text/plain");
    if (raw && /^\d+$/.test(raw)) {
      return { source: "sequence", index: Number(raw) };
    }
  } catch {}
  return null;
}

// ── Palette: 클릭으로 시퀀스에 추가, 또는 드래그해서 원하는 위치에 삽입 ───
function Palette({
  characterSlug, items, patch, requiredItems, summonerSpells, onAdd,
}: {
  characterSlug: string;
  items: ItemMeta[];
  patch: string;
  requiredItems: string[];
  summonerSpells: string[];
  onAdd: (entry: Omit<SeqEntry, "_id" | "t">) => void;
}) {
  // 팔레트 칩에서 드래그 시작 시 dataTransfer 채우기.
  // 클릭 fallback 도 그대로 동작 → 드래그 안 하는 사용자도 OK.
  const startDrag = (e: React.DragEvent<HTMLButtonElement>, data: Omit<SeqEntry, "_id" | "t">) => {
    const payload: PaletteDragPayload = { source: "palette", data };
    e.dataTransfer.effectAllowed = "copy";
    try { e.dataTransfer.setData(CGG_CHIP_MIME, JSON.stringify(payload)); } catch {}
    // 일부 브라우저는 text/plain 이 없으면 drop 자체가 안 일어남
    try { e.dataTransfer.setData("text/plain", "palette-chip"); } catch {}
  };

  const champSlug = characterSlug ? characterSlug.charAt(0).toUpperCase() + characterSlug.slice(1) : "";

  // 아이템: gameSpecific.required_items 의 순서가 곧 슬롯 1..N
  const itemRows = requiredItems.map((id, idx) => {
    const meta = items.find((it) => it.id === id);
    return {
      slot: idx + 1,
      id,
      name: meta?.name ?? id,
      iconUrl: meta?.iconUrl,
    };
  });

  // 소환사 주문: gameSpecific.summoner_spells 순서대로 D, F 슬롯 자동 매핑
  const spellRows = summonerSpells.slice(0, 2).map((id, idx) => ({
    slot: (idx === 0 ? "D" : "F") as "D" | "F",
    id,
    label: SUMMONER_SPELL_LABELS[id] ?? id,
  }));

  const PaletteSection = ({
    label, children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <div className="flex items-start gap-2">
      <span className="text-[10px] uppercase tracking-wide text-text-muted font-bold pt-1.5 w-14 shrink-0">{label}</span>
      <div className="flex flex-wrap gap-1.5 flex-1">{children}</div>
    </div>
  );

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-dashed border-border bg-surface-overlay/40 p-3">
      <p className="text-xs font-semibold text-text-secondary">팔레트 — 클릭해서 끝에 추가, 또는 시퀀스의 원하는 위치로 드래그</p>

      {/* 챔프 스킬 */}
      <PaletteSection label="스킬">
        {(["Q", "W", "E", "R"] as const).map((k) => (
          <button
            key={k}
            type="button"
            disabled={!champSlug}
            draggable={!!champSlug}
            onDragStart={(e) => startDrag(e, { category: "skill", ref: `${champSlug}${k}` })}
            onClick={() => onAdd({ category: "skill", ref: `${champSlug}${k}` })}
            className="w-8 h-8 rounded-md border border-blue-500/40 bg-blue-600/20 text-blue-200 text-xs font-bold hover:border-blue-400/60 hover:bg-blue-600/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={champSlug ? `${champSlug}${k} 추가 — 클릭 또는 드래그` : "챔피언이 지정되지 않았습니다"}
          >
            {k}
          </button>
        ))}
      </PaletteSection>

      {/* 평타 / 평캔 */}
      <PaletteSection label="평타">
        <button
          type="button"
          draggable
          onDragStart={(e) => startDrag(e, { category: "attack" })}
          onClick={() => onAdd({ category: "attack" })}
          className="h-8 px-3 rounded-md border border-yellow-500/40 bg-yellow-600/20 text-yellow-100 text-xs font-bold hover:border-yellow-400/60 hover:bg-yellow-600/30 transition-colors"
        >
          AA
        </button>
        <button
          type="button"
          draggable
          onDragStart={(e) => startDrag(e, { category: "attack_cancel" })}
          onClick={() => onAdd({ category: "attack_cancel" })}
          className="h-8 px-3 rounded-md border border-orange-500/40 bg-orange-600/20 text-orange-100 text-xs font-bold hover:border-orange-400/60 hover:bg-orange-600/30 transition-colors"
        >
          AC
        </button>
      </PaletteSection>

      {/* 아이템 — gameSpecific.required_items 에서 자동 */}
      <PaletteSection label="아이템">
        {itemRows.length === 0 ? (
          <span className="text-[11px] text-text-muted self-center">
            아래 LoL 조건에서 필요 아이템을 추가하면 여기에 chip 으로 나타납니다.
          </span>
        ) : itemRows.map((it) => (
          <button
            key={`${it.slot}-${it.id}`}
            type="button"
            draggable
            onDragStart={(e) => startDrag(e, { category: "item", slot: it.slot, ref: it.id })}
            onClick={() => onAdd({ category: "item", slot: it.slot, ref: it.id })}
            className="flex items-center gap-1.5 h-8 pl-1 pr-2 rounded-md border border-zinc-500/40 bg-zinc-600/30 text-zinc-100 text-xs font-bold hover:border-zinc-400/60 hover:bg-zinc-600/40 transition-colors max-w-[200px]"
            title={`슬롯 ${it.slot}: ${it.name} — 클릭 또는 드래그`}
          >
            <span className="w-5 h-5 rounded bg-black/30 inline-flex items-center justify-center text-[10px] font-black shrink-0">{it.slot}</span>
            {it.iconUrl && (
              <Image src={it.iconUrl} alt={it.name} width={20} height={20} sizes="20px" className="rounded-sm shrink-0" />
            )}
            <span className="truncate">{it.name}</span>
          </button>
        ))}
      </PaletteSection>

      {/* 소환사 주문 — gameSpecific.summoner_spells 에서 자동 (최대 2개 = D, F) */}
      <PaletteSection label="주문">
        {spellRows.length === 0 ? (
          <span className="text-[11px] text-text-muted self-center">
            아래 LoL 조건에서 소환사 주문을 선택하면 여기에 chip 으로 나타납니다.
          </span>
        ) : spellRows.map((sp) => (
          <button
            key={`${sp.slot}-${sp.id}`}
            type="button"
            draggable
            onDragStart={(e) => startDrag(e, { category: "summoner_spell", slot: sp.slot, ref: sp.id })}
            onClick={() => onAdd({ category: "summoner_spell", slot: sp.slot, ref: sp.id })}
            className="flex items-center gap-1.5 h-8 pl-1 pr-2 rounded-md border border-purple-500/40 bg-purple-600/20 text-purple-100 text-xs font-bold hover:border-purple-400/60 hover:bg-purple-600/30 transition-colors"
            title={`${sp.slot}: ${sp.label} — 클릭 또는 드래그`}
          >
            <span className="w-5 h-5 rounded bg-black/30 inline-flex items-center justify-center text-[10px] font-black shrink-0">{sp.slot}</span>
            <Image src={getSummonerSpellIconUrl(sp.id, patch)} alt={sp.label} width={20} height={20} sizes="20px" className="rounded-sm shrink-0" />
            <span>{sp.label}</span>
          </button>
        ))}
      </PaletteSection>

      {/* 구간 marker */}
      <PaletteSection label="구간">
        <button
          type="button"
          draggable
          onDragStart={(e) => startDrag(e, { category: STEP_MARKER, title: "", tip: "" })}
          onClick={() => onAdd({ category: STEP_MARKER, title: "", tip: "" })}
          className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-gold/40 bg-gold/10 text-gold text-xs font-bold hover:border-gold/60 hover:bg-gold/20 transition-colors"
          title="현재 위치에 단계 marker 추가 — 클릭 또는 드래그"
        >
          <span aria-hidden>▷</span>
          <span>구간 시작</span>
        </button>
      </PaletteSection>
    </div>
  );
}

// ── SequenceEditor (입력 + step marker 통합) ─────────────────
function SequenceEditor({ inputs, onChange, characterSlug, items, patch, requiredItems, summonerSpells }: {
  inputs: SeqEntry[];
  onChange: (v: SeqEntry[]) => void;
  characterSlug: string;
  items: ItemMeta[];
  patch: string;
  requiredItems: string[];
  summonerSpells: string[];
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  // dropTargetIdx 는 "삽입 위치" — 0..inputs.length 까지의 갭.
  // 0 = 맨 앞에 삽입, N = 맨 뒤(끝)에 삽입.
  const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null);

  const remove = (i: number) => {
    onChange(inputs.filter((_, idx) => idx !== i));
    setOpenIdx(null);
  };

  const updateAt = (i: number, next: SeqEntry) => {
    onChange(inputs.map((inp, idx) => (idx === i ? next : inp)));
  };

  // 시퀀스 마지막 입력 시점 + 200ms 의 새 t 값을 만든다.
  const nextTrailingT = (): number => {
    const lastNonMarker = [...inputs].reverse().find((e) => !isStepMarker(e) && typeof e.t === "number");
    const baseT = typeof lastNonMarker?.t === "number" ? lastNonMarker.t : null;
    return baseT === null ? 0 : baseT + 200;
  };

  // 인덱스 i 에 삽입할 때 사용할 t 값 추정.
  // i 위치에 끼워넣으므로 "그 자리 직전 입력의 t + 100" 정도면 안전.
  const insertionT = (i: number): number => {
    // i 직전(=i-1) 부터 거꾸로 t 가 있는 입력을 찾는다
    for (let k = i - 1; k >= 0; k--) {
      const e = inputs[k];
      if (!isStepMarker(e) && typeof e.t === "number") return e.t + 100;
    }
    // i 이후에서 t 있는 입력을 찾으면 그것보다 살짝 앞으로
    for (let k = i; k < inputs.length; k++) {
      const e = inputs[k];
      if (!isStepMarker(e) && typeof e.t === "number") return Math.max(0, e.t - 100);
    }
    return 0;
  };

  // 팔레트 클릭 → 시퀀스 끝에 추가
  const addToSequence = (entry: Omit<SeqEntry, "_id" | "t">) => {
    const next: SeqEntry = { ...entry, _id: genId(), t: nextTrailingT() };
    onChange([...inputs, next]);
  };

  // 공통 헬퍼: payload 받아서 적절히 삽입(팔레트) 또는 이동(시퀀스)
  const handleDropAt = (insertIdx: number, payload: ChipDragPayload) => {
    if (payload.source === "palette") {
      const t = insertIdx >= inputs.length ? nextTrailingT() : insertionT(insertIdx);
      const newEntry: SeqEntry = { ...payload.data, _id: genId(), t };
      const next = [...inputs];
      next.splice(insertIdx, 0, newEntry);
      onChange(next);
      return;
    }
    // sequence → 같은 배열 안에서 이동
    const from = payload.index;
    if (from === insertIdx || from === insertIdx - 1) return; // no-op
    const next = [...inputs];
    const [moved] = next.splice(from, 1);
    // splice 로 from 제거 후 insertIdx 가 from 보다 뒤였다면 1 줄어든다
    const adjusted = from < insertIdx ? insertIdx - 1 : insertIdx;
    next.splice(adjusted, 0, moved);
    onChange(next);
  };

  // ── drag-and-drop (HTML5 native) ─────────────────────────────
  const onChipDragStart = (i: number) => (e: React.DragEvent<HTMLDivElement>) => {
    setDragIdx(i);
    setOpenIdx(null);
    const payload: SequenceDragPayload = { source: "sequence", index: i };
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData(CGG_CHIP_MIME, JSON.stringify(payload)); } catch {}
    try { e.dataTransfer.setData("text/plain", String(i)); } catch {}
  };

  // 칩 위에서 드래그 — 마우스 위치로 before/after 결정
  const onChipDragOver = (i: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const before = e.clientX < rect.left + rect.width / 2;
    const target = before ? i : i + 1;
    setDropTargetIdx(target);
    e.dataTransfer.dropEffect = dragIdx !== null ? "move" : "copy";
  };

  const onChipDrop = (i: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const before = e.clientX < rect.left + rect.width / 2;
    const target = before ? i : i + 1;
    const payload = readChipPayload(e);
    setDragIdx(null); setDropTargetIdx(null);
    if (!payload) return;
    handleDropAt(target, payload);
  };

  // 컨테이너(빈 공간 / trailing) 위 드래그 — 끝에 삽입
  const onContainerDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    // 자식 칩이 이미 over 처리한 상태라면 그대로 둠
    if (e.target !== e.currentTarget) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    setDropTargetIdx(inputs.length);
    e.dataTransfer.dropEffect = dragIdx !== null ? "move" : "copy";
  };

  const onContainerDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    // 자식 칩에서 이미 처리됐으면 무시
    if (e.target !== e.currentTarget && dropTargetIdx !== inputs.length) {
      return;
    }
    const payload = readChipPayload(e);
    setDragIdx(null); setDropTargetIdx(null);
    if (!payload) return;
    handleDropAt(inputs.length, payload);
  };

  const onDragEnd = () => { setDragIdx(null); setDropTargetIdx(null); };

  // step number 계산: 각 marker 의 순번 (1-indexed)
  let stepCounter = 0;
  const stepNumbers = inputs.map((e) => {
    if (isStepMarker(e)) {
      stepCounter += 1;
      return stepCounter;
    }
    return null;
  });

  return (
    <div className="flex flex-col gap-3">
      {/* 팔레트 — 클릭으로 추가 (시퀀스 위) */}
      <Palette
        characterSlug={characterSlug}
        items={items}
        patch={patch}
        requiredItems={requiredItems}
        summonerSpells={summonerSpells}
        onAdd={addToSequence}
      />

      {/* Chip flow (입력 + step marker 통합) */}
      {inputs.length === 0 ? (
        <div
          onDragOver={onContainerDragOver}
          onDrop={onContainerDrop}
          className={`rounded-lg border border-dashed px-4 py-6 text-center transition-colors ${
            dropTargetIdx === 0 ? "border-gold bg-gold/5" : "border-border bg-surface-overlay"
          }`}
        >
          <p className="text-xs text-text-muted">시퀀스가 비어 있습니다. 위 팔레트에서 클릭하거나 여기로 드래그하세요.</p>
        </div>
      ) : (
        <div
          className="flex items-start gap-1.5 flex-wrap rounded-lg border border-border bg-surface-overlay p-2.5"
          onDragOver={onContainerDragOver}
          onDrop={onContainerDrop}
        >
          {inputs.map((inp, i) => {
            const isDragging  = dragIdx === i;
            const isDropBefore = dropTargetIdx === i;
            const isOpen      = openIdx === i;
            const marker      = isStepMarker(inp);
            const stepNum     = stepNumbers[i];

            // step marker chip
            if (marker) {
              const titleText = inp.title?.trim() || "구간";
              return (
                <div key={inp._id ?? `marker-${i}`} className="relative">
                  {isDropBefore && (
                    <span className="absolute -left-1 top-0 bottom-0 w-0.5 bg-gold rounded-full pointer-events-none" />
                  )}
                  <div
                    draggable
                    onDragStart={onChipDragStart(i)}
                    onDragOver={onChipDragOver(i)}
                    onDrop={onChipDrop(i)}
                    onDragEnd={onDragEnd}
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    onContextMenu={(e) => { e.preventDefault(); remove(i); }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenIdx(isOpen ? null : i); }
                      if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); remove(i); }
                    }}
                    className={`group inline-flex items-center gap-1 h-8 px-2 rounded-md border-2 border-dashed text-[11px] font-bold cursor-grab active:cursor-grabbing select-none transition-all bg-gold/10 border-gold/50 text-gold hover:bg-gold/20 ${
                      isDragging ? "opacity-40" : ""
                    } ${isOpen ? "ring-2 ring-gold ring-offset-1 ring-offset-surface-overlay" : ""}`}
                    title={`구간 ${stepNum}${inp.title ? ` · ${inp.title}` : ""}${inp.tip ? ` — ${inp.tip}` : ""}`}
                  >
                    <span aria-hidden className="text-[10px] leading-none opacity-60 group-hover:opacity-100">|</span>
                    <span className="leading-none whitespace-nowrap">{stepNum}단{inp.title ? `: ${titleText}` : ""}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); remove(i); }}
                      aria-label={`구간 ${stepNum} 삭제`}
                      className="ml-0.5 w-4 h-4 inline-flex items-center justify-center rounded-sm text-current opacity-50 hover:opacity-100 hover:bg-black/30 transition-opacity text-[10px] leading-none"
                    >×</button>
                    <span aria-hidden className="text-[10px] leading-none opacity-60 group-hover:opacity-100">|</span>
                  </div>
                  {isOpen && (
                    <StepMarkerPopover
                      entry={inp}
                      stepNumber={stepNum ?? 1}
                      onChange={(next) => updateAt(i, next)}
                      onClose={() => setOpenIdx(null)}
                    />
                  )}
                </div>
              );
            }

            // 일반 입력 chip
            const variantCls  = chipVariantClass(inp.category);
            const label       = chipLabel(inp);

            return (
              <div key={inp._id ?? i} className="relative">
                {isDropBefore && (
                  <span className="absolute -left-1 top-0 bottom-0 w-0.5 bg-gold rounded-full pointer-events-none" />
                )}
                <div
                  draggable
                  onDragStart={onChipDragStart(i)}
                  onDragOver={onChipDragOver(i)}
                  onDrop={onChipDrop(i)}
                  onDragEnd={onDragEnd}
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  onContextMenu={(e) => { e.preventDefault(); remove(i); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenIdx(isOpen ? null : i); }
                    if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); remove(i); }
                  }}
                  className={`group inline-flex items-center gap-1 h-8 pl-1.5 pr-1 rounded-md border text-[11px] font-bold cursor-grab active:cursor-grabbing select-none transition-all ${variantCls} ${
                    isDragging ? "opacity-40" : ""
                  } ${isOpen ? "ring-2 ring-gold ring-offset-1 ring-offset-surface-overlay" : ""}`}
                  title={`#${i} · ${inp.category}${inp.ref ? ` · ${inp.ref}` : ""}${inp.slot !== undefined ? ` · slot ${inp.slot}` : ""}`}
                >
                  <span aria-hidden className="text-[8px] leading-none text-current opacity-40 group-hover:opacity-70 transition-opacity">⋮⋮</span>
                  <span className="leading-none">{label}</span>
                  {inp.category === "item" && typeof inp.ref === "string" && (
                    <span className="text-[8px] opacity-70 leading-none">●</span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); remove(i); }}
                    aria-label={`#${i} 삭제`}
                    className="ml-0.5 w-4 h-4 inline-flex items-center justify-center rounded-sm text-current opacity-50 hover:opacity-100 hover:bg-black/30 transition-opacity text-[10px] leading-none"
                  >×</button>
                </div>
                {isOpen && (
                  <ChipPopover
                    entry={inp}
                    characterSlug={characterSlug}
                    items={items}
                    onChange={(next) => updateAt(i, next)}
                    onClose={() => setOpenIdx(null)}
                  />
                )}
              </div>
            );
          })}
          {/* 마지막 갭: 끝에 삽입 indicator */}
          {dropTargetIdx === inputs.length && (
            <span className="self-stretch w-0.5 bg-gold rounded-full pointer-events-none" />
          )}
        </div>
      )}

      {/* 하단 힌트 */}
      <p className="text-[11px] text-text-muted pt-1">
        팔레트 드래그 → 원하는 위치에 삽입 · 칩 드래그 → 순서 변경 · 클릭 → 편집 · 우클릭 → 삭제
      </p>
    </div>
  );
}

// ── inputSummary <-> sequence 변환 ────────────────────────────
//
// 저장된 inputSummary 와 steps 배열을 받아, marker 가 섞인 단일 sequence
// 로 만든다. 마커는 `inputs[i].t >= step.start` 인 첫 입력 직전에 삽입.
//
// 거꾸로 sequence -> { inputSummary, steps } 분리 시:
//   - inputSummary: marker 제외한 나머지
//   - steps: 각 marker 의 `start` = 다음 입력의 t (없으면 직전 입력 t + tail)
//            `end` = 다음 marker 의 start (없으면 durationMs 또는 마지막 입력 t + tail)

const TAIL_MS = 200;

function buildInitialSequence(
  inputSummary: SeqEntry[],
  rawSteps: Array<{ start: number; end: number; title: string; tip?: string }>,
  durationMs: number,
): SeqEntry[] {
  // 입력 summary 에 t 가 없을 수도 있음 → synthesized t 사용
  const N = inputSummary.length;
  const span = Math.max(durationMs, 100);
  const inputsWithT = inputSummary.map((inp, idx) => {
    const t = typeof inp.t === "number" ? inp.t : Math.round((idx * span) / Math.max(1, N));
    return { ...inp, t, _id: inp._id ?? genId() };
  });

  if (rawSteps.length === 0) return inputsWithT;

  // step.start 기준 오름차순 정렬
  const sortedSteps = [...rawSteps].sort((a, b) => a.start - b.start);

  // 각 step 마다 inputs 에서 t >= step.start 인 첫 인덱스를 찾아 그 앞에 marker 삽입
  // (정렬되어 있으므로 결과 순서가 보존됨)
  const markerInsertions: { idx: number; marker: SeqEntry }[] = [];
  for (const s of sortedSteps) {
    let insertIdx = inputsWithT.findIndex((inp) => (inp.t ?? 0) >= s.start);
    if (insertIdx === -1) insertIdx = inputsWithT.length; // 모두 step.start 보다 앞 → 끝에 마커
    markerInsertions.push({
      idx: insertIdx,
      marker: {
        category: STEP_MARKER,
        title: s.title ?? "",
        tip: s.tip ?? "",
        _id: genId(),
      },
    });
  }

  // 뒤에서부터 삽입해서 인덱스 어긋남 방지
  const result: SeqEntry[] = [...inputsWithT];
  for (let i = markerInsertions.length - 1; i >= 0; i--) {
    const { idx, marker } = markerInsertions[i];
    result.splice(idx, 0, marker);
  }
  return result;
}

function splitSequence(
  sequence: SeqEntry[],
  durationMs: number,
): { inputSummary: SeqEntry[]; steps: Step[] } {
  const inputSummary = sequence.filter((e) => !isStepMarker(e));

  // 마커 위치별 step 생성 — start = 다음 입력의 t, end = 다음 마커 직전 입력의 t (또는 durationMs)
  const steps: Step[] = [];
  const lastInputT = (() => {
    const last = [...inputSummary].reverse().find((e) => typeof e.t === "number");
    return typeof last?.t === "number" ? last.t : durationMs;
  })();

  // sequence 내 각 entry 의 "다음에 오는 입력의 t" 를 미리 계산
  const nextInputTAfter: number[] = new Array(sequence.length).fill(durationMs);
  let nextT = durationMs;
  for (let i = sequence.length - 1; i >= 0; i--) {
    const e = sequence[i];
    if (!isStepMarker(e) && typeof e.t === "number") {
      nextT = e.t;
    }
    nextInputTAfter[i] = nextT;
  }

  // 각 마커의 start 결정
  const markerStarts: { seqIdx: number; start: number; entry: SeqEntry }[] = [];
  for (let i = 0; i < sequence.length; i++) {
    const e = sequence[i];
    if (isStepMarker(e)) {
      const start = nextInputTAfter[i] ?? durationMs;
      markerStarts.push({ seqIdx: i, start, entry: e });
    }
  }

  for (let i = 0; i < markerStarts.length; i++) {
    const { entry, start } = markerStarts[i];
    const end = i + 1 < markerStarts.length
      ? markerStarts[i + 1].start
      : Math.max(start + TAIL_MS, lastInputT + TAIL_MS, durationMs);
    steps.push({
      id: entry._id ?? genId(),
      start,
      end,
      title: entry.title ?? "",
      tip: entry.tip ?? "",
    });
  }

  return { inputSummary, steps };
}

// ── Thumbnail frame capture ───────────────────────────────────
//
// 사용자가 영상을 원하는 시점으로 스크럽한 뒤 버튼을 눌러 해당 프레임을
// 캡처해 썸네일로 쓴다. (이전엔 콤보의 가장 "바쁜" 순간을 자동 추출하는
// 방식이었지만, 화질·구도 모두 수동 캡처가 더 좋아 그쪽으로 통일.)

function autoExtractThumbnail(videoEl: HTMLVideoElement, timestampMs: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const targetSec = Math.max(0, timestampMs / 1000);

    const captureFrame = () => {
      try {
        const vw = videoEl.videoWidth;
        const vh = videoEl.videoHeight;
        if (vw === 0 || vh === 0) {
          reject(new Error("영상 프레임 크기를 알 수 없습니다."));
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width  = vw;
        canvas.height = vh;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas context 를 만들 수 없습니다."));
          return;
        }
        ctx.drawImage(videoEl, 0, 0, vw, vh);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("프레임 캡처 실패"));
          },
          "image/jpeg",
          0.9,
        );
      } catch (err) {
        reject(err);
      }
    };

    const seekAndCapture = () => {
      const onSeeked = () => {
        videoEl.removeEventListener("seeked", onSeeked);
        captureFrame();
      };
      videoEl.addEventListener("seeked", onSeeked);
      const safeT = Math.min(
        Math.max(0, targetSec),
        Math.max(0, (videoEl.duration || targetSec) - 0.05),
      );
      videoEl.currentTime = safeT;
    };

    if (videoEl.readyState >= 2 /* HAVE_CURRENT_DATA */ && !Number.isNaN(videoEl.duration)) {
      seekAndCapture();
    } else {
      const onLoaded = () => {
        videoEl.removeEventListener("loadedmetadata", onLoaded);
        seekAndCapture();
      };
      videoEl.addEventListener("loadedmetadata", onLoaded);
    }
  });
}

// ── ComboEditForm ─────────────────────────────────────────────
export default function ComboEditForm({ combo, items, patch }: Props) {
  const router = useRouter();

  const [title,       setTitle]       = useState(combo.title);
  const [description, setDescription] = useState(combo.description ?? "");
  const [tip,         setTip]         = useState(combo.tip ?? "");

  const [difficulty, setDifficulty] = useState<Difficulty>((combo.difficulty as Difficulty) ?? "medium");
  const [tagsInput,  setTagsInput]  = useState(combo.tags.join(", "));
  const [gameSpecific, setGameSpecific] = useState<Partial<LolGameSpecific>>(
    (combo.gameSpecific as Partial<LolGameSpecific>) ?? {}
  );

  // sequence: 입력 + step_marker 가 섞여있음 (편집 단위)
  const [sequence, setSequence] = useState<SeqEntry[]>(() => {
    const rawInputs = (combo.inputSummary as SeqEntry[]) ?? [];
    const rawSteps = (combo.steps as Array<{ start: number; end: number; title: string; tip?: string }> | null) ?? [];
    return buildInitialSequence(rawInputs, Array.isArray(rawSteps) ? rawSteps : [], combo.durationMs ?? 0);
  });

  // Media
  const [newThumbnailFile, setNewThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(combo.thumbnailUrl);
  const [newVideoFile,     setNewVideoFile]     = useState<File | null>(null);
  // videoSrc — single source of truth for the <video> element.
  // null  → 영상 없음.  combo.videoUrl  → 기존 원격 URL.  blob:  → 새로 고른 파일.
  const [videoSrc,         setVideoSrc]         = useState<string | null>(combo.videoUrl);
  // 새로 고른 파일에 대해서만 blob URL 을 만들었으므로, 정리(revoke)는 그 경우에만 수행한다.
  const [videoBlobUrl,     setVideoBlobUrl]     = useState<string | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef     = useRef<HTMLInputElement>(null);
  const videoRef          = useRef<HTMLVideoElement>(null);

  // Auto-thumbnail extraction
  const [thumbnailExtracting, setThumbnailExtracting] = useState(false);
  const [thumbnailError,      setThumbnailError]      = useState<string | null>(null);

  // AI
  const [aiPending, startAiTransition] = useTransition();
  const [aiError,        setAiError]       = useState<string | null>(null);
  const [aiFilledFields, setAiFilledFields] = useState<Set<string>>(new Set());

  // 컴포넌트 unmount 또는 videoBlobUrl 갱신 시에 이전 blob URL 정리
  useEffect(() => {
    return () => { if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl); };
  }, [videoBlobUrl]);

  const handleThumbnailFile = (f: File) => {
    setNewThumbnailFile(f);
    setThumbnailPreview(URL.createObjectURL(f));
  };

  // 새 영상 파일을 골랐을 때: 기존 blob URL 이 있으면 정리하고
  // videoSrc 를 새 blob URL 로 교체. 같은 <video> 엘리먼트에서 in-place 로 갱신.
  const handleVideoFile = (f: File) => {
    if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl);
    const url = URL.createObjectURL(f);
    setNewVideoFile(f);
    setVideoSrc(url);
    setVideoBlobUrl(url);
  };

  // 사용자가 영상을 원하는 프레임으로 스크럽한 뒤 클릭 → 그 프레임을 썸네일로 캡처.
  // 자동 "busy timestamp" 추출 대신 수동 캡처가 화질·구도 모두 더 낫다.
  const handleCaptureCurrentFrame = async () => {
    const videoEl = videoRef.current;
    if (!videoEl || !videoSrc) {
      setThumbnailError("영상이 로드되지 않았습니다.");
      return;
    }
    setThumbnailError(null);
    setThumbnailExtracting(true);
    try {
      const tMs = Math.max(0, Math.round((videoEl.currentTime || 0) * 1000));
      const blob = await autoExtractThumbnail(videoEl, tMs);
      const file = new File([blob], `frame-thumb-${Date.now()}.jpg`, { type: "image/jpeg" });
      // 기존 미리보기가 blob URL 이면 revoke (combo.thumbnailUrl 같은 원격 URL 은 그대로 둠)
      if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
        URL.revokeObjectURL(thumbnailPreview);
      }
      setNewThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    } catch (err) {
      console.error("frame capture failed:", err);
      setThumbnailError(err instanceof Error ? err.message : "프레임 캡처 실패");
    } finally {
      setThumbnailExtracting(false);
    }
  };

  // AI autofill 활성화 조건 검사용 — step_marker 제외한 입력만
  const inputOnly = sequence.filter((e) => !isStepMarker(e));

  // ── AI autofill ─────────────────────────────────────────────
  const handleAiAutofill = () => {
    if (!combo.character?.slug || inputOnly.length === 0) return;
    setAiError(null);
    startAiTransition(async () => {
      // 저장 시점과 동일한 변환: marker 분리 + steps 계산
      const { inputSummary: cleanInputs, steps: derivedSteps } =
        splitSequence(sequence, combo.durationMs ?? 0);

      const tagsArr = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);

      const res = await fetch("/api/ai/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          character: combo.character!.slug,
          inputs: cleanInputs,
          steps: derivedSteps.map(({ start, end, title: t, tip: tp }) => ({ start, end, title: t, tip: tp })),
          gameSpecific: combo.game.slug === "lol" ? gameSpecific : undefined,
          difficulty,
          tags: tagsArr,
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
      if (data.description) { setDescription(data.description.slice(0, 500)); filled.add("description"); }
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

      // marker 분리
      const { inputSummary: cleanInputs, steps: derivedSteps } =
        splitSequence(sequence, combo.durationMs ?? 0);

      // steps payload (id 제외)
      const stepsPayload = derivedSteps.map(({ start, end, title: t, tip: tp }) => ({ start, end, title: t, tip: tp }));

      // inputSummary payload — 내부 _id 제외
      const inputsPayload = cleanInputs.map((e) => {
        const cleaned: Record<string, unknown> = { category: e.category };
        if (e.ref !== undefined)  cleaned.ref  = e.ref;
        if (e.slot !== undefined) cleaned.slot = e.slot;
        if (typeof e.t === "number") cleaned.t = e.t;
        return cleaned;
      });

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
          inputSummary: inputsPayload,
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
        router.push(`/combos/${combo.id}`);
      } else {
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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

      {/* ── 1. 미디어 (영상 미리보기) — 최상단 ─────────────── */}
      <div className="bg-surface-raised rounded-xl p-5 border border-border flex flex-col gap-5">
        {/* Video */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">영상 <span className="text-text-muted text-xs font-normal">(mp4 / webm)</span></span>
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="text-xs font-semibold text-text-secondary hover:text-text transition-colors"
            >
              {videoSrc ? "📁 교체" : "📁 영상 업로드"}
            </button>
          </div>
          <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleVideoFile(e.target.files[0])} />

          {/* Single <video> element — videoSrc 가 단일 source of truth.
              새 파일을 고르면 같은 element 의 src 가 새 blob URL 로 바뀐다. */}
          {videoSrc ? (
            <video
              ref={videoRef}
              key={videoSrc}
              src={videoSrc}
              controls
              preload="metadata"
              crossOrigin="anonymous"
              className="w-full max-h-[400px] rounded-lg border border-border bg-black"
            >
              영상을 재생할 수 없습니다.
            </video>
          ) : (
            <div className="w-full h-32 rounded-lg border border-dashed border-border bg-surface-overlay flex items-center justify-center text-sm text-text-muted">
              영상 없음 — 오버레이에서 녹화 후 위 [📁 영상 업로드] 버튼으로 추가하세요
            </div>
          )}

          {newVideoFile && (
            <div className="flex items-center gap-2 px-3 h-8 rounded-md bg-gold/10 border border-gold/30 text-xs">
              <span className="text-gold font-bold shrink-0">새 파일</span>
              <span className="flex-1 truncate">{newVideoFile.name}</span>
              <span className="text-text-muted shrink-0">{(newVideoFile.size / 1024 / 1024).toFixed(1)} MB</span>
            </div>
          )}

          {/* 현재 프레임 캡처 — 영상에서 원하는 장면으로 스크럽 후 클릭 */}
          {videoSrc && (
            <button
              type="button"
              onClick={handleCaptureCurrentFrame}
              disabled={thumbnailExtracting}
              title="영상을 원하는 장면에서 멈춘 뒤 클릭하면 해당 프레임이 썸네일로 사용됩니다"
              className="self-start text-xs font-semibold text-gold hover:text-gold-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {thumbnailExtracting ? "캡처 중..." : "📷 현재 장면을 썸네일로"}
            </button>
          )}
        </div>

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
              <Image src={thumbnailPreview} alt="썸네일" fill sizes="672px" className="object-cover" unoptimized={thumbnailPreview.startsWith("blob:")} />
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
          {thumbnailError && (
            <p className="text-xs text-hard">{thumbnailError}</p>
          )}
          {!videoSrc && (
            <p className="text-[11px] text-text-muted">영상을 업로드하면 영상 아래에 「📷 현재 장면을 썸네일로」 버튼이 활성화됩니다.</p>
          )}
        </div>
      </div>

      {/* ── 2. 입력 시퀀스 — 영상 바로 아래 ───────────────── */}
      <div className="bg-surface-raised rounded-xl border border-border overflow-hidden">
        <div className="px-5 py-4">
          <SequenceEditor
            inputs={sequence}
            onChange={setSequence}
            characterSlug={combo.character?.slug ?? ""}
            items={items}
            patch={patch}
            requiredItems={gameSpecific.required_items ?? []}
            summonerSpells={gameSpecific.summoner_spells ?? []}
          />
        </div>
      </div>

      {/* ── AI 자동 완성 ──────────────────────────────── */}
      {combo.character && inputOnly.length > 0 && (
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

      {/* ── 3. 제목 ───────────────────────────────────── */}
      <div className="bg-surface-raised rounded-xl p-5 border border-border flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-sm font-semibold">
            제목 <span className="text-hard">*</span>{aiFilledFields.has("title") && <AiBadge />}
          </span>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            required maxLength={100} className={fieldCls(aiFilledFields.has("title"))} />
        </label>

        {/* ── 4. 콤보 설명 ──────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2 text-sm font-semibold">
            콤보 설명 {aiFilledFields.has("description") && <AiBadge />}
            <span className={`ml-auto text-xs font-normal ${description.length > 500 ? "text-hard" : "text-text-muted"}`}>{description.length} / 500</span>
          </span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            rows={5} maxLength={500}
            placeholder="이 콤보가 어떤 상황에서 유용한지, 어떤 패턴을 따라가는지 설명해주세요. (예: 6레벨 솔로 갱킹 상황. R 적중 후 즉시 Q 평캔으로 마무리.)"
            className={`px-3 py-2 rounded-lg border bg-surface-overlay text-sm focus:outline-none transition-colors resize-y ${aiFilledFields.has("description") ? "border-gold/40 focus:border-gold/60" : "border-border focus:border-[rgba(255,255,255,0.3)]"}`} />
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

        {/* ── 5. 난이도 + 태그 ──────────────────────────── */}
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

      {/* ── 6. LoL 조건 (항상 펼쳐짐) ────────────────── */}
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
