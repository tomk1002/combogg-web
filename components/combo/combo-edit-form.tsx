"use client";

import { useState, useRef, useCallback, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import DifficultyPips from "@/components/shared/difficulty-pips";
import LolUploadForm from "@/components/games/lol/lol-upload-form";
import InputKeyMapper, { type MappableEntry } from "@/components/upload/input-key-mapper";
import { KeyCap, inputToKeySequence } from "@/components/shared/keycap";
import { getSummonerSpellIconUrl } from "@/lib/games/lol/ddragon";
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

function isAdjacentDuplicate(a: SeqEntry, b: SeqEntry): boolean {
  // step_marker 는 중복 판정에서 제외
  if (isStepMarker(a) || isStepMarker(b)) return false;
  return a.category === b.category
    && (a.ref ?? null) === (b.ref ?? null)
    && (a.slot ?? null) === (b.slot ?? null);
}

function dedupeAdjacent(inputs: SeqEntry[]): SeqEntry[] {
  if (inputs.length <= 1) return inputs;
  const out: SeqEntry[] = [inputs[0]];
  for (let i = 1; i < inputs.length; i++) {
    if (!isAdjacentDuplicate(inputs[i - 1], inputs[i])) {
      out.push(inputs[i]);
    }
  }
  return out;
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
  if (inp.category === "item")           return `I${inp.slot ?? ""}`;
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

// ── Palette: 클릭으로 시퀀스에 추가 ──────────────────────────
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
      <p className="text-xs font-semibold text-text-secondary">팔레트 — 클릭해서 시퀀스에 추가</p>

      {/* 챔프 스킬 */}
      <PaletteSection label="스킬">
        {(["Q", "W", "E", "R"] as const).map((k) => (
          <button
            key={k}
            type="button"
            disabled={!champSlug}
            onClick={() => onAdd({ category: "skill", ref: `${champSlug}${k}` })}
            className="w-8 h-8 rounded-md border border-blue-500/40 bg-blue-600/20 text-blue-200 text-xs font-bold hover:border-blue-400/60 hover:bg-blue-600/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={champSlug ? `${champSlug}${k} 추가` : "챔피언이 지정되지 않았습니다"}
          >
            {k}
          </button>
        ))}
      </PaletteSection>

      {/* 평타 / 평캔 */}
      <PaletteSection label="평타">
        <button
          type="button"
          onClick={() => onAdd({ category: "attack" })}
          className="h-8 px-3 rounded-md border border-yellow-500/40 bg-yellow-600/20 text-yellow-100 text-xs font-bold hover:border-yellow-400/60 hover:bg-yellow-600/30 transition-colors"
        >
          AA
        </button>
        <button
          type="button"
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
            onClick={() => onAdd({ category: "item", slot: it.slot, ref: it.id })}
            className="flex items-center gap-1.5 h-8 pl-1 pr-2 rounded-md border border-zinc-500/40 bg-zinc-600/30 text-zinc-100 text-xs font-bold hover:border-zinc-400/60 hover:bg-zinc-600/40 transition-colors max-w-[200px]"
            title={`슬롯 ${it.slot}: ${it.name}`}
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
            onClick={() => onAdd({ category: "summoner_spell", slot: sp.slot, ref: sp.id })}
            className="flex items-center gap-1.5 h-8 pl-1 pr-2 rounded-md border border-purple-500/40 bg-purple-600/20 text-purple-100 text-xs font-bold hover:border-purple-400/60 hover:bg-purple-600/30 transition-colors"
            title={`${sp.slot}: ${sp.label}`}
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
          onClick={() => onAdd({ category: STEP_MARKER, title: "", tip: "" })}
          className="flex items-center gap-1.5 h-8 px-3 rounded-md border border-gold/40 bg-gold/10 text-gold text-xs font-bold hover:border-gold/60 hover:bg-gold/20 transition-colors"
          title="현재 위치에 단계 marker 추가"
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
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const remove = (i: number) => {
    onChange(inputs.filter((_, idx) => idx !== i));
    setOpenIdx(null);
  };

  const updateAt = (i: number, next: SeqEntry) => {
    onChange(inputs.map((inp, idx) => (idx === i ? next : inp)));
  };

  // 팔레트 클릭 → 시퀀스 끝에 추가. t 는 (마지막 입력 t) + 200ms.
  const addToSequence = (entry: Omit<SeqEntry, "_id" | "t">) => {
    const lastNonMarker = [...inputs].reverse().find((e) => !isStepMarker(e) && typeof e.t === "number");
    const baseT = typeof lastNonMarker?.t === "number" ? lastNonMarker.t : null;
    const t = baseT === null ? 0 : baseT + 200;
    const next: SeqEntry = { ...entry, _id: genId(), t };
    onChange([...inputs, next]);
  };

  // ── drag-and-drop reorder (HTML5 native) ─────────────────────
  const onDragStart = (i: number) => (e: React.DragEvent<HTMLDivElement>) => {
    setDragIdx(i);
    setOpenIdx(null);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(i));
  };

  const onDragOver = (i: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragIdx !== null && dragIdx !== i) setDragOverIdx(i);
  };

  const onDrop = (i: number) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) {
      setDragIdx(null); setDragOverIdx(null); return;
    }
    const next = [...inputs];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(i, 0, moved);
    onChange(next);
    setDragIdx(null); setDragOverIdx(null);
  };

  const onDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  // ── bulk actions ─────────────────────────────────────────────
  const handleDedupe = () => {
    const deduped = dedupeAdjacent(inputs);
    if (deduped.length !== inputs.length) {
      onChange(deduped);
      setOpenIdx(null);
    }
  };

  const handleSortByT = () => {
    // step_marker 는 정렬에서 제외 — 위치를 보존
    const hasT = inputs.some((i) => !isStepMarker(i) && typeof i.t === "number");
    if (!hasT) return;
    // 마커 위치 유지를 위해, 마커는 그대로 두고 마커 사이 입력만 t 로 정렬
    const groups: { markerBefore: SeqEntry | null; bucket: SeqEntry[] }[] = [];
    let bucket: SeqEntry[] = [];
    let markerBefore: SeqEntry | null = null;
    for (const e of inputs) {
      if (isStepMarker(e)) {
        groups.push({ markerBefore, bucket });
        markerBefore = e;
        bucket = [];
      } else {
        bucket.push(e);
      }
    }
    groups.push({ markerBefore, bucket });
    const result: SeqEntry[] = [];
    for (const { markerBefore: m, bucket: b } of groups) {
      if (m) result.push(m);
      result.push(...[...b].sort((a, b2) => (a.t ?? 0) - (b2.t ?? 0)));
    }
    onChange(result);
    setOpenIdx(null);
  };

  const dedupeRemovedCount = inputs.length - dedupeAdjacent(inputs).length;
  const hasT = inputs.some((i) => !isStepMarker(i) && typeof i.t === "number");

  // KeyCap 미리보기는 step_marker 제외
  const inputOnly = inputs.filter((i) => !isStepMarker(i));

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
      {/* Bulk actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleDedupe}
          disabled={dedupeRemovedCount === 0}
          className="h-7 px-2.5 rounded-md border border-border bg-surface-overlay text-[11px] font-semibold text-text-secondary hover:text-text hover:border-[rgba(255,255,255,0.24)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="연속해서 같은 입력이 반복되면 첫 입력만 남깁니다"
        >
          인접 중복 제거{dedupeRemovedCount > 0 ? ` (-${dedupeRemovedCount})` : ""}
        </button>
        <button
          type="button"
          onClick={handleSortByT}
          disabled={!hasT}
          className="h-7 px-2.5 rounded-md border border-border bg-surface-overlay text-[11px] font-semibold text-text-secondary hover:text-text hover:border-[rgba(255,255,255,0.24)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title={hasT ? "타이밍(t) 기준으로 재정렬합니다 (구간 marker 위치는 보존)" : "이 콤보는 입력별 타이밍 정보가 없어 시간순 정렬을 할 수 없습니다"}
        >
          정렬 (시간순)
        </button>
        <span className="text-[11px] text-text-muted ml-auto">
          드래그해서 순서 변경 · 클릭해서 편집 · 우클릭으로 삭제
        </span>
      </div>

      {/* Chip flow (입력 + step marker 통합) */}
      {inputs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-overlay px-4 py-6 text-center">
          <p className="text-xs text-text-muted">시퀀스가 비어 있습니다. 아래 팔레트에서 입력을 추가하세요.</p>
        </div>
      ) : (
        <div className="flex items-start gap-1.5 flex-wrap rounded-lg border border-border bg-surface-overlay p-2.5">
          {inputs.map((inp, i) => {
            const isDragging  = dragIdx === i;
            const isDropOver  = dragOverIdx === i && dragIdx !== null && dragIdx !== i;
            const isOpen      = openIdx === i;
            const marker      = isStepMarker(inp);
            const stepNum     = stepNumbers[i];

            // step marker chip
            if (marker) {
              const titleText = inp.title?.trim() || "구간";
              return (
                <div key={inp._id ?? `marker-${i}`} className="relative">
                  {isDropOver && (
                    <span className="absolute -left-1 top-0 bottom-0 w-0.5 bg-gold rounded-full pointer-events-none" />
                  )}
                  <div
                    draggable
                    onDragStart={onDragStart(i)}
                    onDragOver={onDragOver(i)}
                    onDrop={onDrop(i)}
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
                {isDropOver && (
                  <span className="absolute -left-1 top-0 bottom-0 w-0.5 bg-gold rounded-full pointer-events-none" />
                )}
                <div
                  draggable
                  onDragStart={onDragStart(i)}
                  onDragOver={onDragOver(i)}
                  onDrop={onDrop(i)}
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
        </div>
      )}

      {/* KeyCap preview (입력만 — step_marker 제외) */}
      {inputOnly.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap pt-1">
          {inputToKeySequence(inputOnly.map(({ category, ref, slot }) => ({ category, ref, slot }))).map((k, i) => (
            <KeyCap key={i} label={k.label} variant={k.variant} size="sm" />
          ))}
        </div>
      )}

      {/* 팔레트 — 클릭으로 추가 */}
      <Palette
        characterSlug={characterSlug}
        items={items}
        patch={patch}
        requiredItems={requiredItems}
        summonerSpells={summonerSpells}
        onAdd={addToSequence}
      />

      {/* 아이템·소환사 주문 슬롯 매핑 (세부 ref 조정용) */}
      <div className="border-t border-border pt-3">
        <InputKeyMapper inputs={inputs} items={items} patch={patch} onChange={onChange} />
        {inputs.filter(i => i.category === "item" || i.category === "summoner_spell").length === 0 && (
          <p className="text-xs text-text-muted px-1">아이템·소환사 주문 입력이 없습니다. 위 팔레트에서 추가하면 여기서 세부 설정이 가능합니다.</p>
        )}
      </div>
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
  const [videoSrc,         setVideoSrc]         = useState<string | null>(null);
  const [showVideoEditor,  setShowVideoEditor]  = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef     = useRef<HTMLInputElement>(null);

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

  // 입력 통계 (헤더용)
  const inputOnly = sequence.filter((e) => !isStepMarker(e));
  const stepCount = sequence.filter(isStepMarker).length;
  const durationSec = combo.durationMs ? combo.durationMs / 1000 : 0;

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

      {/* ── 입력 시퀀스 ──────────────────────────────── */}
      <div className="bg-surface-raised rounded-xl border border-border overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">입력 시퀀스</p>
          <p className="text-xs text-text-muted mt-0.5">
            총 {inputOnly.length}개 입력
            {stepCount > 0 ? ` · ${stepCount}개 구간` : ""}
            {combo.durationMs ? ` · ${durationSec.toFixed(1)}초` : ""}
          </p>
        </div>

        <div className="px-5 pb-5">
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
