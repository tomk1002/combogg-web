"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
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

interface ItemMeta { id: string; name: string; iconUrl: string }

export interface MappableEntry {
  category: string;
  ref?: string;
  slot?: number | string;
}

interface Props {
  inputs: MappableEntry[];
  items: ItemMeta[];
  patch: string;
  onChange: (updated: MappableEntry[]) => void;
}

// ── inline item search ────────────────────────────────────────
function ItemSlotPicker({ items, current, onSelect }: {
  items: ItemMeta[];
  current?: string;
  onSelect: (id: string | undefined) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
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
    <div ref={ref} className="relative flex-1 min-w-0">
      {currentItem ? (
        <div className="flex items-center gap-2 h-9 px-2 rounded-lg border border-border bg-surface-overlay">
          <Image src={currentItem.iconUrl} alt={currentItem.name} width={20} height={20} sizes="20px" className="rounded-sm shrink-0" />
          <span className="text-xs font-semibold truncate flex-1">{currentItem.name}</span>
          <button
            type="button"
            onClick={() => { onSelect(undefined); setQuery(""); }}
            className="text-text-muted hover:text-text text-xs shrink-0 cursor-pointer"
          >
            ×
          </button>
        </div>
      ) : (
        <input
          type="text"
          value={query}
          placeholder="아이템 검색..."
          onChange={(e) => { setQuery(e.target.value); setOpen(e.target.value.trim().length >= 1); }}
          onFocus={() => query.trim().length >= 1 && setOpen(true)}
          className="w-full h-9 px-3 rounded-lg border border-border bg-surface-overlay text-xs focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
        />
      )}
      {open && filtered.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-surface-overlay shadow-lg overflow-hidden">
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

// ── InputKeyMapper ────────────────────────────────────────────
export default function InputKeyMapper({ inputs, items, patch, onChange }: Props) {
  // Collect unique item slots
  const itemSlots = [...new Set(
    inputs.filter((i) => i.category === "item" && i.slot !== undefined).map((i) => i.slot as number | string)
  )].sort((a, b) => String(a).localeCompare(String(b)));

  // Collect unique summoner spell slots
  const spellSlots = [...new Set(
    inputs.filter((i) => i.category === "summoner_spell" && i.slot !== undefined).map((i) => i.slot as string)
  )];

  if (itemSlots.length === 0 && spellSlots.length === 0) return null;

  const getRef = (category: string, slot: number | string) =>
    inputs.find((i) => i.category === category && i.slot === slot)?.ref;

  const updateRef = (category: string, slot: number | string, ref: string | undefined) => {
    onChange(
      inputs.map((inp) =>
        inp.category === category && inp.slot === slot ? { ...inp, ref } : inp
      )
    );
  };

  return (
    <div className="flex flex-col gap-4 px-6 pb-6">

      {itemSlots.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-text-secondary">아이템 슬롯</span>
          <div className="flex flex-col gap-2">
            {itemSlots.map((slot) => (
              <div key={slot} className="flex items-center gap-3">
                <span className="text-xs font-black text-gold w-10 shrink-0">슬롯 {slot}</span>
                <ItemSlotPicker
                  items={items}
                  current={getRef("item", slot)}
                  onSelect={(id) => updateRef("item", slot, id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {spellSlots.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-text-secondary">소환사 주문 슬롯</span>
          <div className="flex flex-col gap-2">
            {spellSlots.map((slot) => {
              const currentRef = getRef("summoner_spell", slot);
              return (
                <div key={slot} className="flex items-center gap-3">
                  <span className="text-xs font-black text-gold w-10 shrink-0">{slot}</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {COMMON_SUMMONER_SPELLS.map((spell) => {
                      const active = currentRef === spell.id;
                      return (
                        <button
                          key={spell.id}
                          type="button"
                          onClick={() => updateRef("summoner_spell", slot, active ? undefined : spell.id)}
                          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg border transition-colors cursor-pointer ${
                            active ? "bg-gold/20 border-gold/60" : "border-border hover:border-[rgba(255,255,255,0.24)]"
                          }`}
                        >
                          <Image
                            src={getSummonerSpellIconUrl(spell.id, patch)}
                            alt={spell.label}
                            width={24}
                            height={24}
                            sizes="24px"
                            className="rounded-sm"
                          />
                          <span className={`text-[9px] font-semibold leading-none ${active ? "text-gold" : "text-text-muted"}`}>
                            {spell.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
