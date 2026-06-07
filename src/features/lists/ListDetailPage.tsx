import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Edit, Check, Users, Package, Search, Eraser, AlertTriangle, ShoppingCart, ClipboardList } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { useAuth } from "../auth/useAuth";
import { useList, useListItems } from "../../hooks/useLists";
import { useFamily } from "../../hooks/useFamily";
import { createListItem, toggleListItem, deleteListItem, deleteList } from "../../services/listService";
import { ManageListMembersModal } from "../../components/lists/ManageListMembersModal";
import { UserProfileViewModal } from "../../components/profile/UserProfileViewModal";
import type { DomainUserProps } from "../../domain/models";
import { getMemberDisplayName, memberProfileToDomainUser } from "../../utils/memberProfile";

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
    const [userAvatars, setUserAvatars] = useState<Record<string, string | null>>({});
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
    const [selectedUser, setSelectedUser] = useState<DomainUserProps | null>(null);
    const [showUserProfileModal, setShowUserProfileModal] = useState(false);

    const shouldReduce = useReducedMotion();

    const familyId = domainUser?.managedFamilyId ?? null;
    const { family } = useFamily(familyId);
    const { list, loading: listLoading } = useList(familyId, listId ?? null);
    const { items, loading: itemsLoading } = useListItems(familyId, listId ?? null);

    // Se tem acesso à lista (owner, master ou está em collaborators), pode fazer TUDO
    const isOwner = list?.ownerId === domainUser?.id;
    const isCollaborator = list?.collaborators.includes(domainUser?.id ?? '');
    const canEdit = isOwner || isCollaborator || domainUser?.isMaster;

    const profileForUser = (userId: string): DomainUserProps => {
        if (domainUser?.id === userId) {
            return domainUser.props;
        }

        return memberProfileToDomainUser(userId, family?.members[userId]);
    };

    // Usar dados cacheados em families.members. users/{uid} não é mais legível por outros usuários.
    useEffect(() => {
        const userIds = new Set<string>();

        // Add users from items
        items.forEach((item) => {
            if (item.createdBy) userIds.add(item.createdBy);
            if (item.checkedBy) userIds.add(item.checkedBy);
        });

        // Add collaborators and owner
        if (list?.collaborators) {
            list.collaborators.forEach((userId) => userIds.add(userId));
        }
        if (list?.ownerId) {
            userIds.add(list.ownerId);
        }

        const names: Record<string, string> = {};
        const avatars: Record<string, string | null> = {};
        for (const userId of userIds) {
            if (domainUser?.id === userId) {
                names[userId] = domainUser.displayName || domainUser.email || "Usuário";
                avatars[userId] = domainUser.photoURL || null;
            } else {
                const member = family?.members[userId];
                names[userId] = getMemberDisplayName(member);
                avatars[userId] = member?.photoURL || null;
            }
        }

        setUserNames((prev) => ({ ...prev, ...names }));
        setUserAvatars((prev) => ({ ...prev, ...avatars }));
    }, [items, list?.collaborators, list?.ownerId, family, domainUser]);

    const handleAddItem = async () => {
        if (!newItemName.trim() || !familyId || !listId || !domainUser || !canEdit) return;

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
        if (!familyId || !listId || !domainUser || !canEdit) return;
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
            <div className="mx-auto max-w-5xl animate-pulse space-y-6 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                    <div className="h-9 w-24 rounded-xl bg-surface-alt" />
                    <div className="flex gap-1">
                        <div className="h-9 w-9 rounded-xl bg-surface-alt" />
                        <div className="h-9 w-9 rounded-xl bg-surface-alt" />
                    </div>
                </div>
                <div className="flex items-start gap-4">
                    <div className="h-12 w-12 shrink-0 rounded-xl bg-surface-alt" />
                    <div className="flex-1 space-y-3">
                        <div className="h-7 w-2/3 rounded-lg bg-surface-alt" />
                        <div className="h-4 w-1/3 rounded-lg bg-surface-alt" />
                        <div className="h-1.5 w-full rounded-full bg-surface-alt" />
                    </div>
                </div>
                <div className="h-14 rounded-2xl bg-surface-alt" />
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 rounded-xl bg-surface-alt" style={{ opacity: 1 - (i - 1) * 0.2 }} />
                ))}
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

    const isShopping = list.type === "shopping";
    const ListIcon = isShopping ? ShoppingCart : ClipboardList;
    const progress = items.length > 0 ? Math.round((checkedItems.length / items.length) * 100) : 0;
    const isAllDone = items.length > 0 && uncheckedItems.length === 0 && !itemsLoading;

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
            <div className="space-y-4">
                {/* Row 1: back nav + owner actions */}
                <div className="flex items-center justify-between">
                    <motion.button
                        onClick={() => navigate("/lists")}
                        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted transition hover:bg-surface-alt hover:text-primary"
                        whileHover={shouldReduce ? {} : { x: -2 }}
                        whileTap={shouldReduce ? {} : { scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        <span>{t("navigation.lists", { defaultValue: "Listas" })}</span>
                    </motion.button>

                    {isOwner && (
                        <div className="flex gap-1">
                            <button
                                onClick={() => setShowManageMembersModal(true)}
                                title={t("lists.share.manageMembers", { defaultValue: "Gerenciar membros" })}
                                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-surface-alt hover:text-primary"
                            >
                                <Users className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => navigate(`/lists/${listId}/edit`)}
                                title={t("lists.edit", { defaultValue: "Editar lista" })}
                                className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition hover:bg-surface-alt hover:text-primary"
                            >
                                <Edit className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Row 2: type icon + title + progress + members */}
                <div className="flex items-start gap-4">
                    <div className={`shrink-0 rounded-xl p-3 ${
                        isShopping
                            ? "bg-purple-500/12 text-purple-500"
                            : "bg-blue-500/12 text-blue-500"
                    }`}>
                        <ListIcon className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl font-bold text-primary sm:text-3xl">{list.name}</h1>
                        {list.description && (
                            <p className="mt-1 text-sm text-muted">{list.description}</p>
                        )}

                        {/* Progress bar */}
                        {!itemsLoading && items.length > 0 && (
                            <div className="mt-3 space-y-1.5">
                                <div className="flex items-center justify-between text-xs text-muted">
                                    <span>
                                        {checkedItems.length}{" "}
                                        {isShopping
                                            ? t("lists.purchased", { defaultValue: "comprados" })
                                            : t("lists.completed", { defaultValue: "concluídos" })
                                        }{" "}
                                        {t("general.of", { defaultValue: "de" })}{" "}{items.length}
                                    </span>
                                    <span className={progress === 100 ? "font-semibold text-green-600 dark:text-green-400" : ""}>
                                        {progress}%
                                    </span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-surface-alt">
                                    <motion.div
                                        className={`h-full rounded-full ${
                                            progress === 100
                                                ? "bg-green-500"
                                                : isShopping
                                                    ? "bg-linear-to-r from-purple-500 to-pink-400"
                                                    : "bg-linear-to-r from-brand to-blue-400"
                                        }`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progress}%` }}
                                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Members */}
                        <div className="mt-4 flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {list.ownerId && (
                                    <button
                                        onClick={() => {
                                            setSelectedUser(profileForUser(list.ownerId));
                                            setShowUserProfileModal(true);
                                        }}
                                        className="transition hover:z-10 hover:scale-110"
                                    >
                                        <Avatar
                                            src={userAvatars[list.ownerId]}
                                            fallback={userNames[list.ownerId]?.[0]}
                                            size="sm"
                                            className="ring-2 ring-surface"
                                            title={`${userNames[list.ownerId]} (titular)`}
                                        />
                                    </button>
                                )}
                                {list.collaborators?.slice(0, 3).map((userId) => (
                                    <button
                                        key={userId}
                                        onClick={() => {
                                            setSelectedUser(profileForUser(userId));
                                            setShowUserProfileModal(true);
                                        }}
                                        className="transition hover:z-10 hover:scale-110"
                                    >
                                        <Avatar
                                            src={userAvatars[userId]}
                                            fallback={userNames[userId]?.[0]}
                                            size="sm"
                                            className="ring-2 ring-surface"
                                            title={userNames[userId]}
                                        />
                                    </button>
                                ))}
                                {list.collaborators && list.collaborators.length > 3 && (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-alt text-xs font-medium text-muted ring-2 ring-surface">
                                        +{list.collaborators.length - 3}
                                    </div>
                                )}
                            </div>
                            <span className="text-xs text-muted">
                                {1 + (list.collaborators?.length || 0)} {t("general.members", { defaultValue: "membros" })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <Card padding="md" elevated>
                <div className="space-y-3">
                    {/* Input principal com botão ao lado APENAS em desktop/tablet */}
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && !showAdvanced && handleAddItem()}
                            placeholder={t("lists.addItemPlaceholder", { defaultValue: "Adicionar item..." })}
                            className="min-w-0 flex-1 rounded-xl border border-soft bg-surface-alt px-4 py-3 text-sm text-primary outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/40"
                            disabled={adding}
                        />
                        {/* Botão para desktop/tablet (ao lado do input) - esconde no mobile */}
                        <div className="hidden! shrink-0 md:block!">
                            <Button
                                onClick={handleAddItem}
                                disabled={!newItemName.trim() || adding}
                                size="md"
                                icon={<Plus className="h-5 w-5" />}
                            >
                                {t("actions.add", { defaultValue: "Adicionar" })}
                            </Button>
                        </div>
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

                    {/* Botão para mobile (embaixo de tudo) - esconde no desktop/tablet */}
                    <div className="block! md:hidden!">
                        <Button
                            onClick={handleAddItem}
                            disabled={!newItemName.trim() || adding}
                            size="md"
                            className="w-full"
                            icon={<Plus className="h-5 w-5" />}
                        >
                            {t("actions.add", { defaultValue: "Adicionar" })}
                        </Button>
                    </div>

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
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="flex items-center gap-3 rounded-xl border border-soft p-4"
                            style={{ opacity: 1 - (i - 1) * 0.18 }}
                        >
                            <div className="h-6 w-6 shrink-0 rounded-lg bg-surface-alt" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 rounded-lg bg-surface-alt" style={{ width: `${72 - i * 8}%` }} />
                                <div className="h-3 w-24 rounded-lg bg-surface-alt" />
                            </div>
                        </div>
                    ))}
                </div>
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
                                <div className="flex items-center gap-2">
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
                                                animate={{ opacity: 1, width: "200px" }}
                                                exit={{ opacity: 0, width: 0 }}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder={t("lists.searchPlaceholder", { defaultValue: "Buscar..." })}
                                                className="rounded-lg border border-soft bg-surface px-3 py-1.5 text-sm outline-none transition focus:border-brand"
                                                autoFocus
                                            />
                                        )}
                                    </AnimatePresence>
                                </div>

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

                    {/* All done celebration */}
                    <AnimatePresence>
                        {isAllDone && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.92 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.92 }}
                                transition={{ type: "spring", stiffness: 400, damping: 28 }}
                                className="rounded-2xl border border-green-500/20 bg-green-500/5 py-12 text-center"
                            >
                                <motion.div
                                    animate={shouldReduce ? {} : { rotate: [0, -12, 12, -8, 8, -4, 4, 0] }}
                                    transition={{ delay: 0.3, duration: 0.8 }}
                                    className="text-5xl"
                                >
                                    🎉
                                </motion.div>
                                <p className="mt-3 text-base font-semibold text-green-700 dark:text-green-400">
                                    {isShopping
                                        ? t("lists.allPurchased", { defaultValue: "Compras finalizadas!" })
                                        : t("lists.allCompleted", { defaultValue: "Tudo concluído!" })}
                                </p>
                                <p className="mt-1 text-sm text-muted">
                                    {t("lists.allDoneHint", { defaultValue: "Todos os itens estão marcados" })}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {uncheckedItems.length > 0 && (
                        <div>
                            {/* Section header */}
                            <div className="mb-3 flex items-center gap-2.5 px-1">
                                <div className={`h-2 w-2 rounded-full ${isShopping ? "bg-purple-400" : "bg-blue-400"}`} />
                                <span className="text-xs font-semibold uppercase tracking-widest text-muted">
                                    {t("lists.pending", { defaultValue: "Pendentes" })}
                                </span>
                                <motion.span
                                    key={uncheckedItems.length}
                                    initial={shouldReduce ? {} : { scale: 1.35, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 28 }}
                                    className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                                        isShopping
                                            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                    }`}
                                >
                                    {uncheckedItems.length}
                                </motion.span>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <AnimatePresence initial={false}>
                                {uncheckedItems.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={shouldReduce ? { opacity: 0 } : { opacity: 0, x: 16, scale: 0.96 }}
                                        whileHover={shouldReduce ? {} : { y: -2 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 34 }}
                                        className="group relative flex cursor-default items-start gap-3 overflow-hidden rounded-xl border border-soft bg-surface-alt p-4 transition-shadow hover:shadow-sm"
                                    >
                                        <div className={`absolute inset-y-0 left-0 w-0.5 ${isShopping ? "bg-purple-400/60" : "bg-blue-400/60"}`} />
                                        {/* Circular unchecked toggle */}
                                        <motion.button
                                            onClick={() => handleToggleItem(item.id, item.checked)}
                                            whileTap={shouldReduce ? {} : { scale: 0.68 }}
                                            transition={{ type: "spring", stiffness: 600, damping: 20 }}
                                            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-muted/30 transition hover:border-brand hover:bg-brand/10"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="text-sm font-medium leading-snug text-primary">
                                                    {item.name}
                                                    {item.quantity && (
                                                        <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">
                                                            {item.quantity}×
                                                        </span>
                                                    )}
                                                </span>
                                                {canEdit && (
                                                    <motion.button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        whileTap={{ scale: 0.85 }}
                                                        className="shrink-0 rounded-lg p-1 text-muted opacity-100 transition hover:bg-danger/10 hover:text-danger sm:opacity-0 sm:group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </motion.button>
                                                )}
                                            </div>
                                            {item.notes && (
                                                <p className="mt-0.5 text-xs text-muted">{item.notes}</p>
                                            )}
                                            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                                                <Avatar
                                                    src={userAvatars[item.createdBy]}
                                                    fallback={userNames[item.createdBy]?.[0] || "?"}
                                                    size="sm"
                                                />
                                                <span className="truncate">{userNames[item.createdBy] || "..."}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    {checkedItems.length > 0 && (
                        <div>
                            {/* Section header */}
                            <div className="mb-3 flex items-center gap-2.5 px-1">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <span className="text-xs font-semibold uppercase tracking-widest text-muted">
                                    {isShopping
                                        ? t("lists.purchased", { defaultValue: "Comprados" })
                                        : t("lists.completed", { defaultValue: "Concluídos" })}
                                </span>
                                <motion.span
                                    key={checkedItems.length}
                                    initial={shouldReduce ? {} : { scale: 1.35, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 28 }}
                                    className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-green-500/10 px-1.5 text-xs font-bold text-green-600 dark:text-green-400"
                                >
                                    {checkedItems.length}
                                </motion.span>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <AnimatePresence initial={false}>
                                {checkedItems.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
                                        animate={{ opacity: 0.6, y: 0, scale: 1 }}
                                        exit={shouldReduce ? { opacity: 0 } : { opacity: 0, x: 16, scale: 0.96 }}
                                        whileHover={{ opacity: 1 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 34 }}
                                        className="group relative flex cursor-default items-start gap-3 overflow-hidden rounded-xl border border-soft bg-green-500/5 p-4"
                                    >
                                        <div className="absolute inset-y-0 left-0 w-0.5 bg-green-500/50" />
                                        {/* Circular checked toggle */}
                                        <motion.button
                                            onClick={() => handleToggleItem(item.id, item.checked)}
                                            whileTap={shouldReduce ? {} : { scale: 0.68 }}
                                            transition={{ type: "spring", stiffness: 600, damping: 20 }}
                                            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500 text-white transition hover:bg-green-600"
                                        >
                                            <motion.span
                                                initial={shouldReduce ? {} : { scale: 0, rotate: -45 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: "spring", stiffness: 600, damping: 22 }}
                                                className="flex"
                                            >
                                                <Check className="h-3 w-3" />
                                            </motion.span>
                                        </motion.button>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <span className="text-sm font-medium leading-snug text-primary line-through opacity-60">
                                                    {item.name}
                                                    {item.quantity && (
                                                        <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand line-through">
                                                            {item.quantity}×
                                                        </span>
                                                    )}
                                                </span>
                                                {canEdit && (
                                                    <motion.button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        whileTap={{ scale: 0.85 }}
                                                        className="shrink-0 rounded-lg p-1 text-muted opacity-100 transition hover:bg-danger/10 hover:text-danger sm:opacity-0 sm:group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </motion.button>
                                                )}
                                            </div>
                                            {item.notes && (
                                                <p className="mt-0.5 text-xs text-muted line-through opacity-60">{item.notes}</p>
                                            )}
                                            <div className="mt-2 flex flex-col gap-1 text-xs text-muted">
                                                <div className="flex items-center gap-1.5">
                                                    <Avatar
                                                        src={userAvatars[item.createdBy]}
                                                        fallback={userNames[item.createdBy]?.[0] || "?"}
                                                        size="sm"
                                                    />
                                                    <span className="truncate">{userNames[item.createdBy] || "..."}</span>
                                                </div>
                                                {item.checkedBy && item.checkedAt && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Avatar
                                                            src={userAvatars[item.checkedBy]}
                                                            fallback={userNames[item.checkedBy]?.[0] || "?"}
                                                            size="sm"
                                                        />
                                                        <span className="truncate">
                                                            {isShopping
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
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                </AnimatePresence>
                            </div>
                        </div>
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

            {/* User Profile View Modal */}
            <UserProfileViewModal
                isOpen={showUserProfileModal}
                onClose={() => {
                    setShowUserProfileModal(false);
                    setSelectedUser(null);
                }}
                user={selectedUser}
            />
        </motion.div>
    );
}
