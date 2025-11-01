import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, User, LogIn, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { signInWithEmailAndPassword } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../../lib/firebase";

interface InviteAuthFormProps {
    mode: "login" | "signup";
    onSuccess: () => void;
    familyName?: string;
    inviteToken: string;
}

export function InviteAuthForm({ mode: initialMode, onSuccess, familyName, inviteToken }: InviteAuthFormProps) {
    const { t } = useTranslation();
    const [mode, setMode] = useState<"login" | "signup">(initialMode);
    const [form, setForm] = useState({
        email: "",
        password: "",
        displayName: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const errorMap = {
        "auth/invalid-credential": t("auth.errors.invalidCredentials", { defaultValue: "Email ou senha incorretos" }),
        "auth/user-not-found": t("auth.errors.invalidCredentials", { defaultValue: "Email ou senha incorretos" }),
        "auth/wrong-password": t("auth.errors.invalidCredentials", { defaultValue: "Email ou senha incorretos" }),
        "auth/email-already-in-use": t("auth.errors.emailInUse", { defaultValue: "Este email já está em uso" }),
        "auth/weak-password": t("auth.errors.weakPassword", { defaultValue: "Senha muito fraca (min 6 caracteres)" }),
        "auth/too-many-requests": t("auth.errors.tooManyRequests", { defaultValue: "Muitas tentativas. Tente novamente mais tarde" }),
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (!form.email) {
            setError(t("auth.errors.requiredEmail", { defaultValue: "Email é obrigatório" }));
            return;
        }
        if (!form.password) {
            setError(t("auth.errors.requiredPassword", { defaultValue: "Senha é obrigatória" }));
            return;
        }
        if (mode === "signup" && !form.displayName.trim()) {
            setError(t("auth.errors.requiredName", { defaultValue: "Nome é obrigatório" }));
            return;
        }

        setSubmitting(true);
        try {
            if (mode === "login") {
                // Login simples - só autentica
                await signInWithEmailAndPassword(auth, form.email, form.password);
                // O InviteAcceptPage vai detectar que está autenticado e aceitar o convite
                onSuccess();
            } else {
                // SignUp via convite - USA CLOUD FUNCTION COM PRIVILÉGIOS ADMIN
                // A FUNCTION FAZ TUDO: cria user, cria doc MEMBER, adiciona à família, aceita convite
                const createInviteUser = httpsCallable(functions, 'createInviteUser');
                await createInviteUser({
                    email: form.email,
                    password: form.password,
                    displayName: form.displayName.trim(),
                    inviteToken: inviteToken,
                });

                // Fazer login - usuário JÁ ESTÁ NA FAMÍLIA
                await signInWithEmailAndPassword(auth, form.email, form.password);

                // Redireciona direto - não precisa "aceitar" nada
                onSuccess();
            }
        } catch (err: any) {
            // Tratamento especial para erro da Cloud Function
            if (err.code === 'functions/internal') {
                const message = err.message || '';
                if (message.includes('email-already-exists') || message.includes('already in use')) {
                    setError(t("auth.errors.emailInUse", { defaultValue: "Este email já está em uso" }));
                } else {
                    setError(message || t("auth.errors.generic", { defaultValue: "Erro ao autenticar" }));
                }
            } else {
                const code = err.code;
                setError((code && errorMap[code as keyof typeof errorMap]) ?? t("auth.errors.generic", { defaultValue: "Erro ao autenticar" }));
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
        >
            <Card padding="lg">
                <div className="mb-6 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
                        {mode === "login" ? (
                            <LogIn className="h-8 w-8 text-brand" />
                        ) : (
                            <UserPlus className="h-8 w-8 text-brand" />
                        )}
                    </div>
                    <h1 className="mb-2 text-2xl font-bold text-default">
                        {mode === "login"
                            ? t("invites.loginToJoin", { defaultValue: "Entrar e participar" })
                            : t("invites.createAccountToJoin", { defaultValue: "Criar conta e participar" })}
                    </h1>
                    <p className="text-muted">
                        {familyName
                            ? t("invites.toJoinFamily", { family: familyName, defaultValue: `Para participar de: ${familyName}` })
                            : t("invites.toJoinFamilyGeneric", { defaultValue: "Para participar da família" })}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === "signup" && (
                        <div>
                            <label htmlFor="displayName" className="mb-2 block text-sm font-medium text-default">
                                {t("auth.name", { defaultValue: "Nome completo" })}
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
                                <input
                                    id="displayName"
                                    type="text"
                                    value={form.displayName}
                                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                                    className="w-full rounded-lg border border-soft bg-surface py-2 pl-10 pr-4 text-default placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                                    placeholder={t("auth.name", { defaultValue: "Nome completo" })}
                                    disabled={submitting}
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="mb-2 block text-sm font-medium text-default">
                            {t("auth.email", { defaultValue: "E-mail" })}
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
                            <input
                                id="email"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full rounded-lg border border-soft bg-surface py-2 pl-10 pr-4 text-default placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                                placeholder={t("auth.email", { defaultValue: "E-mail" })}
                                disabled={submitting}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="mb-2 block text-sm font-medium text-default">
                            {t("auth.password", { defaultValue: "Senha" })}
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
                            <input
                                id="password"
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="w-full rounded-lg border border-soft bg-surface py-2 pl-10 pr-4 text-default placeholder:text-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                                placeholder={t("auth.password", { defaultValue: "Senha" })}
                                disabled={submitting}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400">
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                        {submitting
                            ? t("common.loading", { defaultValue: "Carregando..." })
                            : mode === "login"
                                ? t("invites.loginButton", { defaultValue: "Entrar" })
                                : t("invites.createAccountButton", { defaultValue: "Criar conta" })}
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-soft" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-surface px-2 text-muted">
                                {t("common.or", { defaultValue: "ou" })}
                            </span>
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                            setMode(mode === "login" ? "signup" : "login");
                            setError(null);
                        }}
                        disabled={submitting}
                    >
                        {mode === "login"
                            ? t("invites.switchToSignup", { defaultValue: "Criar nova conta" })
                            : t("invites.switchToLogin", { defaultValue: "Já tenho conta" })}
                    </Button>
                </form>
            </Card>
        </motion.div>
    );
}
