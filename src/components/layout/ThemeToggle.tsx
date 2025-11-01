import { MoonStar, Sun } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "../../providers/useTheme";
import { useTranslation } from "react-i18next";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={t("actions.toggleTheme")}
      className="relative flex h-9 w-16 cursor-pointer items-center rounded-full border border-soft bg-surface-alt p-1 transition-colors hover:border-primary/40"
    >
      {/* Indicador animado com ícone */}
      <motion.div
        layout
        initial={false}
        animate={{
          x: isDark ? 28 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-brand shadow-md"
      >
        <motion.div
          initial={false}
          animate={{
            rotate: isDark ? 180 : 0,
            scale: isDark ? 1 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20,
          }}
        >
          {isDark ? (
            <MoonStar className="h-4 w-4 text-white" />
          ) : (
            <Sun className="h-4 w-4 text-white" />
          )}
        </motion.div>
      </motion.div>
    </button>
  );
}
