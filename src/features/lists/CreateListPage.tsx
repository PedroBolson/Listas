import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../auth/useAuth";
import { createList } from "../../services/listService";

export function CreateListPage() {
    const { domainUser } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        name: "",
        description: "",
        type: "shopping" as "shopping" | "tasks",
    });

    const primaryFamilyId = domainUser?.props.primaryFamilyId;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !primaryFamilyId || !domainUser) return;

        setSaving(true);
        try {
            const listData: any = {
                name: form.name.trim(),
                type: form.type,
                familyId: primaryFamilyId,
                ownerId: domainUser.id,
                visibility: "private",
                tags: [],
                permissions: [],
                collaborators: [],
            };

            // Só adicionar description se tiver valor
            if (form.description.trim()) {
                listData.description = form.description.trim();
            }

            await createList(primaryFamilyId, listData);
            navigate("/lists");
        } catch (error) {
            console.error("Erro ao criar lista:", error);
            alert(t("lists.createError", { defaultValue: "Erro ao criar lista" }));
        } finally {
            setSaving(false);
        }
    };

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
                        {t("lists.create", { defaultValue: "Nova Lista" })}
                    </h1>
                    <p className="mt-1 text-sm text-muted">
                        {t("lists.createHint", { defaultValue: "Crie uma nova lista para organizar seus itens" })}
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
                            maxLength={100}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="type" className="block text-sm font-medium text-secondary">
                            {t("lists.type", { defaultValue: "Tipo de lista" })} *
                        </label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, type: "shopping" })}
                                className={`flex-1 rounded-xl border-2 p-4 text-left transition ${form.type === "shopping"
                                        ? "border-brand bg-brand-soft text-brand"
                                        : "border-soft bg-surface-alt text-secondary hover:border-brand/40"
                                    }`}
                            >
                                <div className="text-sm font-semibold">🛒 {t("lists.typeShopping", { defaultValue: "Compras" })}</div>
                                <div className="mt-1 text-xs opacity-80">{t("lists.typeShoppingHint", { defaultValue: "Itens para comprar" })}</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, type: "tasks" })}
                                className={`flex-1 rounded-xl border-2 p-4 text-left transition ${form.type === "tasks"
                                        ? "border-brand bg-brand-soft text-brand"
                                        : "border-soft bg-surface-alt text-secondary hover:border-brand/40"
                                    }`}
                            >
                                <div className="text-sm font-semibold">✓ {t("lists.typeTasks", { defaultValue: "Tarefas" })}</div>
                                <div className="mt-1 text-xs opacity-80">{t("lists.typeTasksHint", { defaultValue: "Coisas a fazer" })}</div>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="description" className="block text-sm font-medium text-secondary">
                            {t("lists.description", { defaultValue: "Descrição" })} ({t("common.optional", { defaultValue: "opcional" })})
                        </label>
                        <textarea
                            id="description"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder={t("lists.descriptionPlaceholder", { defaultValue: "Adicione detalhes sobre esta lista..." })}
                            className="w-full rounded-xl border border-soft bg-surface-alt px-4 py-3 text-sm text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/40"
                            rows={4}
                            maxLength={500}
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => navigate(-1)}
                            disabled={saving}
                        >
                            {t("actions.cancel", { defaultValue: "Cancelar" })}
                        </Button>
                        <Button
                            type="submit"
                            disabled={!form.name.trim() || saving}
                            icon={saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        >
                            {saving ? t("actions.saving", { defaultValue: "Salvando..." }) : t("actions.create", { defaultValue: "Criar" })}
                        </Button>
                    </div>
                </form>
            </Card>
        </motion.div>
    );
}
