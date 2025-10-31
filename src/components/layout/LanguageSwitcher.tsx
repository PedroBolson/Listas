import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { Button } from "../ui/Button";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const toggle = useCallback(() => {
    const next = i18n.language === "pt" ? "en" : "pt";
    void i18n.changeLanguage(next);
  }, [i18n]);

  return (
    <Button
      variant="ghost"
      size="sm"
      icon={<Languages className="h-4 w-4" />}
      onClick={toggle}
      aria-label={t("actions.switchLanguage")}
    >
      {i18n.language.toUpperCase()}
    </Button>
  );
}
