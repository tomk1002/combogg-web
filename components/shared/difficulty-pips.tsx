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
  forceDark?: boolean;
}

export default function DifficultyPips({ difficulty, className, forceDark }: Props) {
  const { color, label, filled } = CONFIG[difficulty];
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="inline-flex items-center gap-0.5">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "w-[5px] h-[5px] rounded-full shrink-0",
              i <= filled ? color : forceDark ? "bg-white/20" : "bg-text-muted"
            )}
          />
        ))}
      </span>
      <span className={cn("text-[11px] font-semibold leading-none", forceDark ? "text-white/75" : "text-text-secondary")}>{label}</span>
    </span>
  );
}
