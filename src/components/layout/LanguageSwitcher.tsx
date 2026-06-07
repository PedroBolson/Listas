import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const isPT = i18n.language.startsWith("pt");

  const toggle = useCallback(() => {
    void i18n.changeLanguage(isPT ? "en" : "pt");
  }, [i18n, isPT]);

  return (
    <motion.button
      onClick={toggle}
      aria-label={t("actions.switchLanguage")}
      className="relative flex h-9 w-14 items-center justify-center overflow-hidden rounded-full border border-soft bg-surface-alt text-xs font-semibold text-secondary transition-colors hover:border-brand/40 hover:bg-brand-soft hover:text-brand"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.87 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isPT ? "pt" : "en"}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          {isPT ? "PT" : "EN"}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
