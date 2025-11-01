import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const isPT = i18n.language === "pt";

  const toggle = useCallback(() => {
    const next = isPT ? "en" : "pt";
    void i18n.changeLanguage(next);
  }, [i18n, isPT]);

  return (
    <button
      onClick={toggle}
      aria-label={t("actions.switchLanguage")}
      className="relative flex h-9 w-20 cursor-pointer items-center rounded-full border border-soft bg-surface-alt px-1 transition-colors hover:border-primary/40"
    >
      {/* Texto animado do lado oposto do indicador */}
      <AnimatePresence mode="wait">
        {isPT ? (
          <motion.span
            key="pt"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-2 text-xs font-semibold text-primary"
          >
            PT
          </motion.span>
        ) : (
          <motion.span
            key="en"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute left-2 text-xs font-semibold text-primary"
          >
            EN
          </motion.span>
        )}
      </AnimatePresence>

      {/* Indicador animado com ícone fixo */}
      <motion.div
        layout
        initial={false}
        animate={{
          x: isPT ? 0 : 36,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-brand shadow-md"
      >
        <Languages className="h-4 w-4 text-white" />
      </motion.div>
    </button>
  );
}
