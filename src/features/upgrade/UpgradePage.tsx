import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Sparkles, Users, CheckCircle2, Crown, ArrowLeft } from "lucide-react";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Spinner } from "../../components/ui/Spinner";
import { upgradeToTitular } from "../../services/userService";
import { useAuth } from "../auth/useAuth";

export function UpgradePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { domainUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpgrade = async () => {
        if (!domainUser) return;

        try {
            setLoading(true);
            setError(null);

            const result = await upgradeToTitular("free");

            if (result.success) {
                // Navega para o dashboard após sucesso
                navigate("/dashboard");
            } else {
                setError(result.message || "Erro ao fazer upgrade");
            }
        } catch (err) {
            console.error("Erro ao fazer upgrade:", err);
            setError(err instanceof Error ? err.message : "Erro desconhecido");
        } finally {
            setLoading(false);
        }
    };

    const benefits = [
        {
            icon: Crown,
            title: t("upgrade.benefits.ownFamily.title", { defaultValue: "Família Própria" }),
            description: t("upgrade.benefits.ownFamily.description", {
                defaultValue: "Crie e gerencie sua própria família"
            }),
        },
        {
            icon: CheckCircle2,
            title: t("upgrade.benefits.unlimitedLists.title", { defaultValue: "Listas Ilimitadas" }),
            description: t("upgrade.benefits.unlimitedLists.description", {
                defaultValue: "Crie quantas listas precisar"
            }),
        },
        {
            icon: Users,
            title: t("upgrade.benefits.inviteMembers.title", { defaultValue: "Convide Membros" }),
            description: t("upgrade.benefits.inviteMembers.description", {
                defaultValue: "Adicione familiares e amigos"
            }),
        },
        {
            icon: Sparkles,
            title: t("upgrade.benefits.fullControl.title", { defaultValue: "Controle Total" }),
            description: t("upgrade.benefits.fullControl.description", {
                defaultValue: "Gerencie permissões e acesso"
            }),
        },
    ];

    return (
        <motion.div
            className="mx-auto max-w-4xl space-y-8 p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
        >
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/dashboard")}
                >
                    <ArrowLeft className="h-4 w-4" />
                    {t("common.back", { defaultValue: "Voltar" })}
                </Button>
            </div>

            {/* Hero Card */}
            <Card elevated className="border-2 border-brand bg-linear-to-r from-brand/10 to-purple-500/10">
                <div className="space-y-4 p-8 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand text-white">
                        <Crown className="h-8 w-8" />
                    </div>
                    <h1 className="text-4xl font-bold text-primary">
                        {t("upgrade.title", { defaultValue: "Torne-se Titular" })}
                    </h1>
                    <p className="text-lg text-secondary">
                        {t("upgrade.subtitle", {
                            defaultValue: "Desbloqueie todos os recursos e crie sua própria família",
                        })}
                    </p>
                </div>
            </Card>

            {/* Benefits Grid */}
            <div className="grid gap-4 md:grid-cols-2">
                {benefits.map((benefit) => {
                    const Icon = benefit.icon;
                    return (
                        <Card key={benefit.title} padding="lg">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-primary">{benefit.title}</h3>
                                    <p className="mt-1 text-sm text-secondary">{benefit.description}</p>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Pricing Card - Free Plan */}
            <Card elevated className="border-2 border-brand">
                <div className="space-y-6 p-8">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-primary">
                            {t("upgrade.plan.free.name", { defaultValue: "Plano Gratuito" })}
                        </h2>
                        <p className="mt-2 text-sm text-secondary">
                            {t("upgrade.plan.free.description", {
                                defaultValue: "Comece gratuitamente e gerencie sua família",
                            })}
                        </p>
                    </div>

                    <div className="flex items-baseline justify-center gap-2">
                        <span className="text-5xl font-bold text-brand">R$ 0</span>
                        <span className="text-lg text-muted">/mês</span>
                    </div>

                    <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-sm text-secondary">
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-brand" />
                            <span>{t("upgrade.plan.free.features.lists", { defaultValue: "Até 10 listas" })}</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-secondary">
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-brand" />
                            <span>{t("upgrade.plan.free.features.members", { defaultValue: "Até 5 membros" })}</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm text-secondary">
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-brand" />
                            <span>{t("upgrade.plan.free.features.items", { defaultValue: "Até 50 itens por lista" })}</span>
                        </li>
                    </ul>

                    {error && (
                        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full"
                        onClick={handleUpgrade}
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Spinner />
                                {t("upgrade.button.loading", { defaultValue: "Processando..." })}
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-5 w-5" />
                                {t("upgrade.button.confirm", { defaultValue: "Confirmar Upgrade" })}
                            </>
                        )}
                    </Button>

                    <p className="text-center text-xs text-muted">
                        {t("upgrade.disclaimer", {
                            defaultValue: "Você pode cancelar ou fazer upgrade a qualquer momento",
                        })}
                    </p>
                </div>
            </Card>
        </motion.div>
    );
}
