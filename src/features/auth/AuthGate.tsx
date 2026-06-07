import { useMemo, useState, type ReactNode, type FormEvent } from "react";
import {
  motion,
  AnimatePresence,
  useAnimation,
  useReducedMotion,
} from "framer-motion";
import {
  Lock, Mail, ShieldOff, UserRound,
  ArrowLeft, CheckCircle2, Eye, EyeOff, Users, ListChecks,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useAuth } from "./useAuth";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { UpgradePrompt } from "../onboarding/UpgradePrompt";
import { USER_ROLE } from "../../domain/models";
import { AnimatedLogo } from "../../components/branding/AnimatedLogo";
import { ThemeToggle } from "../../components/layout/ThemeToggle";
import { LanguageSwitcher } from "../../components/layout/LanguageSwitcher";

type AuthMode = "sign-in" | "sign-up" | "forgot-password";

// direction: +1 = slide forward (left), -1 = slide back (right)
const MODE_DIRECTION: Record<AuthMode, Partial<Record<AuthMode, number>>> = {
  "sign-in":         { "sign-up": 1,  "forgot-password": -1 },
  "sign-up":         { "sign-in": -1, "forgot-password": -1 },
  "forgot-password": { "sign-in": 1,  "sign-up": 1 },
};

// ── Password strength sub-component ───────────────────────────────────────────

const PASSWORD_CHECKS = [
  { key: "pwCheck8chars",     test: (p: string) => p.length >= 8 },
  { key: "pwCheckUppercase",  test: (p: string) => /[A-Z]/.test(p) },
  { key: "pwCheckLowercase",  test: (p: string) => /[a-z]/.test(p) },
  { key: "pwCheckSpecial",    test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function PasswordStrength({ password }: { password: string }) {
  const { t } = useTranslation();
  const passed = PASSWORD_CHECKS.filter(c => c.test(password)).length;
  const barColor =
    passed <= 1 ? "bg-rose-500" :
    passed === 2 ? "bg-amber-500" :
    passed === 3 ? "bg-yellow-400" : "bg-green-500";

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {PASSWORD_CHECKS.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < passed ? barColor : "bg-surface-alt"
            }`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-0.5">
        {PASSWORD_CHECKS.map(check => {
          const ok = check.test(password);
          return (
            <span
              key={check.key}
              className={`text-xs transition-colors ${ok ? "text-green-500" : "text-muted"}`}
            >
              {ok ? "✓" : "·"} {t(`auth.${check.key}`)}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Error banner ───────────────────────────────────────────────────────────────

function ErrorBanner({ error }: { error: string | null }) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          key="err-outer"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
          className="overflow-hidden"
        >
          <div
            role="alert"
            aria-live="polite"
            className="rounded-xl border border-rose-500/30 bg-rose-500/8 px-4 py-3 text-sm text-rose-600 dark:bg-rose-500/12 dark:text-rose-300"
          >
            {error}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── AuthGate ───────────────────────────────────────────────────────────────────

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { firebaseUser, domainUser, loading, signIn, signUp, resetPassword } = useAuth();
  const { t } = useTranslation();
  const shouldReduce = useReducedMotion();
  const shakeControls = useAnimation();

  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [direction, setDirection] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", displayName: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const navigateTo = (to: AuthMode) => {
    setDirection(MODE_DIRECTION[mode]?.[to] ?? 1);
    setMode(to);
    setError(null);
    setResetSuccess(false);
    setShowPassword(false);
  };

  const errorMap = useMemo(
    () => ({
      "auth/invalid-credential":   t("auth.errors.invalidCredentials"),
      "auth/user-not-found":       t("auth.errors.invalidCredentials"),
      "auth/wrong-password":       t("auth.errors.invalidCredentials"),
      "auth/email-already-in-use": t("auth.errors.emailInUse"),
      "auth/weak-password":        t("auth.errors.weakPassword"),
      "auth/too-many-requests":    t("auth.errors.tooManyRequests"),
    }),
    [t],
  );

  const triggerError = (msg: string) => {
    setError(msg);
    if (!shouldReduce) {
      void shakeControls.start({
        x: [0, -9, 9, -6, 6, -3, 3, 0],
        transition: { duration: 0.42 },
      });
    }
  };

  const validatePassword = (): string | null => {
    const p = form.password;
    if (p.length < 8)           return t("auth.errors.pwLength");
    if (!/[A-Z]/.test(p))       return t("auth.errors.pwUppercase");
    if (!/[a-z]/.test(p))       return t("auth.errors.pwLowercase");
    if (!/[^A-Za-z0-9]/.test(p)) return t("auth.errors.pwSpecial");
    return null;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!form.email)                                    { triggerError(t("auth.errors.requiredEmail")); return; }
    if (mode !== "forgot-password" && !form.password)   { triggerError(t("auth.errors.requiredPassword")); return; }
    if (mode === "sign-up") {
      if (!form.displayName.trim())                     { triggerError(t("auth.errors.requiredName")); return; }
      const pwErr = validatePassword();
      if (pwErr)                                        { triggerError(pwErr); return; }
    }

    setSubmitting(true);
    try {
      if (mode === "sign-in") {
        await signIn(form.email, form.password);
      } else if (mode === "sign-up") {
        await signUp({ email: form.email, password: form.password, displayName: form.displayName.trim() });
      } else {
        await resetPassword(form.email);
        setResetSuccess(true);
      }
    } catch (err) {
      const code = (err as { code?: string }).code;
      triggerError((code && errorMap[code as keyof typeof errorMap]) ?? t("auth.errors.generic"));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Input styles ─────────────────────────────────────────────────────────────
  const inputWrap =
    "flex items-center gap-3 rounded-2xl border border-soft bg-surface-alt px-4 py-3.5 " +
    "transition-all duration-200 focus-within:border-brand focus-within:bg-surface " +
    "focus-within:ring-2 focus-within:ring-brand/20";
  const inputField =
    "w-full border-0 bg-transparent text-sm text-primary outline-none placeholder:text-muted disabled:opacity-50";

  const features = [
    {
      Icon: ListChecks,
      title: t("auth.feature1Title", { defaultValue: "Listas Compartilhadas" }),
      desc:  t("auth.feature1Desc",  { defaultValue: "Crie e compartilhe com a família em tempo real" }),
    },
    {
      Icon: Users,
      title: t("auth.feature2Title", { defaultValue: "Controle de Acesso" }),
      desc:  t("auth.feature2Desc",  { defaultValue: "Escolha quais membros veem cada lista" }),
    },
    {
      Icon: Lock,
      title: t("auth.feature3Title", { defaultValue: "Seguro e Sincronizado" }),
      desc:  t("auth.feature3Desc",  { defaultValue: "Dados na nuvem, sempre atualizados" }),
    },
  ];

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4"
        >
          <Spinner className="h-12 w-12 border-4" />
          <p className="text-sm text-muted">{t("common.loading", { defaultValue: "Carregando..." })}</p>
        </motion.div>
      </div>
    );
  }

  // ── Auth form (unauthenticated) ───────────────────────────────────────────────
  if (!firebaseUser) {
    const slideVariants = {
      enter: (d: number) => shouldReduce ? { opacity: 0 } : { x: d * 44, opacity: 0 },
      center: { x: 0, opacity: 1 },
      exit:  (d: number) => shouldReduce ? { opacity: 0 } : { x: -d * 44, opacity: 0 },
    };

    return (
      <div className="flex min-h-screen bg-background">

        {/* ── LEFT: brand panel (desktop only) ─────────────────────────── */}
        <div className="relative hidden overflow-hidden bg-surface-alt lg:flex lg:w-[46%] lg:flex-col lg:items-start lg:justify-center lg:px-12 lg:py-10">
          {/* Dot-grid texture */}
          <div
            className="absolute inset-0 opacity-60"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(99,102,241,0.18) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />
          {/* Gradient tint */}
          <div className="absolute inset-0 bg-linear-to-br from-brand/6 via-transparent to-accent/6" />

          {/* Ambient orbs */}
          <motion.div
            className="pointer-events-none absolute -top-48 -left-48 h-[600px] w-[600px] rounded-full bg-brand/8 blur-3xl"
            animate={shouldReduce ? {} : { scale: [1, 1.08, 1], opacity: [0.5, 0.85, 0.5] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute -bottom-40 -right-20 h-[400px] w-[400px] rounded-full bg-accent/8 blur-3xl"
            animate={shouldReduce ? {} : { scale: [1, 1.12, 1], opacity: [0.35, 0.65, 0.35] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          />

          {/* Content — relative to sit above the orbs */}
          <div className="relative z-10 flex w-full max-w-[400px] flex-col gap-7">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <AnimatedLogo size={44} />
              <span className="text-xl font-bold text-primary">ListsHub</span>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 280, damping: 26 }}
            >
              <h2 className="text-[2.6rem] font-bold leading-tight tracking-tight text-primary">
                {t("auth.heroLine1")}<br />{t("auth.heroLine2")}
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-muted">
                {t("auth.heroSubtitle")}
              </p>
            </motion.div>

            {/* Features */}
            <div className="space-y-4">
              {features.map((feat, i) => (
                <motion.div
                  key={feat.title}
                  initial={shouldReduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.26 + i * 0.11, type: "spring", stiffness: 260, damping: 24 }}
                  className="flex items-start gap-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <feat.Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-primary">{feat.title}</p>
                    <p className="text-sm text-muted">{feat.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Accent bars */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
              className="flex items-center gap-1.5"
            >
              {[28, 8, 8].map((w, i) => (
                <motion.div
                  key={i}
                  className="h-1.5 rounded-full bg-brand"
                  style={{ width: w }}
                  animate={shouldReduce ? {} : { opacity: [0.4, 1, 0.4] }}
                  transition={{ delay: i * 0.45, duration: 2.8, repeat: Infinity }}
                />
              ))}
            </motion.div>
          </div>
        </div>

        {/* ── RIGHT: auth form ──────────────────────────────────────────── */}
        <div className="flex min-h-screen flex-1 flex-col items-center justify-center p-5 sm:p-8">
          <div className="w-full max-w-[420px]">

            {/* Theme + Language toggles */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-5 flex justify-end gap-2"
            >
              <LanguageSwitcher />
              <ThemeToggle />
            </motion.div>

            {/* Mobile logo */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-7 flex flex-col items-center gap-2 lg:hidden"
            >
              <AnimatedLogo size={64} />
              <span className="text-lg font-bold text-primary">ListsHub</span>
            </motion.div>

            {/* Card */}
            <motion.div
              initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 28, delay: 0.06 }}
              className="overflow-hidden rounded-3xl border border-soft bg-surface shadow-soft"
            >
              <motion.div animate={shakeControls}>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={mode}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: "spring", stiffness: 380, damping: 34 }}
                  className="p-7 sm:p-8"
                >

                  {/* ── SIGN IN ─────────────────────────────────────────── */}
                  {mode === "sign-in" && (
                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                      <div>
                        <h1 className="text-2xl font-bold text-primary">
                          {t("auth.signInHeading", { defaultValue: "Bem-vindo de volta" })}
                        </h1>
                        <p className="mt-1 text-sm text-muted">
                          {t("auth.subtitle", { defaultValue: "Entre com seu e-mail e senha" })}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <label className="flex flex-col gap-1.5 text-sm font-medium text-secondary">
                          {t("auth.email")}
                          <span className={inputWrap}>
                            <Mail className="h-4 w-4 shrink-0 text-brand" />
                            <input
                              name="email" type="email" autoComplete="email"
                              placeholder={t("auth.emailPlaceholder")}
                              className={inputField}
                              value={form.email}
                              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                              disabled={submitting}
                            />
                          </span>
                        </label>

                        <label className="flex flex-col gap-1.5 text-sm font-medium text-secondary">
                          {t("auth.password")}
                          <span className={inputWrap}>
                            <Lock className="h-4 w-4 shrink-0 text-brand" />
                            <input
                              name="password" type={showPassword ? "text" : "password"}
                              autoComplete="current-password" placeholder="••••••••"
                              className={inputField}
                              value={form.password}
                              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                              disabled={submitting}
                            />
                            <button
                              type="button" tabIndex={-1}
                              onClick={() => setShowPassword(v => !v)}
                              className="shrink-0 text-muted transition hover:text-secondary"
                              aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                            >
                              {showPassword
                                ? <EyeOff className="h-4 w-4" />
                                : <Eye className="h-4 w-4" />}
                            </button>
                          </span>
                        </label>
                      </div>

                      <ErrorBanner error={error} />

                      <Button className="w-full justify-center" size="lg" type="submit" isLoading={submitting}>
                        {t("auth.signInButton", { defaultValue: "Entrar" })}
                      </Button>

                      <div className="flex items-center justify-between text-sm">
                        <button type="button" onClick={() => navigateTo("sign-up")}
                          className="font-medium text-brand transition hover:text-brand-strong"
                        >
                          {t("auth.switchToRegister", { defaultValue: "Criar conta" })}
                        </button>
                        <button type="button" onClick={() => navigateTo("forgot-password")}
                          className="text-muted transition hover:text-secondary"
                          disabled={submitting}
                        >
                          {t("auth.forgotPassword", { defaultValue: "Esqueci minha senha" })}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* ── SIGN UP ─────────────────────────────────────────── */}
                  {mode === "sign-up" && (
                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                      <div>
                        <h1 className="text-2xl font-bold text-primary">
                          {t("auth.signUpHeading", { defaultValue: "Criar conta" })}
                        </h1>
                        <p className="mt-1 text-sm text-muted">
                          {t("auth.firstAccessHint", { defaultValue: "Crie a conta titular e monte sua família" })}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <label className="flex flex-col gap-1.5 text-sm font-medium text-secondary">
                          {t("auth.name")}
                          <span className={inputWrap}>
                            <UserRound className="h-4 w-4 shrink-0 text-brand" />
                            <input
                              name="displayName" type="text" autoComplete="name"
                              placeholder={t("auth.namePlaceholder")}
                              className={inputField}
                              value={form.displayName}
                              onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
                              disabled={submitting}
                            />
                          </span>
                        </label>

                        <label className="flex flex-col gap-1.5 text-sm font-medium text-secondary">
                          {t("auth.email")}
                          <span className={inputWrap}>
                            <Mail className="h-4 w-4 shrink-0 text-brand" />
                            <input
                              name="email" type="email" autoComplete="email"
                              placeholder={t("auth.emailPlaceholder")}
                              className={inputField}
                              value={form.email}
                              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                              disabled={submitting}
                            />
                          </span>
                        </label>

                        <div>
                          <label className="flex flex-col gap-1.5 text-sm font-medium text-secondary">
                            {t("auth.password")}
                            <span className={inputWrap}>
                              <Lock className="h-4 w-4 shrink-0 text-brand" />
                              <input
                                name="password" type={showPassword ? "text" : "password"}
                                autoComplete="new-password" placeholder={t("auth.passwordPlaceholder")}
                                className={inputField}
                                value={form.password}
                                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                                disabled={submitting}
                              />
                              <button
                                type="button" tabIndex={-1}
                                onClick={() => setShowPassword(v => !v)}
                                className="shrink-0 text-muted transition hover:text-secondary"
                                aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                              >
                                {showPassword
                                  ? <EyeOff className="h-4 w-4" />
                                  : <Eye className="h-4 w-4" />}
                              </button>
                            </span>
                          </label>
                          {form.password && <PasswordStrength password={form.password} />}
                        </div>
                      </div>

                      <ErrorBanner error={error} />

                      <Button className="w-full justify-center" size="lg" type="submit" isLoading={submitting}>
                        {t("auth.signUpButton", { defaultValue: "Criar conta titular" })}
                      </Button>

                      <p className="text-center text-xs text-muted">
                        {t("auth.consentPrefix")}{" "}
                        <Link to="/terms" target="_blank"
                          className="text-brand underline-offset-2 hover:underline">
                          {t("legal.terms")}
                        </Link>
                        {" "}{t("auth.consentAnd")}{" "}
                        <Link to="/privacy" target="_blank"
                          className="text-brand underline-offset-2 hover:underline">
                          {t("legal.privacy")}
                        </Link>.
                      </p>

                      <div className="text-center text-sm">
                        <button type="button" onClick={() => navigateTo("sign-in")}
                          className="font-medium text-brand transition hover:text-brand-strong"
                        >
                          {t("auth.switchToLogin", { defaultValue: "Já tenho conta" })}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* ── FORGOT PASSWORD ─────────────────────────────────── */}
                  {mode === "forgot-password" && (
                    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                      <div>
                        <button type="button" onClick={() => navigateTo("sign-in")}
                          className="mb-4 flex items-center gap-1.5 text-sm text-muted transition hover:text-secondary"
                        >
                          <ArrowLeft className="h-4 w-4" />
                          {t("actions.back", { defaultValue: "Voltar" })}
                        </button>
                        <h1 className="text-2xl font-bold text-primary">
                          {t("auth.forgotTitle")}
                        </h1>
                        <p className="mt-1 text-sm text-muted">
                          {t("auth.forgotHint")}
                        </p>
                      </div>

                      <AnimatePresence mode="wait">
                        {resetSuccess ? (
                          <motion.div
                            key="success"
                            initial={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ type: "spring", stiffness: 360, damping: 28 }}
                            className="flex flex-col items-center gap-5 py-8 text-center"
                          >
                            <motion.div
                              initial={{ scale: 0, rotate: -20 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: "spring", stiffness: 340, damping: 20, delay: 0.1 }}
                              className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-500"
                            >
                              <CheckCircle2 className="h-9 w-9" />
                            </motion.div>
                            <div>
                              <p className="font-semibold text-primary">{t("auth.emailSent")}</p>
                              <p className="mt-1.5 text-sm text-muted">
                                {t("auth.resetSent", { defaultValue: "Enviamos o link de redefinição para o seu e-mail." })}
                              </p>
                            </div>
                            <button type="button" onClick={() => navigateTo("sign-in")}
                              className="text-sm font-medium text-brand transition hover:text-brand-strong"
                            >
                              {t("auth.backToLogin")}
                            </button>
                          </motion.div>
                        ) : (
                          <motion.div key="forgot-form" className="space-y-4">
                            <label className="flex flex-col gap-1.5 text-sm font-medium text-secondary">
                              {t("auth.email")}
                              <span className={inputWrap}>
                                <Mail className="h-4 w-4 shrink-0 text-brand" />
                                <input
                                  name="email" type="email" autoComplete="email"
                                  placeholder={t("auth.emailPlaceholder")}
                                  className={inputField}
                                  value={form.email}
                                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                  disabled={submitting}
                                  autoFocus
                                />
                              </span>
                            </label>

                            <ErrorBanner error={error} />

                            <Button className="w-full justify-center" size="lg" type="submit" isLoading={submitting}>
                              {t("auth.sendReset")}
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </form>
                  )}

                </motion.div>
              </AnimatePresence>
              </motion.div>
            </motion.div>

            {/* Footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="mt-5 text-center text-xs text-muted"
            >
              <Link to="/terms" className="transition hover:text-secondary">{t("legal.terms")}</Link>
              {" · "}
              <Link to="/privacy" className="transition hover:text-secondary">{t("legal.privacy")}</Link>
            </motion.p>
          </div>
        </div>
      </div>
    );
  }

  // ── Account not active ─────────────────────────────────────────────────────────
  if (!domainUser?.isActive) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <UpgradePrompt
          title={t("auth.removed")}
          description={t("auth.upgradeDescription")}
          onUpgrade={() => undefined}
        />
      </div>
    );
  }

  // ── Billing suspended ──────────────────────────────────────────────────────────
  if (domainUser.role === USER_ROLE.TITULAR && domainUser.billing?.status === "suspended") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg text-center" padding="lg" elevated>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-danger">
            <ShieldOff className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-primary">{t("status.suspended")}</h2>
          <p className="mt-3 text-sm text-muted">{t("billing.overLimit")}</p>
          <Button className="mt-6 w-full justify-center" size="lg">
            {t("actions.managePlan")}
          </Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
