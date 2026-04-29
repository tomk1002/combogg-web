"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import type { LolGameSpecific } from "@/lib/games/lol/schema";
import { getSummonerSpellIconUrl } from "@/lib/games/lol/ddragon";

const COMMON_SUMMONER_SPELLS = [
  { id: "SummonerFlash",    label: "점멸" },
  { id: "SummonerDot",      label: "점화" },
  { id: "SummonerExhaust",  label: "탈진" },
  { id: "SummonerHaste",    label: "유체화" },
  { id: "SummonerHeal",     label: "회복" },
  { id: "SummonerBarrier",  label: "방어막" },
  { id: "SummonerSmite",    label: "강타" },
  { id: "SummonerTeleport", label: "순간이동" },
];

const SKILL_KEYS = ["Q", "W", "E", "R"] as const;

interface ItemMeta {
  id: string;
  name: string;
  iconUrl: string;
}

interface Props {
  value: Partial<LolGameSpecific>;
  onChange: (v: Partial<LolGameSpecific>) => void;
  items: ItemMeta[];
  patch: string;
}

// ── Item Picker ───────────────────────────────────────────────
interface ItemPickerProps {
  items: ItemMeta[];
  selected: string[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}

function ItemPicker({ items, selected, onAdd, onRemove }: ItemPickerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim().length >= 1
    ? items
        .filter((item) =>
          item.name.toLowerCase().includes(query.trim().toLowerCase()) ||
          item.id.includes(query.trim())
        )
        .slice(0, 6)
    : [];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleAdd = (id: string) => {
    if (!selected.includes(id)) {
      onAdd(id);
    }
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((id) => {
            const item = items.find((i) => i.id === id);
            return (
              <span
                key={id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-surface-overlay border border-border text-xs"
              >
                {item && (
                  <Image
                    src={item.iconUrl}
                    alt={item.name}
                    width={20}
                    height={20}
                    sizes="20px"
                    className="rounded-sm shrink-0"
                  />
                )}
                <span>{item?.name ?? id}</span>
                <button
                  type="button"
                  onClick={() => onRemove(id)}
                  className="text-text-muted hover:text-text transition-colors leading-none cursor-pointer"
                  aria-label={`${item?.name ?? id} 제거`}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Search input + dropdown */}
      <div ref={containerRef} className="relative">
        <input
          type="text"
          value={query}
          placeholder="아이템 검색..."
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(e.target.value.trim().length >= 1);
          }}
          onFocus={() => query.trim().length >= 1 && setOpen(true)}
          className="w-full h-9 px-3 rounded-lg border border-border bg-surface-overlay text-sm focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
        />

        {open && filtered.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-surface-overlay shadow-lg overflow-hidden">
            {filtered.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleAdd(item.id); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-surface-raised transition-colors cursor-pointer"
                >
                  <Image
                    src={item.iconUrl}
                    alt={item.name}
                    width={24}
                    height={24}
                    sizes="24px"
                    className="rounded-sm shrink-0"
                  />
                  <span className="truncate">{item.name}</span>
                  <span className="text-text-muted text-xs ml-auto shrink-0">{item.id}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── LolUploadForm ─────────────────────────────────────────────
export default function LolUploadForm({ value, onChange, items, patch }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const set = <K extends keyof LolGameSpecific>(key: K, v: LolGameSpecific[K] | undefined) =>
    onChange({ ...value, [key]: v });

  const toggleSpell = (id: string) => {
    const cur = value.summoner_spells ?? [];
    const next = cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id];
    set("summoner_spells", next.length ? next : undefined);
  };

  const handleItemAdd = (id: string) => {
    const cur = value.required_items ?? [];
    if (!cur.includes(id)) {
      set("required_items", [...cur, id]);
    }
  };

  const handleItemRemove = (id: string) => {
    const next = (value.required_items ?? []).filter((i) => i !== id);
    set("required_items", next.length ? next : undefined);
  };

  return (
    <div className="flex flex-col">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-6 py-4 text-left cursor-pointer hover:bg-surface-overlay/50 transition-colors"
      >
        <span className="text-xs font-bold uppercase tracking-wide text-text-secondary">
          LoL 조건 <span className="font-normal normal-case text-text-muted">(선택)</span>
        </span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className={`text-text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <div className="flex flex-col gap-5 px-6 pb-6">
          {/* 레벨 */}
          <div className="grid grid-cols-3 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-text-secondary">최소 레벨</span>
              <input
                type="number"
                min={1}
                max={18}
                placeholder="1 – 18"
                value={value.required_level ?? ""}
                onChange={(e) => set("required_level", e.target.value ? Number(e.target.value) : undefined)}
                className="h-9 px-3 rounded-lg border border-border bg-surface-overlay text-sm focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-text-secondary">최소 스킬 가속</span>
              <input
                type="number"
                min={0}
                placeholder="예: 20"
                value={value.ability_haste_min ?? ""}
                onChange={(e) => set("ability_haste_min", e.target.value ? Number(e.target.value) : undefined)}
                className="h-9 px-3 rounded-lg border border-border bg-surface-overlay text-sm focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-text-secondary">최소 공격 속도</span>
              <input
                type="number"
                min={0}
                step={0.1}
                placeholder="예: 1.5"
                value={value.attack_speed_min ?? ""}
                onChange={(e) => set("attack_speed_min", e.target.value ? Number(e.target.value) : undefined)}
                className="h-9 px-3 rounded-lg border border-border bg-surface-overlay text-sm focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
              />
            </label>
          </div>

          {/* 소환사 주문 — icon buttons */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-text-secondary">소환사 주문</span>
            <div className="flex gap-2 flex-wrap">
              {COMMON_SUMMONER_SPELLS.map((spell) => {
                const active = (value.summoner_spells ?? []).includes(spell.id);
                return (
                  <button
                    key={spell.id}
                    type="button"
                    onClick={() => toggleSpell(spell.id)}
                    className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      active
                        ? "bg-gold/20 border-gold/60"
                        : "border-border hover:border-[rgba(255,255,255,0.24)]"
                    }`}
                  >
                    <Image
                      src={getSummonerSpellIconUrl(spell.id, patch)}
                      alt={spell.label}
                      width={28}
                      height={28}
                      sizes="28px"
                      className="rounded-sm"
                    />
                    <span className={`text-[10px] font-semibold leading-none ${active ? "text-gold" : "text-text-secondary"}`}>
                      {spell.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 필요 아이템 — picker */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-text-secondary">필요 아이템</span>
            <ItemPicker
              items={items}
              selected={value.required_items ?? []}
              onAdd={handleItemAdd}
              onRemove={handleItemRemove}
            />
          </div>

          {/* 필요 스킬 레벨 */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-text-secondary">필요 스킬 레벨</span>
            <div className="grid grid-cols-4 gap-2">
              {SKILL_KEYS.map((skill) => {
                const cur = (value.required_skills ?? {})[skill];
                return (
                  <label key={skill} className="flex flex-col gap-1 items-center">
                    <span className="text-xs font-black text-gold">{skill}</span>
                    <select
                      value={cur ?? ""}
                      onChange={(e) => {
                        const next = { ...(value.required_skills ?? {}) };
                        if (e.target.value) next[skill] = Number(e.target.value);
                        else delete next[skill];
                        set("required_skills", Object.keys(next).length ? next as Record<"Q"|"W"|"E"|"R", number> : undefined);
                      }}
                      className="w-full h-9 px-2 rounded-lg border border-border bg-surface-overlay text-sm text-center focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
                    >
                      <option value="">-</option>
                      {[1,2,3,4,5].map((lv) => (
                        <option key={lv} value={lv}>Lv.{lv}</option>
                      ))}
                    </select>
                  </label>
                );
              })}
            </div>
            <p className="text-[10px] text-text-muted">콤보에 필요한 최소 스킬 레벨. 예: R Lv.1 = 6레벨 이상</p>
          </div>
        </div>
      )}
    </div>
  );
}
