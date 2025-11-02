import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../features/auth/useAuth";
import { updateUser } from "../../services/userService";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Spinner } from "../ui/Spinner";

interface FamilySelectorProps {
    onCreateFamily?: () => void;
}

export function FamilySelector({ onCreateFamily }: FamilySelectorProps) {
    const { domainUser } = useAuth();
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [userFamilies, setUserFamilies] = useState<Array<{
        familyId: string;
        familyName: string;
        role: string;
    }>>([]);
    const [loading, setLoading] = useState(true);
    const [switching, setSwitching] = useState(false);

    const currentFamilyId = domainUser?.managedFamilyId;

    // Buscar TODAS as famílias do usuário via Cloud Function
    useEffect(() => {
        const fetchUserFamilies = async () => {
            if (!domainUser?.id) {
                setLoading(false);
                return;
            }

            try {
                const { getUserFamilies } = await import("../../services/familyService");
                const families = await getUserFamilies();
                setUserFamilies(families);
            } catch (error) {
                console.error("❌ Erro ao buscar famílias:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserFamilies();
    }, [domainUser?.id]);

    // Apenas Master pode criar múltiplas famílias
    const planId = domainUser?.billing?.planId;
    const canHaveMultipleFamilies = domainUser?.isTitular && planId === "master";

    // Verificar se atingiu o limite de famílias (apenas Master tem ilimitado)
    const maxFamilies = planId === "master" ? Infinity : 1;
    const canCreateMore = userFamilies.length < maxFamilies;

    // SEMPRE mostrar se tiver mais de 1 família (independente do role)
    // Ou se for titular e puder criar mais
    const shouldShow = userFamilies.length > 1 || (domainUser?.isTitular && canHaveMultipleFamilies && canCreateMore);

    if (loading || !shouldShow) {
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
                    {currentFamilyId
                        ? userFamilies.find(f => f.familyId === currentFamilyId)?.familyName || `Família ${currentFamilyId.slice(0, 8)}`
                        : t("family.selectFamily")}
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
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ type: "spring", duration: 0.4, bounce: 0.3 }}
                            className="absolute right-0 top-full z-50 mt-2 w-64"
                        >
                            <Card className="p-2">
                                <div className="space-y-1">
                                    {userFamilies.map((family) => (
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

                                                    // Inicia animação de transição
                                                    setSwitching(true);
                                                    setIsOpen(false);

                                                    // Aguarda um pouco para a animação começar
                                                    await new Promise(resolve => setTimeout(resolve, 200));

                                                    // Atualizar primaryFamilyId sempre (funciona para titular e member)
                                                    await updateUser(domainUser.id, {
                                                        primaryFamilyId: family.familyId,
                                                    });

                                                    // Aguarda mais um pouco antes de redirecionar
                                                    await new Promise(resolve => setTimeout(resolve, 300));

                                                    // Redireciona para o dashboard (evita ficar em páginas de outra família)
                                                    window.location.href = "/dashboard";
                                                } catch (error) {
                                                    console.error("❌ Erro ao trocar família:", error);
                                                    setSwitching(false);
                                                }
                                            }}
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                <span className="truncate font-medium">
                                                    {family.familyName}
                                                </span>
                                                <span className="text-xs text-muted">
                                                    {family.role === "titular" || family.role === "owner" ? t("family.titularRole") : t("family.memberRole")}
                                                </span>
                                            </div>
                                            {family.familyId === currentFamilyId && (
                                                <Check className="size-4 shrink-0 text-brand" />
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

            {/* Overlay de transição ao trocar família */}
            <AnimatePresence>
                {switching && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-9999 flex items-center justify-center bg-background/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                            className="flex flex-col items-center gap-4"
                        >
                            <Spinner className="h-12 w-12" />
                            <p className="text-sm font-medium text-secondary">
                                {t("family.switchingFamily", { defaultValue: "Trocando de família..." })}
                            </p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
