import { useState } from "react";
import { motion } from "framer-motion";
import { X, Save, Mail, User, Shield, CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import type { UserRole, AccountStatus } from "../../../domain/models";

interface UserData {
    id: string;
    email: string;
    displayName: string;
    role: UserRole;
    status?: AccountStatus;
    billing?: {
        planId: string;
        status: AccountStatus;
    };
}

interface EditUserModalProps {
    user: UserData;
    onClose: () => void;
    onSave: () => void;
}

export function EditUserModal({ user, onClose, onSave }: EditUserModalProps) {
    const { t } = useTranslation();
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        displayName: user.displayName || "",
        role: user.role || "member",
        status: user.status || "active",
        planId: user.billing?.planId || "free",
        billingStatus: user.billing?.status || "active",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const userRef = doc(db, "users", user.id);
            await updateDoc(userRef, {
                displayName: formData.displayName,
                role: formData.role,
                status: formData.status,
                "billing.planId": formData.planId,
                "billing.status": formData.billingStatus,
                updatedAt: new Date().toISOString(),
            });

            onSave();
            onClose();
        } catch (error) {
            console.error("Erro ao salvar usuário:", error);
            alert(t("master.errorSavingUser", { defaultValue: "Erro ao salvar usuário" }));
        } finally {
            setSaving(false);
        }
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
                className="w-full max-w-lg"
            >
                <Card className="p-6">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-2xl font-bold">
                            {t("master.editUser", { defaultValue: "Editar Usuário" })}
                        </h2>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="size-5" />
                        </Button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* User Info */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                                <Mail className="size-5 text-gray-500" />
                                <div>
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="font-medium">{user.email}</p>
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                                    <User className="size-4" />
                                    {t("master.displayName", { defaultValue: "Nome de Exibição" })}
                                </label>
                                <input
                                    type="text"
                                    value={formData.displayName}
                                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-800"
                                    required
                                />
                            </div>

                            <div>
                                <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                                    <Shield className="size-4" />
                                    {t("master.userRole", { defaultValue: "Função" })}
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-800"
                                >
                                    <option value="member">Member</option>
                                    <option value="titular">Titular</option>
                                    <option value="master">Master</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 flex items-center gap-2 text-sm font-medium">
                                    {t("master.accountStatus", { defaultValue: "Status da Conta" })}
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as AccountStatus })}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-800"
                                >
                                    <option value="active">Active</option>
                                    <option value="grace_period">Grace Period</option>
                                    <option value="suspended">Suspended</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>

                        {/* Billing */}
                        <div className="space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                            <h3 className="flex items-center gap-2 font-semibold">
                                <CreditCard className="size-4" />
                                {t("master.billing", { defaultValue: "Cobrança" })}
                            </h3>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    {t("master.plan", { defaultValue: "Plano" })}
                                </label>
                                <select
                                    value={formData.planId}
                                    onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-800"
                                >
                                    <option value="free">Free</option>
                                    <option value="plus">Plus</option>
                                    <option value="premium">Premium</option>
                                    <option value="master">Master</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    {t("master.billingStatus", { defaultValue: "Status de Pagamento" })}
                                </label>
                                <select
                                    value={formData.billingStatus}
                                    onChange={(e) => setFormData({ ...formData, billingStatus: e.target.value as AccountStatus })}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-600 dark:bg-gray-800"
                                >
                                    <option value="active">Active</option>
                                    <option value="grace_period">Grace Period</option>
                                    <option value="suspended">Suspended</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
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
