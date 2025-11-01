import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserPlus, Loader2 } from "lucide-react";
import { Button } from "../ui/Button";
import { InviteCodeInput } from "./InviteCodeInput";
import { useInviteActions } from "../../hooks/useInvites";
import { useTranslation } from "react-i18next";

interface JoinFamilyModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    onSuccess?: (familyId: string, familyName: string) => void;
}

export function JoinFamilyModal({ isOpen, onClose, userId, onSuccess }: JoinFamilyModalProps) {
    const { t } = useTranslation();
    const { accepting, acceptByCode } = useInviteActions(null, userId);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleComplete = async (code: string) => {
        setError(null);
        setSuccess(false);

        try {
            const result = await acceptByCode(code);
            setSuccess(true);

            // Espera um pouco para mostrar sucesso
            setTimeout(() => {
                if (onSuccess) {
                    onSuccess(result.familyId, result.familyName);
                }
                onClose();
            }, 1500);
        } catch (err: any) {
            console.error("Erro ao aceitar convite:", err);
            setError(err.message || t("invites.acceptError", { defaultValue: "Código inválido ou expirado" }));
        }
    };

    const handleError = (message: string) => {
        setError(message);
    };

    const handleClose = () => {
        setError(null);
        setSuccess(false);
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
                        className="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl"
                    >
                        {/* Header */}
                        <div className="mb-6 flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10">
                                    <UserPlus className="h-6 w-6 text-brand" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-default">
                                        {t("invites.joinFamily", { defaultValue: "Participar de uma família" })}
                                    </h2>
                                    <p className="text-sm text-muted">
                                        {t("invites.enterCode", { defaultValue: "Digite o código de 6 dígitos" })}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="rounded-lg p-2 text-muted transition hover:bg-soft hover:text-default"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="space-y-6">
                            {/* Code Input */}
                            <div>
                                <InviteCodeInput
                                    onComplete={handleComplete}
                                    onError={handleError}
                                    disabled={accepting || success}
                                    autoFocus
                                />
                            </div>

                            {/* Loading */}
                            {accepting && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center justify-center gap-2 text-sm text-brand"
                                >
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {t("invites.validating", { defaultValue: "Validando código..." })}
                                </motion.div>
                            )}

                            {/* Success */}
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="rounded-lg bg-green-50 p-4 text-center text-sm font-medium text-green-700 dark:bg-green-950/30 dark:text-green-400"
                                >
                                    ✅ {t("invites.joinedSuccess", { defaultValue: "Você agora faz parte da família!" })}
                                </motion.div>
                            )}

                            {/* Error */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="rounded-lg bg-red-50 p-4 text-center text-sm font-medium text-red-700 dark:bg-red-950/30 dark:text-red-400"
                                >
                                    ❌ {error}
                                </motion.div>
                            )}

                            {/* Helper Text */}
                            {!accepting && !success && (
                                <div className="rounded-lg bg-background p-4 text-center">
                                    <p className="text-sm text-muted">
                                        {t("invites.codeHelp", {
                                            defaultValue: "O código está no convite que você recebeu",
                                        })}
                                    </p>
                                    <p className="mt-2 text-xs text-muted">
                                        {t("invites.orUseLink", {
                                            defaultValue: "Você também pode clicar no link de convite",
                                        })}
                                    </p>
                                </div>
                            )}

                            {/* Actions */}
                            {!accepting && !success && (
                                <Button onClick={handleClose} variant="outline" className="w-full">
                                    {t("actions.cancel", { defaultValue: "Cancelar" })}
                                </Button>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
