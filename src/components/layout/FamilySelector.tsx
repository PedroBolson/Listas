import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../features/auth/useAuth";
import { SELECTED_FAMILY_STORAGE_KEY } from "../../domain/models";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Spinner } from "../ui/Spinner";

interface FamilySelectorProps {
    onCreateFamily?: () => void;
    /** "dropdown" = absolute popup (desktop navbar). "inline" = expands in-place (BottomSheet). */
    variant?: "dropdown" | "inline";
}

export function FamilySelector({ onCreateFamily, variant = "dropdown" }: FamilySelectorProps) {
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

    useEffect(() => {
        const fetchUserFamilies = async () => {
            if (!domainUser?.id) { setLoading(false); return; }
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

    const planId = domainUser?.billing?.planId;
    const canHaveMultipleFamilies = domainUser?.isTitular && planId === "master";
    const canCreateMore = userFamilies.length < (planId === "master" ? Infinity : 1);
    const shouldShow = userFamilies.length > 1 || (domainUser?.isTitular && canHaveMultipleFamilies && canCreateMore);

    if (loading || !shouldShow) return null;

    const currentFamilyName = currentFamilyId
        ? userFamilies.find(f => f.familyId === currentFamilyId)?.familyName || `Família ${currentFamilyId.slice(0, 8)}`
        : t("family.selectFamily");

    const handleSwitch = async (familyId: string) => {
        if (familyId === currentFamilyId) { setIsOpen(false); return; }
        try {
            setSwitching(true);
            setIsOpen(false);
            await new Promise(r => setTimeout(r, 200));
            window.localStorage.setItem(SELECTED_FAMILY_STORAGE_KEY, familyId);
            await new Promise(r => setTimeout(r, 300));
            window.location.href = "/dashboard";
        } catch (error) {
            console.error("❌ Erro ao trocar família:", error);
            setSwitching(false);
        }
    };

    // ── Switching overlay (shared) ──────────────────────────────────────────────
    const switchingOverlay = (
        <AnimatePresence>
            {switching && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="fixed inset-0 z-9999 flex items-center justify-center bg-background/80 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
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
    );

    // ── Inline mode (BottomSheet — sem posicionamento absoluto) ────────────────
    if (variant === "inline") {
        return (
            <div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex w-full items-center justify-between rounded-xl px-2 py-3 transition hover:bg-surface-alt"
                >
                    <span className="text-sm text-secondary">
                        {t("family.currentFamily", { defaultValue: "Família" })}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className="max-w-40 truncate text-sm font-medium text-primary">
                            {currentFamilyName}
                        </span>
                        <motion.span
                            animate={{ rotate: isOpen ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <ChevronDown className="h-4 w-4 text-muted" />
                        </motion.span>
                    </div>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 420, damping: 36 }}
                            className="overflow-hidden"
                        >
                            <div className="mx-2 mb-2 space-y-0.5 rounded-xl border border-soft bg-surface-alt p-1">
                                {userFamilies.map((family) => (
                                    <button
                                        key={family.familyId}
                                        className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-surface"
                                        onClick={() => void handleSwitch(family.familyId)}
                                    >
                                        <div>
                                            <p className="font-medium text-primary">{family.familyName}</p>
                                            <p className="text-xs text-muted">
                                                {family.role === "titular" || family.role === "owner"
                                                    ? t("family.titularRole")
                                                    : t("family.memberRole")}
                                            </p>
                                        </div>
                                        {family.familyId === currentFamilyId && (
                                            <Check className="h-4 w-4 shrink-0 text-brand" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {switchingOverlay}
            </div>
        );
    }

    // ── Dropdown mode (desktop navbar) ─────────────────────────────────────────
    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                trailingIcon={<ChevronDown className={`size-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />}
                className="min-w-[200px] justify-between"
            >
                <span className="truncate">{currentFamilyName}</span>
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
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
                                            onClick={() => void handleSwitch(family.familyId)}
                                        >
                                            <div className="flex flex-col gap-0.5">
                                                <span className="truncate font-medium text-primary">{family.familyName}</span>
                                                <span className="text-xs text-muted">
                                                    {family.role === "titular" || family.role === "owner"
                                                        ? t("family.titularRole")
                                                        : t("family.memberRole")}
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
                                                onClick={() => { onCreateFamily(); setIsOpen(false); }}
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

            {switchingOverlay}
        </div>
    );
}
