import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../features/auth/useAuth";
import { updateUser } from "../../services/userService";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

interface FamilySelectorProps {
    onCreateFamily?: () => void;
}

export function FamilySelector({ onCreateFamily }: FamilySelectorProps) {
    const { domainUser } = useAuth();
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);

    const activeFamilies = domainUser?.activeFamilies || [];
    const currentFamilyId = domainUser?.props.primaryFamilyId;
    const currentFamily = activeFamilies.find(f => f.familyId === currentFamilyId);

    // Usuário Titular pode ter múltiplas famílias se tiver plano premium ou master
    const planId = domainUser?.billing?.planId;
    const canHaveMultipleFamilies = domainUser?.isTitular && (planId === "premium" || planId === "master");

    // Verificar se atingiu o limite de famílias
    const maxFamilies = planId === "master" ? Infinity : planId === "premium" ? 3 : 1;
    const canCreateMore = activeFamilies.length < maxFamilies;

    if (!domainUser?.isTitular) {
        // Members não veem seletor, só veem a família atual
        return null;
    }

    if (activeFamilies.length <= 1 && !canHaveMultipleFamilies) {
        // Sem múltiplas famílias e sem permissão para criar
        return null;
    }

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                trailingIcon={<ChevronDown className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />}
                className="min-w-[200px] justify-between"
            >
                <span className="truncate">
                    {currentFamily ? `Família: ${currentFamily.familyId}` : t("family.selectFamily")}
                </span>
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-0 top-full z-50 mt-2 w-64"
                        >
                            <Card className="p-2">
                                <div className="space-y-1">
                                    {activeFamilies.map((family) => (
                                        <button
                                            key={family.familyId}
                                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-surface-alt"
                                            onClick={async () => {
                                                if (family.familyId === currentFamilyId) {
                                                    setIsOpen(false);
                                                    return;
                                                }

                                                try {
                                                    if (!domainUser) return;

                                                    // Atualizar primaryFamilyId do usuário
                                                    await updateUser(domainUser.id, {
                                                        primaryFamilyId: family.familyId,
                                                    });

                                                    setIsOpen(false);
                                                    // O AuthProvider vai detectar a mudança e recarregar
                                                } catch (error) {
                                                    console.error("❌ Erro ao trocar família:", error);
                                                }
                                            }}
                                        >
                                            <span className="truncate">
                                                Família {family.familyId.slice(0, 8)}
                                            </span>
                                            {family.familyId === currentFamilyId && (
                                                <Check className="size-4 text-brand" />
                                            )}
                                        </button>
                                    ))}

                                    {canHaveMultipleFamilies && canCreateMore && onCreateFamily && (
                                        <>
                                            <div className="my-1 border-t border-soft" />
                                            <button
                                                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-brand transition hover:bg-brand-soft"
                                                onClick={() => {
                                                    onCreateFamily();
                                                    setIsOpen(false);
                                                }}
                                            >
                                                <Plus className="size-4" />
                                                {t("actions.createFamily")}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
