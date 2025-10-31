import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  tone?: "brand" | "success" | "warning";
}

const tones: Record<NonNullable<ProgressBarProps["tone"]>, string> = {
  brand: "from-brand to-cyan-400",
  success: "from-emerald-400 to-emerald-500",
  warning: "from-amber-400 to-amber-500",
};

export function ProgressBar({ value, tone = "brand", className, ...props }: ProgressBarProps) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-alt", className)} {...props}>
      <div
        className={cn("h-full bg-gradient-to-r", tones[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
