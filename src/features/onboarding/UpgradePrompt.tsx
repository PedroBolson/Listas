import { type ReactNode } from "react";
import { Sparkle, Crown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

interface UpgradePromptProps {
  title?: ReactNode;
  description?: ReactNode;
  onUpgrade?: () => void;
}

export function UpgradePrompt({ title, description, onUpgrade }: UpgradePromptProps) {
  const { t } = useTranslation();

  return (
    <Card className="w-full max-w-xl text-center" padding="lg" elevated>
      <motion.div
        className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 18 }}
      >
        <Sparkle className="h-8 w-8" />
      </motion.div>
      <div className="mt-6 space-y-2">
        <h2 className="text-2xl font-semibold text-primary">
          {title ?? t("auth.becomeTitular")}
        </h2>
        <p className="text-sm text-muted">
          {description ?? t("auth.upgradeDescription")}
        </p>
      </div>
      <Button
        className="mt-6"
        size="lg"
        icon={<Crown className="h-4 w-4" />}
        variant="primary"
        onClick={onUpgrade}
      >
        {t("actions.upgrade")}
      </Button>
    </Card>
  );
}
