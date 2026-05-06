import { cn } from "@/lib/utils";

type KeyVariant = "default" | "spell" | "ult" | "summoner" | "dark";
type KeySize = "sm" | "md" | "lg";

const VARIANT_STYLES: Record<KeyVariant, string> = {
  default:  "bg-[#E8E8E8] text-[#212121] border-[#C0C0C0] shadow-[0_3px_0_#A0A0A0]",
  spell:    "bg-[#1A2540] text-[#7EB8F7] border-[#2A3A60] shadow-[0_3px_0_#0F1830]",
  ult:      "bg-[#2A1F00] text-[#C9A227] border-[#4A3800] shadow-[0_3px_0_#1A1000]",
  summoner: "bg-[#0A2020] text-[#4DB8B8] border-[#1A4040] shadow-[0_3px_0_#051010]",
  dark:     "bg-[#2C313D] text-text-secondary border-border shadow-[0_3px_0_#0F1115]",
};

const SIZE_STYLES: Record<KeySize, { outer: string; inner: string; text: string }> = {
  sm: { outer: "w-6 h-6 rounded-[4px]",    inner: "rounded-[3px] text-[9px]",  text: "text-[9px]"  },
  md: { outer: "w-8 h-8 rounded-[6px]",    inner: "rounded-[4px] text-[11px]", text: "text-[11px]" },
  lg: { outer: "w-10 h-10 rounded-[7px]",  inner: "rounded-[5px] text-[13px]", text: "text-[13px]" },
};

interface KeyCapProps {
  label: string;
  variant?: KeyVariant;
  size?: KeySize;
  pressed?: boolean;
  className?: string;
}

export function KeyCap({ label, variant = "default", size = "md", pressed = false, className }: KeyCapProps) {
  const v = VARIANT_STYLES[variant];
  const s = SIZE_STYLES[size];

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center border font-bold font-mono select-none",
        s.outer,
        v,
        pressed && "translate-y-[2px] shadow-none",
        "transition-transform duration-75",
        className
      )}
    >
      <span className={cn("flex items-center justify-center w-full h-full", s.text, s.inner)}>
        {label}
      </span>
    </span>
  );
}

interface SequenceEntry {
  label: string;
  variant?: KeyVariant;
}

interface KeySequenceProps {
  keys: SequenceEntry[];
  size?: KeySize;
  maxKeys?: number;
  className?: string;
}

export function KeySequence({ keys, size = "sm", maxKeys = 8, className }: KeySequenceProps) {
  const visible = keys.slice(0, maxKeys);
  const overflow = keys.length - maxKeys;

  return (
    <div className={cn("flex items-center gap-1 flex-wrap", className)}>
      {visible.map((k, i) => (
        <KeyCap key={i} label={k.label} variant={k.variant} size={size} />
      ))}
      {overflow > 0 && (
        <span className="text-[10px] text-text-muted font-semibold">+{overflow}</span>
      )}
    </div>
  );
}

export function inputToKeySequence(
  inputs: Array<{ category: string; ref?: string; slot?: number | string }> | null | undefined
): SequenceEntry[] {
  if (!inputs) return [];
  return inputs.map((inp) => {
    if (inp.category === "skill" && inp.ref) {
      const match = inp.ref.match(/([QWER])\d*$/i);
      const key = match ? match[1].toUpperCase() : inp.ref.slice(-1).toUpperCase();
      return { label: key, variant: key === "R" ? "ult" : "spell" };
    }
    if (inp.category === "summoner_spell") {
      return { label: inp.slot?.toString().toUpperCase() ?? "D", variant: "summoner" };
    }
    if (inp.category === "attack") return { label: "AA", variant: "default" };
    if (inp.category === "attack_cancel") return { label: "AA", variant: "dark" };
    if (inp.category === "item") return { label: inp.slot?.toString() ?? "1", variant: "dark" };
    return { label: inp.category.slice(0, 2).toUpperCase(), variant: "dark" };
  });
}
