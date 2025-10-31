import type { ComponentPropsWithoutRef } from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

type BaseCardProps = ComponentPropsWithoutRef<typeof motion.div>;

interface CardProps extends Omit<BaseCardProps, "className"> {
  padding?: "sm" | "md" | "lg" | "none";
  elevated?: boolean;
  className?: string;
}

const paddings = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
} as const;

export function Card({ className, padding = "md", elevated = false, ...props }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" as const }}
      className={cn(
        "bg-surface rounded-3xl border border-soft text-primary shadow-soft/40",
        elevated ? "shadow-soft" : "",
        paddings[padding],
        className,
      )}
      {...props}
    />
  );
}
