import type { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  name?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
} as const;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({ src, alt, name, fallback, size = "md", className, ...props }: AvatarProps) {
  const displayText = fallback || (name ? getInitials(name) : "?");

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-full bg-brand-soft text-brand font-medium",
        sizes[size],
        className,
      )}
      {...props}
    >
      {src ? <img src={src} alt={alt || name} className="h-full w-full object-cover" /> : displayText}
    </div>
  );
}
