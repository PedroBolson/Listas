import { motion } from "framer-motion";
import { ArrowLeft, FileText, Shield, AlertCircle, UserCheck, HardDrive, Ban, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatedLogo } from "../../components/branding/AnimatedLogo";
import { ThemeToggle } from "../../components/layout/ThemeToggle";
import { LanguageSwitcher } from "../../components/layout/LanguageSwitcher";

const LAST_UPDATED = "7 de junho de 2026";
const CONTACT_EMAIL = "pedbolson@gmail.com";
const APP_NAME = "ListsHub";

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  delay?: number;
}

function Section({ icon, title, children, delay = 0 }: SectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 300, damping: 28 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
          {icon}
        </div>
        <h2 className="text-lg font-semibold text-primary">{title}</h2>
      </div>
      <div className="space-y-2 pl-11 text-sm leading-relaxed text-secondary">
        {children}
      </div>
    </motion.section>
  );
}

export function TermsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 border-b border-soft bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-surface-alt hover:text-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("legal.back")}
          </button>
          <div className="flex items-center gap-2">
            <AnimatedLogo size={28} />
            <span className="text-sm font-semibold text-primary">{APP_NAME}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6">

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary">{t("terms.title")}</h1>
              <p className="mt-0.5 text-sm text-muted">{t("legal.lastUpdated")}: {LAST_UPDATED}</p>
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-soft bg-surface-alt p-5 text-sm leading-relaxed text-secondary">
            <strong className="text-primary">{APP_NAME}</strong>{" "}{t("terms.introSuffix")}
          </div>
        </motion.div>

        <div className="h-px bg-soft" />

        <Section icon={<UserCheck className="h-4 w-4" />} title={t("terms.s1Title")} delay={0.08}>
          <p>{t("terms.s1p1", { appName: APP_NAME })}</p>
          <p>{t("terms.s1p2")}</p>
          <p>
            <strong className="text-primary">{t("terms.s1membersBold")}</strong>{" "}{t("terms.s1p3suffix")}
          </p>
          <p>{t("terms.s1p4")}</p>
        </Section>

        <Section icon={<Shield className="h-4 w-4" />} title={t("terms.s2Title")} delay={0.14}>
          <p>{t("terms.s2intro")}</p>
          <ul className="ml-4 list-disc space-y-1.5 text-secondary">
            <li>{t("terms.s2li1")}</li>
            <li>{t("terms.s2li2")}</li>
            <li>{t("terms.s2li3")}</li>
            <li>{t("terms.s2li4")}</li>
          </ul>
          <p className="mt-2">{t("terms.s2outro")}</p>
        </Section>

        <Section icon={<HardDrive className="h-4 w-4" />} title={t("terms.s3Title")} delay={0.20}>
          <p>{t("terms.s3p1", { appName: APP_NAME })}</p>
          <p>{t("terms.s3p2")}</p>
          <p>{t("terms.s3p3")}</p>
        </Section>

        <Section icon={<AlertCircle className="h-4 w-4" />} title={t("terms.s4Title")} delay={0.26}>
          <p>{t("terms.s4intro", { appName: APP_NAME })}</p>
          <ul className="ml-4 list-disc space-y-1.5 text-secondary">
            <li>{t("terms.s4li1")}</li>
            <li>{t("terms.s4li2")}</li>
            <li>{t("terms.s4li3")}</li>
            <li>{t("terms.s4li4")}</li>
          </ul>
        </Section>

        <Section icon={<Ban className="h-4 w-4" />} title={t("terms.s5Title")} delay={0.32}>
          <p>
            {t("terms.s5p1pre", { appName: APP_NAME })} <em>{t("terms.s5asIs")}</em>{t("terms.s5p1post")}
          </p>
          <p>{t("terms.s5p2")}</p>
        </Section>

        <Section icon={<FileText className="h-4 w-4" />} title={t("terms.s6Title")} delay={0.38}>
          <p>{t("terms.s6p1")}</p>
          <p>{t("terms.s6p2")}</p>
        </Section>

        <Section icon={<Mail className="h-4 w-4" />} title={t("terms.s7Title")} delay={0.44}>
          <p>
            {t("terms.s7p1")}{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-medium text-brand underline-offset-2 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </p>
        </Section>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-soft bg-surface-alt p-5 text-center text-xs text-muted"
        >
          <p>{APP_NAME} · {t("legal.privateUse")} · {LAST_UPDATED}</p>
          <p className="mt-1">
            <a href="/privacy" className="text-brand underline-offset-2 hover:underline">
              {t("legal.privacy")}
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
