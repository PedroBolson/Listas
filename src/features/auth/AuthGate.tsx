import { useMemo, useState, type ReactNode, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, ShieldOff, Sparkles, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "./useAuth";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { UpgradePrompt } from "../onboarding/UpgradePrompt";
import { USER_ROLE } from "../../domain/models";
import { AnimatedLogo } from "../../components/branding/AnimatedLogo";

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { firebaseUser, domainUser, loading, signIn, signUp, resetPassword } = useAuth();
  const { t } = useTranslation();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const toggleMode = () => {
    setMode((current) => (current === "sign-in" ? "sign-up" : "sign-in"));
    setError(null);
    setFeedback(null);
  };

  const errorMap = useMemo(
    () => ({
      "auth/invalid-credential": t("auth.errors.invalidCredentials"),
      "auth/user-not-found": t("auth.errors.invalidCredentials"),
      "auth/wrong-password": t("auth.errors.invalidCredentials"),
      "auth/email-already-in-use": t("auth.errors.emailInUse"),
      "auth/weak-password": t("auth.errors.weakPassword"),
      "auth/too-many-requests": t("auth.errors.tooManyRequests"),
    }),
    [t],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFeedback(null);

    if (!form.email) {
      setError(t("auth.errors.requiredEmail"));
      return;
    }
    if (!form.password) {
      setError(t("auth.errors.requiredPassword"));
      return;
    }
    if (mode === "sign-up" && !form.displayName.trim()) {
      setError(t("auth.errors.requiredName"));
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "sign-in") {
        await signIn(form.email, form.password);
      } else {
        await signUp({
          email: form.email,
          password: form.password,
          displayName: form.displayName.trim(),
        });
      }
    } catch (err) {
      const code = (err as { code?: string }).code;
      setError((code && errorMap[code as keyof typeof errorMap]) ?? t("auth.errors.generic"));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordReset = async () => {
    setError(null);
    setFeedback(null);
    if (!form.email) {
      setError(t("auth.errors.requiredEmail"));
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(form.email);
      setFeedback(t("auth.resetSent"));
    } catch (err) {
      const code = (err as { code?: string }).code;
      setError((code && errorMap[code as keyof typeof errorMap]) ?? t("auth.errors.generic"));
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase =
    "flex items-center gap-3 rounded-2xl border border-soft bg-surface-alt px-4 py-3 text-sm text-primary transition focus-within:border-brand focus-within:shadow-soft focus-within:ring-2 focus-within:ring-brand/40";

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
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="text-sm text-muted"
          >
            {t("common.loading", { defaultValue: "Carregando..." })}
          </motion.p>
        </motion.div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="grid w-full max-w-6xl gap-8 items-start lg:grid-cols-2 lg:gap-12">
          {/* Left side - Branding */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden flex-col lg:flex"
          >
            <div className="space-y-6">
              <AnimatedLogo size={120} />
              <h1 className="text-4xl font-bold text-primary">
                {t("brand.name", { defaultValue: "ListsHub" })}
              </h1>
              <div className="space-y-4 pt-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">
                      {t("auth.feature1Title", { defaultValue: "Listas Compartilhadas" })}
                    </h3>
                    <p className="text-sm text-muted">
                      {t("auth.feature1Desc", {
                        defaultValue: "Crie listas e compartilhe com sua família em tempo real"
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">
                      {t("auth.feature2Title", { defaultValue: "Controle de Permissões" })}
                    </h3>
                    <p className="text-sm text-muted">
                      {t("auth.feature2Desc", {
                        defaultValue: "Defina quem pode adicionar, editar ou apenas visualizar"
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">
                      {t("auth.feature3Title", { defaultValue: "Seguro e Sincronizado" })}
                    </h3>
                    <p className="text-sm text-muted">
                      {t("auth.feature3Desc", {
                        defaultValue: "Seus dados seguros na nuvem e sempre atualizados"
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="w-full rounded-3xl border border-soft bg-surface/50 p-8 backdrop-blur-sm">
              {/* Mobile logo */}
              <div className="mb-6 flex justify-center lg:hidden">
                <div className="flex flex-col items-center gap-2">
                  <AnimatedLogo size={96} />
                  <span className="text-lg font-semibold text-primary">
                    {t("brand.name", { defaultValue: "ListsHub" })}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-center">
                <h1 className="text-2xl font-semibold text-primary">
                  {mode === "sign-in" ? t("auth.signInHeading") : t("auth.signUpHeading")}
                </h1>
                <p className="text-sm text-muted">
                  {mode === "sign-in" ? t("auth.subtitle") : t("auth.firstAccessHint")}
                </p>
              </div>
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <label className="flex flex-col gap-2 text-left text-sm font-medium text-secondary">
                  {t("auth.email")}
                  <span className={inputBase}>
                    <Mail className="h-4 w-4 text-brand" />
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="nome@exemplo.com"
                      className="w-full border-0 bg-transparent text-sm text-primary outline-none placeholder:text-muted"
                      value={form.email}
                      onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                      disabled={submitting}
                    />
                  </span>
                </label>

                {mode === "sign-up" ? (
                  <label className="flex flex-col gap-2 text-left text-sm font-medium text-secondary">
                    {t("auth.name")}
                    <span className={inputBase}>
                      <UserRound className="h-4 w-4 text-brand" />
                      <input
                        name="displayName"
                        type="text"
                        autoComplete="name"
                        placeholder="Maria Silva"
                        className="w-full border-0 bg-transparent text-sm text-primary outline-none placeholder:text-muted"
                        value={form.displayName}
                        onChange={(event) =>
                          setForm((prev) => ({ ...prev, displayName: event.target.value }))
                        }
                        disabled={submitting}
                      />
                    </span>
                  </label>
                ) : null}

                <label className="flex flex-col gap-2 text-left text-sm font-medium text-secondary">
                  {t("auth.password")}
                  <span className={inputBase}>
                    <Lock className="h-4 w-4 text-brand" />
                    <input
                      name="password"
                      type="password"
                      autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                      placeholder="••••••••"
                      className="w-full border-0 bg-transparent text-sm text-primary outline-none placeholder:text-muted"
                      value={form.password}
                      onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                      disabled={submitting}
                    />
                  </span>
                </label>

                {error ? (
                  <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-500 dark:bg-rose-500/20 dark:text-rose-200">
                    {error}
                  </div>
                ) : null}

                {feedback ? (
                  <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200">
                    {feedback}
                  </div>
                ) : null}

                <Button
                  className="w-full justify-center"
                  size="lg"
                  type="submit"
                  isLoading={submitting}
                >
                  {mode === "sign-in" ? t("auth.signInButton") : t("auth.signUpButton")}
                </Button>
              </form>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-left text-xs text-muted">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-brand transition hover:text-brand-strong"
                >
                  {mode === "sign-in" ? t("auth.switchToRegister") : t("auth.switchToLogin")}
                </button>
                {mode === "sign-in" ? (
                  <button
                    type="button"
                    onClick={handlePasswordReset}
                    className="text-brand cursor-pointer transition hover:text-brand-strong"
                    disabled={submitting}
                  >
                    {t("auth.forgotPassword")}
                  </button>
                ) : null}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

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

  if (domainUser.role === USER_ROLE.TITULAR && domainUser.billing?.status === "suspended") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg text-center" padding="lg" elevated>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-500 dark:bg-rose-500/10 dark:text-rose-200">
            <ShieldOff className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold text-primary">{t("status.suspended")}</h2>
          <p className="mt-3 text-sm text-muted">
            {t("billing.overLimit")}
          </p>
          <Button className="mt-6 w-full justify-center" size="lg">
            {t("actions.managePlan")}
          </Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
