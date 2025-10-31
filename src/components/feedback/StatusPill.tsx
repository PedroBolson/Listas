import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

interface StatusPillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
}

const tones: Record<NonNullable<StatusPillProps["tone"]>, string> = {
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
  danger: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
  info: "bg-brand-soft text-brand dark:bg-brand-soft/20 dark:text-brand",
  neutral: "bg-surface-alt text-secondary dark:bg-surface-alt/40 dark:text-secondary",
};

export function StatusPill({ className, tone = "info", ...props }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
