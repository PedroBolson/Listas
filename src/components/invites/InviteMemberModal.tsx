import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Link as LinkIcon, Hash } from "lucide-react";
import { Button } from "../ui/Button";
import { useInviteActions } from "../../hooks/useInvites";
import { useFamilyInvites } from "../../hooks/useInvites";
import { useTranslation } from "react-i18next";
import type { FamilyInviteRecord } from "../../domain/models";

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    familyId: string;
    userId: string;
    familyName: string;
    availableSlots?: number; // Slots disponíveis no plano
}

export function InviteMemberModal({ isOpen, onClose, familyId, userId, familyName, availableSlots }: InviteMemberModalProps) {
    const { t } = useTranslation();
    const { creating, createInvite } = useInviteActions(familyId, userId);
    const { invites } = useFamilyInvites(familyId);
    const [invite, setInvite] = useState<FamilyInviteRecord | null>(null);
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);

    // Carregar convite ativo existente ao abrir
    useEffect(() => {
        if (isOpen && invites.length > 0) {
            // Pega o convite mais recente que ainda está pendente
            const activeInvite = invites.find(inv => inv.status === "pending");
            if (activeInvite) {
                setInvite(activeInvite);
            }
        }
    }, [isOpen, invites]);

    const handleGenerate = async () => {
        try {
            // Se já tem um convite ativo, revogar antes de criar novo
            if (invite && invite.status === "pending") {
                console.log('🔄 Revogando convite anterior:', invite.id);
                // TODO: Adicionar função revokeInvite() se quiser revogar o antigo
                // Por enquanto, só cria um novo (o antigo continua válido)
            }

            const newInvite = await createInvite(7); // 7 dias
            setInvite(newInvite);
        } catch (error: any) {
            console.error("Erro ao criar convite:", error);
            alert(error.message || t("invites.createError", { defaultValue: "Erro ao gerar convite" }));
        }
    };

    const getInviteLink = () => {
        if (!invite) return "";
        return `${window.location.origin}/invite/${invite.token}`;
    };

    const handleCopyLink = async () => {
        const link = getInviteLink();
        await navigator.clipboard.writeText(link);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
    };

    const handleCopyCode = async () => {
        if (!invite) return;
        await navigator.clipboard.writeText(invite.code);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const handleClose = () => {
        setInvite(null);
        setCopiedLink(false);
        setCopiedCode(false);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl"
                    >
                        {/* Header */}
                        <div className="mb-6 flex items-start justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-default">
                                    {t("invites.inviteMember", { defaultValue: "Convidar Membro" })}
                                </h2>
                                <p className="mt-1 text-sm text-muted">
                                    {t("invites.inviteToFamily", { family: familyName, defaultValue: `Para: ${familyName}` })}
                                </p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="rounded-lg p-2 text-muted transition hover:bg-soft hover:text-default"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        {!invite ? (
                            /* Gerar Convite */
                            <div className="space-y-4">
                                <div className="space-y-3">
                                    <p className="text-sm text-muted">
                                        {t("invites.generateDescription", {
                                            defaultValue:
                                                "Gere um link e código para convidar alguém para sua família. O convite é válido por 7 dias.",
                                        })}
                                    </p>
                                    {availableSlots !== undefined && availableSlots > 0 && (
                                        <div className="rounded-lg bg-brand/10 px-3 py-2 text-sm font-medium text-brand">
                                            {availableSlots === 1
                                                ? t("invites.oneSlotAvailable", {
                                                    defaultValue: "1 vaga disponível no seu plano",
                                                })
                                                : t("invites.multipleSlotsAvailable", {
                                                    count: availableSlots,
                                                    defaultValue: `${availableSlots} vagas disponíveis no seu plano`,
                                                })}
                                        </div>
                                    )}
                                </div>

                                <Button onClick={handleGenerate} isLoading={creating} className="w-full" size="lg">
                                    {t("invites.generate", { defaultValue: "Gerar Convite" })}
                                </Button>
                            </div>
                        ) : (
                            /* Mostrar Convite Gerado */
                            <div className="space-y-6">
                                {/* Link */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-default">
                                        <LinkIcon className="h-4 w-4" />
                                        {t("invites.inviteLink", { defaultValue: "Link de Convite" })}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={getInviteLink()}
                                            readOnly
                                            className="flex-1 rounded-lg border border-soft bg-background px-4 py-3 text-sm text-default"
                                        />
                                        <Button onClick={handleCopyLink} variant="outline" size="md">
                                            {copiedLink ? (
                                                <Check className="h-4 w-4 text-green-600" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted">
                                        {t("invites.linkDescription", {
                                            defaultValue: "Compartilhe este link por WhatsApp, email ou SMS",
                                        })}
                                    </p>
                                </div>

                                {/* Divisor */}
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

                                {/* Código */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm font-semibold text-default">
                                        <Hash className="h-4 w-4" />
                                        {t("invites.inviteCode", { defaultValue: "Código de Convite" })}
                                    </label>
                                    <div className="flex items-center justify-center gap-3 rounded-lg border-2 border-dashed border-soft bg-background p-6">
                                        <div className="text-center">
                                            <div className="mb-2 text-4xl font-bold tracking-wider text-brand">
                                                {invite.code}
                                            </div>
                                            <Button
                                                onClick={handleCopyCode}
                                                variant="ghost"
                                                size="sm"
                                                icon={copiedCode ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                            >
                                                {copiedCode
                                                    ? t("invites.copied", { defaultValue: "Copiado!" })
                                                    : t("invites.copyCode", { defaultValue: "Copiar código" })
                                                }
                                            </Button>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted">
                                        {t("invites.codeDescription", {
                                            defaultValue: "Quem já tem conta pode usar este código para participar",
                                        })}
                                    </p>
                                </div>

                                {/* Info */}
                                <div className="rounded-lg bg-brand/10 p-4 text-sm text-brand">
                                    <p className="font-semibold">
                                        {t("invites.expiresIn", { days: 7, defaultValue: "Válido por 7 dias" })}
                                    </p>
                                    <p className="mt-1 text-xs opacity-80">
                                        {t("invites.availableSlots", {
                                            used: invite.usedCount || 0,
                                            total: invite.maxUses,
                                            defaultValue: `${invite.usedCount || 0} de ${invite.maxUses} usos`
                                        })}
                                    </p>
                                    {availableSlots !== undefined && (
                                        <p className="mt-1 text-xs opacity-80">
                                            {availableSlots > 0
                                                ? t("invites.slotsRemaining", {
                                                    count: availableSlots,
                                                    defaultValue: `${availableSlots} ${availableSlots === 1 ? 'vaga disponível' : 'vagas disponíveis'} no plano`
                                                })
                                                : t("invites.noSlots", {
                                                    defaultValue: "Sem vagas disponíveis no plano"
                                                })
                                            }
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <Button onClick={handleClose} variant="outline" className="flex-1">
                                        {t("actions.close", { defaultValue: "Fechar" })}
                                    </Button>
                                    <Button onClick={handleGenerate} variant="ghost" className="flex-1">
                                        {t("invites.generateNew", { defaultValue: "Gerar novo" })}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
