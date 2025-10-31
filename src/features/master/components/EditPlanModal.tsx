import { useState } from "react";
import { motion } from "framer-motion";
import { X, Save, DollarSign, Users, ClipboardList, Package, Infinity as InfinityIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import type { SubscriptionPlanProps } from "../../../domain/models";

interface EditPlanModalProps {
    plan: SubscriptionPlanProps;
    onClose: () => void;
    onSave: () => void;
}

export function EditPlanModal({ plan, onClose, onSave }: EditPlanModalProps) {
    const { t } = useTranslation();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: plan.name,
        description: plan.description,
        monthlyPrice: plan.monthlyPrice,
        familyMembers: plan.limits.familyMembers.toString(),
        listsPerFamily: plan.limits.listsPerFamily.toString(),
        itemsPerList: plan.limits.itemsPerList.toString(),
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const planRef = doc(db, "plans", plan.id);
            await updateDoc(planRef, {
                name: formData.name,
                description: formData.description,
                monthlyPrice: formData.monthlyPrice,
                "limits.familyMembers": Number(formData.familyMembers) || Infinity,
                "limits.listsPerFamily": Number(formData.listsPerFamily) || Infinity,
                "limits.itemsPerList": Number(formData.itemsPerList) || Infinity,
                updatedAt: new Date().toISOString(),
            });

            onSave();
            onClose();
        } catch (error) {
            console.error("Erro ao salvar plano:", error);
            alert(t("master.errorSavingPlan", { defaultValue: "Erro ao salvar plano" }));
        } finally {
            setSaving(false);
        }
    };

    const isUnlimited = (field: keyof typeof formData) => {
        const value = formData[field];
        return !Number.isFinite(Number(value)) || Number(value) === Infinity;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-2xl"
            >
                <Card className="p-6">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-2xl font-bold">
                            {t("master.editPlan", { defaultValue: "Editar Plano" })}
                        </h2>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="size-5" />
                        </Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    {t("master.planName", { defaultValue: "Nome do Plano" })}
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-800"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    {t("master.planDescription", { defaultValue: "Descrição" })}
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-800"
                                    rows={2}
                                />
                            </div>

                            <div>
                                <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                                    <DollarSign className="size-4" />
                                    {t("master.planPrice", { defaultValue: "Preço Mensal (R$)" })}
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.monthlyPrice}
                                    onChange={(e) => setFormData({ ...formData, monthlyPrice: Number(e.target.value) })}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-800"
                                    required
                                />
                            </div>
                        </div>

                        {/* Limits */}
                        <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                            <h3 className="font-semibold">
                                {t("master.planLimits", { defaultValue: "Limites" })}
                            </h3>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <div>
                                    <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                                        <Users className="size-4" />
                                        {t("master.familyMembers", { defaultValue: "Membros" })}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={isUnlimited("familyMembers") ? "" : formData.familyMembers}
                                            onChange={(e) =>
                                                setFormData({ ...formData, familyMembers: e.target.value })
                                            }
                                            placeholder="∞"
                                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-800"
                                        />
                                        {isUnlimited("familyMembers") && (
                                            <InfinityIcon className="size-5 text-blue-500" />
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                                        <ClipboardList className="size-4" />
                                        {t("master.listsPerFamily", { defaultValue: "Listas" })}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={isUnlimited("listsPerFamily") ? "" : formData.listsPerFamily}
                                            onChange={(e) =>
                                                setFormData({ ...formData, listsPerFamily: e.target.value })
                                            }
                                            placeholder="∞"
                                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-800"
                                        />
                                        {isUnlimited("listsPerFamily") && (
                                            <InfinityIcon className="size-5 text-blue-500" />
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                                        <Package className="size-4" />
                                        {t("master.itemsPerList", { defaultValue: "Itens/Lista" })}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={isUnlimited("itemsPerList") ? "" : formData.itemsPerList}
                                            onChange={(e) =>
                                                setFormData({ ...formData, itemsPerList: e.target.value })
                                            }
                                            placeholder="∞"
                                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-800"
                                        />
                                        {isUnlimited("itemsPerList") && (
                                            <InfinityIcon className="size-5 text-blue-500" />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500">
                                {t("master.unlimitedHint", {
                                    defaultValue: "Deixe vazio ou use Infinity para ilimitado",
                                })}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3">
                            <Button type="button" variant="ghost" onClick={onClose}>
                                {t("actions.cancel", { defaultValue: "Cancelar" })}
                            </Button>
                            <Button type="submit" disabled={saving}>
                                <Save className="mr-2 size-4" />
                                {saving
                                    ? t("actions.saving", { defaultValue: "Salvando..." })
                                    : t("actions.save", { defaultValue: "Salvar" })}
                            </Button>
                        </div>
                    </form>
                </Card>
            </motion.div>
        </motion.div>
    );
}
