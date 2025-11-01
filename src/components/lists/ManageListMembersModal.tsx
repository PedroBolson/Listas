import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Check, UserPlus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Avatar } from "../ui/Avatar";
import { useFamily } from "../../hooks/useFamily";
import { updateListPermissions } from "../../services/listService";
import type { ListRecord, PermissionRule, FamilyMemberProfile } from "../../domain/models";
import { getUserById } from "../../services/userService";
import type { DomainUserProps } from "../../domain/models";

interface ManageListMembersModalProps {
    list: ListRecord;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

interface MemberWithDetails extends FamilyMemberProfile {
    userDetails?: DomainUserProps;
    currentPermissions?: PermissionRule;
}

export function ManageListMembersModal({ list, isOpen, onClose, onSuccess }: ManageListMembersModalProps) {
    const { t } = useTranslation();
    const { family } = useFamily(list.familyId);
    const [saving, setSaving] = useState(false);
    const [memberDetails, setMemberDetails] = useState<Map<string, DomainUserProps>>(new Map());

    // Estado local das permissões (editável)
    const [localPermissions, setLocalPermissions] = useState<Map<string, PermissionRule>>(new Map());

    // Carregar permissões atuais no estado local
    useEffect(() => {
        if (!isOpen) return;

        const permMap = new Map<string, PermissionRule>();
        list.permissions.forEach(perm => {
            permMap.set(perm.userId, perm);
        });
        setLocalPermissions(permMap);
    }, [list.permissions, isOpen]);

    // Buscar detalhes dos membros da família
    useEffect(() => {
        if (!family || !isOpen) return;

        const fetchDetails = async () => {
            const details = new Map<string, DomainUserProps>();

            for (const [userId, member] of Object.entries(family.members)) {
                if (member.status === "active" && userId !== list.ownerId) {
                    // Preferir dados do profile na família
                    if ((member as any).displayName) {
                        const minimal: DomainUserProps = {
                            id: userId,
                            email: (member as any).email || "",
                            displayName: (member as any).displayName || "",
                            photoURL: null,
                            locale: "pt",
                            role: "member",
                            status: "active",
                            families: [],
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                        };
                        details.set(userId, minimal);
                    } else {
                        try {
                            const userData = await getUserById(userId);
                            if (userData) {
                                details.set(userId, userData);
                            }
                        } catch (error) {
                            console.error(`Erro ao buscar usuário ${userId}:`, error);
                        }
                    }
                }
            }

            setMemberDetails(details);
        };

        fetchDetails();
    }, [family, list.ownerId, isOpen]);

    // Lista de membros disponíveis (exceto owner)
    const availableMembers = useMemo<MemberWithDetails[]>(() => {
        if (!family) return [];

        return Object.entries(family.members)
            .filter(([userId, member]) =>
                member.status === "active" &&
                userId !== list.ownerId
            )
            .map(([userId, member]) => ({
                ...member,
                userDetails: memberDetails.get(userId),
                currentPermissions: localPermissions.get(userId),
            }));
    }, [family, list.ownerId, memberDetails, localPermissions]);

    const toggleMember = (userId: string) => {
        const newPermissions = new Map(localPermissions);

        if (newPermissions.has(userId)) {
            // Remove membro
            newPermissions.delete(userId);
        } else {
            // Adiciona membro com permissões padrão
            newPermissions.set(userId, {
                userId,
                canCreateItems: true,
                canToggleItems: true,
                canDeleteItems: false,
            });
        }

        setLocalPermissions(newPermissions);
    };

    const updatePermission = (userId: string, field: keyof Omit<PermissionRule, "userId">, value: boolean) => {
        const newPermissions = new Map(localPermissions);
        const current = newPermissions.get(userId);

        if (current) {
            newPermissions.set(userId, {
                ...current,
                [field]: value,
            });
            setLocalPermissions(newPermissions);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const permissionsArray = Array.from(localPermissions.values());
            const collaboratorsArray = Array.from(localPermissions.keys());

            await updateListPermissions(list.familyId, list.id, permissionsArray, collaboratorsArray);

            onSuccess?.();
            onClose();
        } catch (error) {
            console.error("Erro ao salvar permissões:", error);
            alert(t("lists.share.saveError", { defaultValue: "Erro ao salvar permissões" }));
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="w-full max-w-2xl"
                >
                    <Card padding="lg">
                        <div className="mb-6 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10">
                                    <Users className="h-5 w-5 text-brand" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-default">
                                        {t("lists.share.title", { defaultValue: "Compartilhar lista" })}
                                    </h2>
                                    <p className="text-sm text-muted">{list.name}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-lg p-2 text-muted hover:bg-soft hover:text-default"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-muted">
                                {t("lists.share.description", {
                                    defaultValue: "Selecione os membros da família que podem acessar esta lista e defina suas permissões."
                                })}
                            </p>
                        </div>

                        <div className="max-h-[60vh] space-y-3 overflow-y-auto">
                            {availableMembers.length === 0 ? (
                                <div className="py-8 text-center">
                                    <Users className="mx-auto mb-3 h-12 w-12 text-muted/50" />
                                    <p className="text-sm text-muted">
                                        {t("lists.share.noMembers", {
                                            defaultValue: "Não há outros membros na família"
                                        })}
                                    </p>
                                </div>
                            ) : (
                                availableMembers.map((member) => {
                                    const isSelected = localPermissions.has(member.userId);
                                    const permissions = localPermissions.get(member.userId);

                                    return (
                                        <Card
                                            key={member.userId}
                                            padding="md"
                                            className={`transition-all ${isSelected ? "ring-2 ring-brand" : ""
                                                }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <button
                                                    onClick={() => toggleMember(member.userId)}
                                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${isSelected
                                                            ? "border-brand bg-brand text-white"
                                                            : "border-soft bg-surface text-muted hover:border-brand/50"
                                                        }`}
                                                >
                                                    {isSelected ? <Check className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                                                </button>

                                                <div className="flex-1">
                                                    <div className="mb-2 flex items-center gap-3">
                                                        <Avatar
                                                            src={member.userDetails?.photoURL}
                                                            alt={member.userDetails?.displayName || member.userDetails?.email}
                                                            size="sm"
                                                        />
                                                        <div>
                                                            <p className="font-medium text-default">
                                                                {member.userDetails?.displayName || "Membro"}
                                                            </p>
                                                            <p className="text-xs text-muted">
                                                                {member.userDetails?.email}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {isSelected && permissions && (
                                                        <div className="mt-3 space-y-2 border-t border-soft pt-3">
                                                            <label className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={permissions.canCreateItems}
                                                                    onChange={(e) =>
                                                                        updatePermission(member.userId, "canCreateItems", e.target.checked)
                                                                    }
                                                                    className="h-4 w-4 rounded border-soft text-brand focus:ring-2 focus:ring-brand/20"
                                                                />
                                                                <span className="text-sm text-default">
                                                                    {t("lists.share.canCreate", { defaultValue: "Pode adicionar itens" })}
                                                                </span>
                                                            </label>
                                                            <label className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={permissions.canToggleItems}
                                                                    onChange={(e) =>
                                                                        updatePermission(member.userId, "canToggleItems", e.target.checked)
                                                                    }
                                                                    className="h-4 w-4 rounded border-soft text-brand focus:ring-2 focus:ring-brand/20"
                                                                />
                                                                <span className="text-sm text-default">
                                                                    {t("lists.share.canToggle", { defaultValue: "Pode marcar como comprado" })}
                                                                </span>
                                                            </label>
                                                            <label className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={permissions.canDeleteItems}
                                                                    onChange={(e) =>
                                                                        updatePermission(member.userId, "canDeleteItems", e.target.checked)
                                                                    }
                                                                    className="h-4 w-4 rounded border-soft text-brand focus:ring-2 focus:ring-brand/20"
                                                                />
                                                                <span className="text-sm text-default">
                                                                    {t("lists.share.canDelete", { defaultValue: "Pode remover itens" })}
                                                                </span>
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })
                            )}
                        </div>

                        <div className="mt-6 flex gap-3">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="flex-1"
                                disabled={saving}
                            >
                                {t("common.cancel", { defaultValue: "Cancelar" })}
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="flex-1"
                                disabled={saving || availableMembers.length === 0}
                            >
                                {saving
                                    ? t("common.saving", { defaultValue: "Salvando..." })
                                    : t("common.save", { defaultValue: "Salvar" })}
                            </Button>
                        </div>
                    </Card>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
