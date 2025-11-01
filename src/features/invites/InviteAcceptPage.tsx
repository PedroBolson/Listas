import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { useAuth } from "../auth/useAuth";
import { useInviteActions } from "../../hooks/useInvites";
import { InviteAuthForm } from "./InviteAuthForm";
import type { FamilyInviteRecord } from "../../domain/models";

type PageState = "loading" | "found" | "invalid" | "accepting" | "success" | "error";

export function InviteAcceptPage() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { domainUser } = useAuth();
    const { acceptByToken } = useInviteActions(null, domainUser?.id || null);

    const [state, setState] = useState<PageState>("loading");
    const [invite, setInvite] = useState<FamilyInviteRecord | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Buscar convite pelo token
    useEffect(() => {
        if (!token) {
            setState("invalid");
            return;
        }

        const loadInvite = async () => {
            try {
                setState("loading");
                // Import dinâmico para evitar circular dependency
                const { getInviteByToken } = await import("../../services/inviteService");
                const inviteData = await getInviteByToken(token);

                if (!inviteData) {
                    setState("invalid");
                    return;
                }

                setInvite(inviteData);
                setState("found");
            } catch (err) {
                console.error("Erro ao buscar convite:", err);
                setState("invalid");
            }
        };

        loadInvite();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // Auto-aceitar se logado (apenas para LOGIN, signup já aceita na function)
    useEffect(() => {
        if (state === "found" && domainUser && invite) {
            handleAccept();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state, domainUser]);

    const handleAccept = async () => {
        if (!token || !domainUser) {
            setError(t("invites.needLogin", { defaultValue: "Você precisa estar logado para aceitar o convite" }));
            return;
        }

        setState("accepting");
        setError(null);

        try {
            // Se já está na família (signup via function), pula direto pro sucesso
            const alreadyInFamily = domainUser.families.some(f =>
                typeof f === 'string' ? f === invite?.familyId : f.familyId === invite?.familyId
            );
            if (alreadyInFamily) {
                setState("success");
                setTimeout(() => {
                    navigate("/");
                }, 2000);
                return;
            }

            // Se não está na família, aceita normalmente (caso de LOGIN)
            await acceptByToken(token, domainUser.id);
            setState("success");

            // Redireciona após 2 segundos
            setTimeout(() => {
                navigate("/");
            }, 2000);
        } catch (err: any) {
            console.error("Erro ao aceitar convite:", err);
            setError(err.message || t("invites.acceptError", { defaultValue: "Erro ao aceitar convite" }));
            setState("error");
        }
    };

    // Loading
    if (state === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-surface p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-brand" />
                    <p className="text-lg text-muted">
                        {t("invites.loadingInvite", { defaultValue: "Carregando convite..." })}
                    </p>
                </motion.div>
            </div>
        );
    }

    // Convite inválido
    if (state === "invalid") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-surface p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <Card padding="lg" className="text-center">
                        <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
                        <h1 className="mb-2 text-2xl font-bold text-default">
                            {t("invites.invalidTitle", { defaultValue: "Convite Inválido" })}
                        </h1>
                        <p className="mb-6 text-muted">
                            {t("invites.invalidMessage", {
                                defaultValue: "Este convite não existe ou já expirou.",
                            })}
                        </p>
                        <Button onClick={() => navigate("/")} className="w-full">
                            {t("invites.goHome", { defaultValue: "Ir para o início" })}
                        </Button>
                    </Card>
                </motion.div>
            </div>
        );
    }

    // Convite encontrado - usuário não logado
    if (state === "found" && !domainUser) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-surface p-6">
                <InviteAuthForm
                    mode="signup"
                    onSuccess={() => {
                        // Força recarregar o domainUser para aceitar o convite
                        window.location.reload();
                    }}
                    familyName={invite?.familyName}
                    inviteToken={token ?? ""}
                />
            </div>
        );
    }

    // Aceitando convite
    if (state === "accepting") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-surface p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-brand" />
                    <p className="text-lg text-muted">
                        {t("invites.acceptingInvite", { defaultValue: "Aceitando convite..." })}
                    </p>
                </motion.div>
            </div>
        );
    }

    // Sucesso
    if (state === "success") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-surface p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                >
                    <Card padding="lg" className="text-center">
                        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
                        <h1 className="mb-2 text-2xl font-bold text-default">
                            {t("invites.successTitle", { defaultValue: "Bem-vindo!" })}
                        </h1>
                        <p className="mb-6 text-muted">
                            {t("invites.successMessage", {
                                family: invite?.familyName || "Família",
                                defaultValue: `Você agora faz parte de: ${invite?.familyName || "Família"}`,
                            })}
                        </p>
                        <p className="text-sm text-muted">
                            {t("invites.redirecting", { defaultValue: "Redirecionando..." })}
                        </p>
                    </Card>
                </motion.div>
            </div>
        );
    }

    // Erro
    if (state === "error") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-surface p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <Card padding="lg" className="text-center">
                        <XCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
                        <h1 className="mb-2 text-2xl font-bold text-default">
                            {t("invites.errorTitle", { defaultValue: "Erro ao aceitar" })}
                        </h1>
                        <p className="mb-6 text-muted">{error}</p>
                        <div className="flex gap-3">
                            <Button onClick={() => navigate("/")} variant="outline" className="flex-1">
                                {t("invites.goHome", { defaultValue: "Ir para o início" })}
                            </Button>
                            <Button onClick={handleAccept} className="flex-1">
                                {t("invites.tryAgain", { defaultValue: "Tentar novamente" })}
                            </Button>
                        </div>
                    </Card>
                </motion.div>
            </div>
        );
    }

    return null;
}
