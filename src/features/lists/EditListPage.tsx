import { useState, useEffect, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../auth/useAuth";
import { getListById, updateList } from "../../services/listService";

export function EditListPage() {
    const { listId } = useParams<{ listId: string }>();
    const { domainUser } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        name: "",
        description: "",
    });

    const primaryFamilyId = domainUser?.props.primaryFamilyId;

    useEffect(() => {
        if (!primaryFamilyId || !listId) return;

        const loadList = async () => {
            try {
                const list = await getListById(primaryFamilyId, listId);
                if (list) {
                    setForm({
                        name: list.name,
                        description: list.description || "",
                    });
                }
            } catch (error) {
                console.error("Erro ao carregar lista:", error);
            } finally {
                setLoading(false);
            }
        };

        loadList();
    }, [primaryFamilyId, listId]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !primaryFamilyId || !listId) return;

        setSaving(true);
        try {
            const updateData: any = {
                name: form.name.trim(),
            };

            if (form.description.trim()) {
                updateData.description = form.description.trim();
            }

            await updateList(primaryFamilyId, listId, updateData);
            navigate(`/lists/${listId}`);
        } catch (error) {
            console.error("Erro ao atualizar lista:", error);
            alert(t("lists.updateError", { defaultValue: "Erro ao atualizar lista" }));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
            </div>
        );
    }

    return (
        <motion.div
            className="mx-auto max-w-2xl space-y-6 p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-center gap-4">
                <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-primary">
                        {t("lists.edit", { defaultValue: "Editar Lista" })}
                    </h1>
                    <p className="mt-1 text-sm text-muted">
                        {t("lists.editHint", { defaultValue: "Atualize as informações da lista" })}
                    </p>
                </div>
            </div>

            <Card padding="lg" elevated>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="name" className="block text-sm font-medium text-secondary">
                            {t("lists.name", { defaultValue: "Nome da lista" })} *
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder={t("lists.namePlaceholder", { defaultValue: "Ex: Compras do mês" })}
                            className="w-full rounded-xl border border-soft bg-surface-alt px-4 py-3 text-sm text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/40"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="description" className="block text-sm font-medium text-secondary">
                            {t("lists.description", { defaultValue: "Descrição (opcional)" })}
                        </label>
                        <textarea
                            id="description"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder={t("lists.descriptionPlaceholder", { defaultValue: "Adicione detalhes sobre esta lista..." })}
                            rows={4}
                            className="w-full rounded-xl border border-soft bg-surface-alt px-4 py-3 text-sm text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/40"
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
                            {t("actions.cancel", { defaultValue: "Cancelar" })}
                        </Button>
                        <Button type="submit" disabled={saving || !form.name.trim()} icon={saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}>
                            {saving ? t("actions.saving", { defaultValue: "Salvando..." }) : t("actions.save", { defaultValue: "Salvar" })}
                        </Button>
                    </div>
                </form>
            </Card>
        </motion.div>
    );
}
