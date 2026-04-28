import { cn } from "@/lib/utils";
import type { Difficulty } from "@/types";

const CONFIG: Record<Difficulty, { color: string; label: string; filled: number }> = {
  easy:   { color: "bg-easy",   label: "쉬움",   filled: 1 },
  medium: { color: "bg-medium", label: "보통",   filled: 2 },
  hard:   { color: "bg-hard",   label: "어려움", filled: 3 },
};

interface Props {
  difficulty: Difficulty;
  className?: string;
}

export default function DifficultyPips({ difficulty, className }: Props) {
  const { color, label, filled } = CONFIG[difficulty];
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="inline-flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "w-[5px] h-[5px] rounded-full",
              i <= filled ? color : "bg-[rgba(255,255,255,0.16)]"
            )}
          />
        ))}
      </span>
      <span className="text-[11px] font-semibold text-text-secondary">{label}</span>
    </span>
  );
}
