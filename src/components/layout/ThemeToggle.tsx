import { MoonStar, Sun } from "lucide-react";
import { useTheme } from "../../providers/useTheme";
import { Button } from "../ui/Button";
import { useTranslation } from "react-i18next";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      aria-label={t("actions.toggleTheme")}
      icon={theme === "dark" ? <Sun className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
    >
      {theme === "dark" ? t("actions.lightMode") : t("actions.darkMode")}
    </Button>
  );
}
