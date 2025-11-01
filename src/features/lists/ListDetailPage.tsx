import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Edit, Check, Users, MoreVertical, Package, Search, Eraser, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useAuth } from "../auth/useAuth";
import { useList, useListItems } from "../../hooks/useLists";
import { createListItem, toggleListItem, deleteListItem, deleteList } from "../../services/listService";
import { getUserById } from "../../services/userService";
import { ManageListMembersModal } from "../../components/lists/ManageListMembersModal";

export function ListDetailPage() {
    const { listId } = useParams<{ listId: string }>();
    const { domainUser } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [newItemName, setNewItemName] = useState("");
    const [newItemNotes, setNewItemNotes] = useState("");
    const [newItemQuantity, setNewItemQuantity] = useState<number | undefined>(undefined);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [adding, setAdding] = useState(false);
    const [userNames, setUserNames] = useState<Record<string, string>>({});
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: "danger" | "warning";
    }>({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => { },
    });
    const [isDeleting, setIsDeleting] = useState(false);
    const [showManageMembersModal, setShowManageMembersModal] = useState(false);

    const familyId = domainUser?.managedFamilyId ?? null;
    const { list, loading: listLoading } = useList(familyId, listId ?? null);
    const { items, loading: itemsLoading } = useListItems(familyId, listId ?? null);

    const isOwner = list?.ownerId === domainUser?.id;
    const canEdit = isOwner || domainUser?.isMaster;

    // Fetch user names for items
    useEffect(() => {
        const userIds = new Set<string>();
        items.forEach((item) => {
            if (item.createdBy) userIds.add(item.createdBy);
            if (item.checkedBy) userIds.add(item.checkedBy);
        });

        const fetchNames = async () => {
            const names: Record<string, string> = {};
            for (const userId of userIds) {
                if (!userNames[userId]) {
                    const user = await getUserById(userId);
                    names[userId] = user?.displayName || user?.email || "Usuário";
                }
            }
            if (Object.keys(names).length > 0) {
                setUserNames((prev) => ({ ...prev, ...names }));
            }
        };

        fetchNames();
    }, [items]);

    const handleAddItem = async () => {
        if (!newItemName.trim() || !familyId || !listId || !domainUser) return;

        setAdding(true);
        try {
            const itemData: any = {
                name: newItemName.trim(),
                checked: false,
                createdBy: domainUser.id,
            };

            if (newItemNotes.trim()) {
                itemData.notes = newItemNotes.trim();
            }

            if (newItemQuantity && newItemQuantity > 0) {
                itemData.quantity = newItemQuantity;
            }

            await createListItem(familyId, listId, itemData);
            setNewItemName("");
            setNewItemNotes("");
            setNewItemQuantity(undefined);
            setShowAdvanced(false);
        } catch (error) {
            console.error("Erro ao adicionar item:", error);
        } finally {
            setAdding(false);
        }
    };

    const handleToggleItem = async (itemId: string, checked: boolean) => {
        if (!familyId || !listId || !domainUser) return;
        try {
            await toggleListItem(familyId, listId, itemId, !checked, domainUser.id);
        } catch (error) {
            console.error("Erro ao marcar item:", error);
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        if (!canEdit || !familyId || !listId) return;
        if (!confirm(t("lists.confirmDeleteItem", { defaultValue: "Excluir este item?" }))) return;

        try {
            await deleteListItem(familyId, listId, itemId);
        } catch (error) {
            console.error("Erro ao excluir item:", error);
        }
    };

    // Todos os useMemo precisam estar antes dos returns condicionais
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items;
        const query = searchQuery.toLowerCase();
        return items.filter(item =>
            item.name.toLowerCase().includes(query) ||
            item.notes?.toLowerCase().includes(query)
        );
    }, [items, searchQuery]);

    const uncheckedItems = useMemo(() =>
        filteredItems.filter((item) => !item.checked),
        [filteredItems]
    );

    const checkedItems = useMemo(() =>
        filteredItems.filter((item) => item.checked),
        [filteredItems]
    );

    if (listLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
            </div>
        );
    }

    if (!list) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Card padding="lg" elevated className="text-center">
                    <h2 className="text-xl font-semibold text-primary">
                        {t("lists.notFound", { defaultValue: "Lista não encontrada" })}
                    </h2>
                    <Button onClick={() => navigate("/lists")} className="mt-4">
                        {t("actions.backToLists", { defaultValue: "Voltar para listas" })}
                    </Button>
                </Card>
            </div>
        );
    }

    const handleDeleteCompletedItems = () => {
        if (!familyId || !listId) return;

        const itemType = list.type === "shopping"
            ? t("lists.purchased", { defaultValue: "itens comprados" })
            : t("lists.completed", { defaultValue: "itens concluídos" });

        setConfirmDialog({
            isOpen: true,
            title: t("lists.deleteCompletedTitle", { defaultValue: "Limpar itens concluídos" }),
            message: t("lists.confirmDeleteCompleted", {
                defaultValue: `Isso vai deletar permanentemente ${checkedItems.length} ${itemType}. Esta ação não pode ser desfeita.`,
                count: checkedItems.length,
                type: itemType
            }),
            variant: "warning",
            onConfirm: async () => {
                setIsDeleting(true);
                try {
                    await Promise.all(checkedItems.map(item =>
                        deleteListItem(familyId, listId, item.id)
                    ));
                } catch (error) {
                    console.error("Erro ao excluir itens concluídos:", error);
                    alert(t("lists.deleteError", { defaultValue: "Erro ao excluir itens" }));
                } finally {
                    setIsDeleting(false);
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                }
            }
        });
    };

    const handleDeleteAllItems = () => {
        if (!isOwner || !familyId || !listId) return;

        setConfirmDialog({
            isOpen: true,
            title: t("lists.deleteAllItemsTitle", { defaultValue: "Deletar todos os itens" }),
            message: t("lists.confirmDeleteAll", {
                defaultValue: `Isso vai deletar permanentemente TODOS os ${items.length} itens desta lista. Esta ação não pode ser desfeita.`,
                count: items.length
            }),
            variant: "danger",
            onConfirm: async () => {
                setIsDeleting(true);
                try {
                    await Promise.all(items.map(item =>
                        deleteListItem(familyId, listId, item.id)
                    ));
                } catch (error) {
                    console.error("Erro ao excluir todos os itens:", error);
                    alert(t("lists.deleteError", { defaultValue: "Erro ao excluir itens" }));
                } finally {
                    setIsDeleting(false);
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                }
            }
        });
    };

    const handleDeleteListCascade = () => {
        if (!isOwner || !familyId || !listId) return;

        setConfirmDialog({
            isOpen: true,
            title: t("lists.deleteListTitle", { defaultValue: "Deletar lista inteira" }),
            message: t("lists.confirmDeleteListCascade", {
                defaultValue: `⚠️ ATENÇÃO: Isso vai deletar a lista "${list.name}" e TODOS os seus ${items.length} itens. Esta ação não pode ser desfeita!`,
                name: list.name,
                count: items.length
            }),
            variant: "danger",
            onConfirm: async () => {
                setIsDeleting(true);
                try {
                    await deleteList(familyId, listId);
                    navigate("/lists");
                } catch (error) {
                    console.error("Erro ao excluir lista:", error);
                    alert(t("lists.deleteError", { defaultValue: "Erro ao excluir lista" }));
                    setIsDeleting(false);
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                }
            }
        });
    };

    return (
        <motion.div
            className="mx-auto max-w-5xl space-y-6 p-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="mt-1">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-primary">{list.name}</h1>
                        {list.description && (
                            <p className="mt-2 text-sm text-muted">{list.description}</p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                            <span className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {list.collaborators?.length || 0} {t("general.members", { defaultValue: "membros" })}
                            </span>
                            <span>•</span>
                            <span>
                                {items.length} {t("lists.itemsCount", { defaultValue: "itens" })}
                            </span>
                            {items.length > 0 && (
                                <>
                                    <span>•</span>
                                    <span>
                                        {checkedItems.length} {list.type === "shopping"
                                            ? t("lists.purchased", { defaultValue: "comprados" })
                                            : t("lists.completed", { defaultValue: "concluídos" })
                                        }
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                {canEdit && (
                    <div className="flex shrink-0 gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowManageMembersModal(true)}
                            title={t("lists.share.manageMembers", { defaultValue: "Gerenciar membros" })}
                        >
                            <Users className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/lists/${listId}/edit`)}
                        >
                            <Edit className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="sm">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </div>
                )}
            </div>

            <Card padding="md" elevated>
                <div className="space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !showAdvanced && handleAddItem()}
                            placeholder={t("lists.addItemPlaceholder", { defaultValue: "Adicionar item..." })}
                            className="min-w-0 flex-1 rounded-xl border border-soft bg-surface-alt px-4 py-3 text-sm text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/40"
                            disabled={adding}
                        />
                        {/* Botão fica embaixo em mobile, ao lado em desktop */}
                        <Button
                            onClick={handleAddItem}
                            disabled={!newItemName.trim() || adding}
                            size="md"
                            className="w-full shrink-0 sm:w-auto"
                            icon={<Plus className="h-5 w-5" />}
                        >
                            {t("actions.add", { defaultValue: "Adicionar" })}
                        </Button>
                    </div>

                    {showAdvanced && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-2"
                        >
                            <input
                                type="text"
                                value={newItemNotes}
                                onChange={(e) => setNewItemNotes(e.target.value)}
                                placeholder={t("lists.itemNotes", { defaultValue: "Notas (opcional)..." })}
                                className="w-full rounded-xl border border-soft bg-surface-alt px-4 py-2 text-sm text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/40"
                                disabled={adding}
                            />
                            <input
                                type="number"
                                value={newItemQuantity ?? ""}
                                onChange={(e) => setNewItemQuantity(e.target.value ? Number(e.target.value) : undefined)}
                                placeholder={t("lists.itemQuantity", { defaultValue: "Quantidade (opcional)..." })}
                                className="w-full rounded-xl border border-soft bg-surface-alt px-4 py-2 text-sm text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/40"
                                disabled={adding}
                                min="1"
                            />
                        </motion.div>
                    )}

                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="text-xs text-brand hover:underline"
                        type="button"
                    >
                        {showAdvanced
                            ? t("actions.hideAdvanced", { defaultValue: "Ocultar opções" })
                            : t("actions.showAdvanced", { defaultValue: "Adicionar notas/quantidade" })}
                    </button>
                </div>
            </Card>

            {itemsLoading ? (
                <Card padding="lg" elevated>
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="animate-pulse">
                                <div className="h-12 rounded-xl bg-surface-alt" />
                            </div>
                        ))}
                    </div>
                </Card>
            ) : items.length === 0 ? (
                <Card padding="lg" elevated>
                    <div className="py-12 text-center">
                        <Package className="mx-auto h-16 w-16 text-muted" />
                        <h3 className="mt-4 text-lg font-semibold text-primary">
                            {t("lists.noItems", { defaultValue: "Nenhum item ainda" })}
                        </h3>
                        <p className="mt-2 text-sm text-muted">
                            {t("lists.noItemsHint", { defaultValue: "Adicione seu primeiro item acima" })}
                        </p>
                    </div>
                </Card>
            ) : (
                <div className="space-y-4">
                    {/* Barra de ações - sempre visível quando há itens */}
                    <Card padding="md" elevated>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="text-sm font-semibold text-muted">
                                {t("lists.actions", { defaultValue: "Ações" })}
                            </h3>

                            <div className="flex flex-wrap items-center gap-2">
                                {/* Busca - disponível para todos */}
                                <motion.div
                                    initial={false}
                                    animate={{ width: showSearch ? "100%" : "auto" }}
                                    className="flex items-center gap-2 overflow-hidden sm:w-auto"
                                >
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setShowSearch(!showSearch);
                                            if (showSearch) setSearchQuery("");
                                        }}
                                        title={t("lists.search", { defaultValue: "Buscar" })}
                                    >
                                        <Search className="h-4 w-4" />
                                    </Button>
                                    <AnimatePresence>
                                        {showSearch && (
                                            <motion.input
                                                initial={{ opacity: 0, width: 0 }}
                                                animate={{ opacity: 1, width: "auto" }}
                                                exit={{ opacity: 0, width: 0 }}
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder={t("lists.searchPlaceholder", { defaultValue: "Buscar..." })}
                                                className="flex-1 rounded-lg border border-soft bg-surface px-3 py-1.5 text-sm outline-none transition focus:border-brand sm:w-40"
                                            />
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                {/* Deletar concluídos - disponível para todos */}
                                {checkedItems.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleDeleteCompletedItems}
                                        title={t("lists.deleteCompleted", { defaultValue: "Limpar concluídos" })}
                                        className="text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                                    >
                                        <Eraser className="h-4 w-4" />
                                    </Button>
                                )}

                                {/* Deletar todos os itens - apenas owner da lista */}
                                {isOwner && items.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleDeleteAllItems}
                                        title={t("lists.deleteAllItems", { defaultValue: "Deletar todos os itens" })}
                                        className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}

                                {/* Deletar lista completa - apenas owner da lista */}
                                {isOwner && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleDeleteListCascade}
                                        title={t("lists.deleteListCascade", { defaultValue: "Deletar lista inteira" })}
                                        className="text-red-700 hover:bg-red-100 dark:hover:bg-red-950/30"
                                    >
                                        <AlertTriangle className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>

                    {uncheckedItems.length > 0 && (
                        <Card padding="lg" elevated>
                            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
                                {t("lists.pending", { defaultValue: "Pendentes" })} ({uncheckedItems.length})
                            </h3>
                            <div className="space-y-2">
                                {uncheckedItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-start gap-3 rounded-xl border border-soft bg-surface-alt p-4 transition hover:border-brand"
                                    >
                                        <button
                                            onClick={() => handleToggleItem(item.id, item.checked)}
                                            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 border-muted/40 transition hover:border-brand hover:bg-brand-soft"
                                        />
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="text-sm font-medium text-primary">
                                                    {item.name}
                                                    {item.quantity && (
                                                        <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand">
                                                            {item.quantity}x
                                                        </span>
                                                    )}
                                                </span>
                                                {canEdit && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        className="text-danger hover:bg-danger/10"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            {item.notes && (
                                                <p className="text-xs text-muted">{item.notes}</p>
                                            )}
                                            <p className="text-xs text-muted">
                                                {t("lists.addedBy", { defaultValue: "Adicionado por" })}{" "}
                                                <span className="font-medium">{userNames[item.createdBy] || "..."}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {checkedItems.length > 0 && (
                        <Card padding="lg" elevated>
                            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
                                {list.type === "shopping"
                                    ? t("lists.purchased", { defaultValue: "Comprados" })
                                    : t("lists.completed", { defaultValue: "Concluídos" })
                                } ({checkedItems.length})
                            </h3>
                            <div className="space-y-2">
                                {checkedItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-start gap-3 rounded-xl border border-soft bg-surface-alt p-4 opacity-60 transition hover:opacity-100"
                                    >
                                        <button
                                            onClick={() => handleToggleItem(item.id, item.checked)}
                                            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 border-green-600 bg-green-600 text-white transition hover:bg-green-700"
                                        >
                                            <Check className="h-4 w-4" />
                                        </button>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="text-sm font-medium text-primary line-through">
                                                    {item.name}
                                                    {item.quantity && (
                                                        <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-xs text-brand line-through">
                                                            {item.quantity}x
                                                        </span>
                                                    )}
                                                </span>
                                                {canEdit && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        className="text-danger hover:bg-danger/10"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            {item.notes && (
                                                <p className="text-xs text-muted line-through">{item.notes}</p>
                                            )}
                                            <div className="text-xs text-muted">
                                                <p>
                                                    {t("lists.addedBy", { defaultValue: "Adicionado por" })}{" "}
                                                    <span className="font-medium">{userNames[item.createdBy] || "..."}</span>
                                                </p>
                                                {item.checkedBy && item.checkedAt && (
                                                    <p>
                                                        {list.type === "shopping"
                                                            ? t("lists.purchasedBy", { defaultValue: "Comprado por" })
                                                            : t("lists.completedBy", { defaultValue: "Concluído por" })
                                                        }{" "}
                                                        <span className="font-medium">{userNames[item.checkedBy] || "..."}</span>
                                                        {" • "}
                                                        {new Date(item.checkedAt).toLocaleDateString("pt-BR", {
                                                            day: "2-digit",
                                                            month: "short",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                        })}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
            )}

            {/* Confirm Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                variant={confirmDialog.variant}
                confirmText={t("actions.confirm", { defaultValue: "Confirmar" })}
                cancelText={t("actions.cancel", { defaultValue: "Cancelar" })}
                loading={isDeleting}
            />

            {/* Manage Members Modal */}
            {list && (
                <ManageListMembersModal
                    list={list}
                    isOpen={showManageMembersModal}
                    onClose={() => setShowManageMembersModal(false)}
                    onSuccess={() => {
                        // Lista será atualizada automaticamente pelo subscription
                        setShowManageMembersModal(false);
                    }}
                />
            )}
        </motion.div>
    );
}
