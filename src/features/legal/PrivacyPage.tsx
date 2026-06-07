import { motion } from "framer-motion";
import { ArrowLeft, ShieldCheck, Database, Eye, Trash2, Lock, Mail, Globe, UserCheck } from "lucide-react";
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

export function PrivacyPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const dataRows = [
    [t("privacy.s1t0name"), t("privacy.s1t0desc")],
    [t("privacy.s1t1name"), t("privacy.s1t1desc")],
    [t("privacy.s1t2name"), t("privacy.s1t2desc")],
    [t("privacy.s1t3name"), t("privacy.s1t3desc")],
    [t("privacy.s1t4name"), t("privacy.s1t4desc")],
  ];

  const rightsRows = [
    [t("privacy.s5r0name"), t("privacy.s5r0desc")],
    [t("privacy.s5r1name"), t("privacy.s5r1desc")],
    [t("privacy.s5r2name"), t("privacy.s5r2desc")],
    [t("privacy.s5r3name"), t("privacy.s5r3desc")],
    [t("privacy.s5r4name"), t("privacy.s5r4desc")],
  ];

  const deletionSubject = t("privacy.s6p3subject", { appName: APP_NAME });

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
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary">{t("privacy.title")}</h1>
              <p className="mt-0.5 text-sm text-muted">{t("legal.lastUpdated")}: {LAST_UPDATED}</p>
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-soft bg-surface-alt p-5 text-sm leading-relaxed text-secondary">
            {t("privacy.introPre")}{" "}<strong className="text-primary">{APP_NAME}</strong>{" "}{t("privacy.introMid")}{" "}
            <strong className="text-primary">{t("privacy.lgpdName")}</strong>.
          </div>
        </motion.div>

        <div className="h-px bg-soft" />

        <Section icon={<Database className="h-4 w-4" />} title={t("privacy.s1Title")} delay={0.08}>
          <p>{t("privacy.s1intro")}</p>
          <div className="mt-3 overflow-hidden rounded-xl border border-soft">
            {dataRows.map(([name, desc], i) => (
              <div
                key={name}
                className={`flex items-start gap-4 px-4 py-3 text-sm ${i > 0 ? "border-t border-soft" : ""}`}
              >
                <span className="min-w-[140px] font-medium text-primary">{name}</span>
                <span className="text-muted">{desc}</span>
              </div>
            ))}
          </div>
          <p className="mt-3">{t("privacy.s1outro")}</p>
        </Section>

        <Section icon={<Eye className="h-4 w-4" />} title={t("privacy.s2Title")} delay={0.14}>
          <p>{t("privacy.s2intro")}</p>
          <ul className="ml-4 list-disc space-y-1.5 text-secondary">
            <li>{t("privacy.s2li1")}</li>
            <li>{t("privacy.s2li2")}</li>
            <li>{t("privacy.s2li3")}</li>
            <li>{t("privacy.s2li4")}</li>
          </ul>
          <p className="mt-2">
            <strong className="text-primary">{t("privacy.s2noBold")}</strong>{" "}{t("privacy.s2noSuffix")}
          </p>
        </Section>

        <Section icon={<Globe className="h-4 w-4" />} title={t("privacy.s3Title")} delay={0.20}>
          <p>
            {t("privacy.s3p1pre", { appName: APP_NAME })}{" "}<strong className="text-primary">Google Firebase</strong>{" "}{t("privacy.s3p1post")}
          </p>
          <p>
            {t("privacy.s3p2pre")}{" "}<em>EU-U.S. Data Privacy Framework</em>{" "}{t("privacy.s3p2post")}
          </p>
          <p>
            {t("privacy.s3p3pre")}{" "}
            <a
              href="https://firebase.google.com/support/privacy"
              target="_blank" rel="noopener noreferrer"
              className="text-brand underline-offset-2 hover:underline"
            >
              {t("privacy.s3firebaseLink")}
            </a>{" "}
            {t("privacy.s3p3post")}
          </p>
        </Section>

        <Section icon={<Lock className="h-4 w-4" />} title={t("privacy.s4Title")} delay={0.26}>
          <p>{t("privacy.s4intro")}</p>
          <ul className="ml-4 list-disc space-y-1.5 text-secondary">
            <li>{t("privacy.s4li1")}</li>
            <li>{t("privacy.s4li2")}</li>
            <li>{t("privacy.s4li3")}</li>
            <li>{t("privacy.s4li4")}</li>
          </ul>
          <p className="mt-2">{t("privacy.s4outro")}</p>
        </Section>

        <Section icon={<UserCheck className="h-4 w-4" />} title={t("privacy.s5Title")} delay={0.32}>
          <p>{t("privacy.s5intro")}</p>
          <div className="mt-3 space-y-2">
            {rightsRows.map(([name, desc]) => (
              <div key={name} className="flex items-start gap-3 rounded-xl border border-soft bg-surface-alt px-4 py-3 text-sm">
                <span className="min-w-[100px] font-medium text-primary">{name}</span>
                <span className="text-muted">{desc}</span>
              </div>
            ))}
          </div>
          <p className="mt-3">{t("privacy.s5outro")}</p>
        </Section>

        <Section icon={<Trash2 className="h-4 w-4" />} title={t("privacy.s6Title")} delay={0.38}>
          <p>{t("privacy.s6p1")}</p>
          <p>{t("privacy.s6p2")}</p>
          <p>
            {t("privacy.s6p3pre")}{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${deletionSubject}`}
              className="font-medium text-brand underline-offset-2 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>{" "}
            {t("privacy.s6p3mid")} <em>"{deletionSubject}"</em>.
          </p>
        </Section>

        <Section icon={<Mail className="h-4 w-4" />} title={t("privacy.s7Title")} delay={0.44}>
          <p>{t("privacy.s7p1", { appName: APP_NAME })}</p>
          <p>{t("privacy.s7p2")}</p>
          <div className="mt-2 rounded-xl border border-soft bg-surface-alt px-4 py-3">
            <p className="text-sm font-medium text-primary">Pedro Bolson</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-sm font-medium text-brand underline-offset-2 hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
          <p className="mt-2">
            {t("privacy.s7anpdPre")}{" "}
            <strong className="text-primary">{t("privacy.s7anpdName")}</strong>{" "}
            {t("privacy.s7anpdPost")}{" "}
            <a
              href="https://www.gov.br/anpd"
              target="_blank" rel="noopener noreferrer"
              className="text-brand underline-offset-2 hover:underline"
            >
              www.gov.br/anpd
            </a>.
          </p>
        </Section>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.52 }}
          className="rounded-2xl border border-soft bg-surface-alt p-5 text-center text-xs text-muted"
        >
          <p>{APP_NAME} · {t("privacy.footer")} · {LAST_UPDATED}</p>
          <p className="mt-1">
            <a href="/terms" className="text-brand underline-offset-2 hover:underline">
              {t("legal.terms")}
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
