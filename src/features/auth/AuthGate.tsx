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
        <Spinner className="h-12 w-12 border-4" />
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-xl" padding="lg" elevated>
          <motion.div
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft text-brand"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 230, damping: 16 }}
          >
            <Sparkles className="h-8 w-8" />
          </motion.div>
          <div className="mt-6 space-y-2 text-center">
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
                className="text-brand transition hover:text-brand-strong"
                disabled={submitting}
              >
                {t("auth.forgotPassword")}
              </button>
            ) : null}
          </div>
        </Card>
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
