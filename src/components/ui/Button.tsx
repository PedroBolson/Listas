import { forwardRef } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

type BaseButtonProps = ComponentPropsWithoutRef<typeof motion.button>;

interface ButtonProps extends Omit<BaseButtonProps, "className"> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  trailingIcon?: ReactNode;
  isLoading?: boolean;
  className?: string;
  children?: ReactNode;
}

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ring-brand cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand text-white shadow-soft hover:shadow-lg hover:brightness-105 focus-visible:ring-offset-background",
  secondary:
    "bg-brand-soft text-brand hover:bg-brand/10 focus-visible:ring-offset-background",
  ghost:
    "bg-transparent text-primary hover:bg-brand-soft/60 focus-visible:ring-offset-background",
  outline:
    "border border-soft text-primary hover:border-brand hover:text-brand focus-visible:ring-offset-background",
};

const sizes: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-5 text-base",
  lg: "h-14 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", icon, trailingIcon, children, disabled, isLoading, ...props }, ref) => {
    const content = (
      <>
        {icon ? <span className="text-lg">{icon}</span> : null}
        <span>{children}</span>
        {trailingIcon ? <span className="text-lg">{trailingIcon}</span> : null}
      </>
    );

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        whileHover={{ translateY: disabled ? 0 : -1 }}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-transparent border-t-white" />
        ) : (
          content
        )}
      </motion.button>
    );
  },
);

Button.displayName = "Button";
