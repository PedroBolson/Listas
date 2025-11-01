import type { HTMLAttributes } from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

export function Spinner({ className }: Pick<HTMLAttributes<HTMLDivElement>, 'className'>) {
  return (
    <motion.div
      className={cn(
        "h-6 w-6 rounded-full border-[3px] border-muted/20",
        className,
      )}
      style={{
        borderTopColor: "var(--color-brand)",
        borderRightColor: "var(--color-brand)",
        borderBottomColor: "transparent",
      }}
      animate={{ rotate: 360 }}
      transition={{
        duration: 0.6,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}
