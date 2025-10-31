import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export function Spinner({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "h-6 w-6 animate-spin rounded-full border-2 border-brand/30 border-t-brand",
        className,
      )}
      {...props}
    />
  );
}
