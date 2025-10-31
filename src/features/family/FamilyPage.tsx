import { useState, useMemo, useEffect } from "react";
import { motion, type Variants } from "framer-motion";
import { Users, UserPlus, UserMinus, Crown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { StatusPill } from "../../components/feedback/StatusPill";
import { useAuth } from "../auth/useAuth";
import { useFamily } from "../../hooks/useFamily";
import { removeFamilyMember } from "../../services/familyService";
import { usePermissions } from "../../hooks/usePermissions";
import { getUserById } from "../../services/userService";
import type { DomainUserProps } from "../../domain/models";

const container: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { delayChildren: 0.1, staggerChildren: 0.08 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export function FamilyPage() {
  const { domainUser } = useAuth();
  const { t } = useTranslation();
  const [removing, setRemoving] = useState<string | null>(null);
  const [memberDetails, setMemberDetails] = useState<Map<string, DomainUserProps>>(new Map());

  const primaryFamilyId = domainUser?.props.primaryFamilyId ?? null;
  const { family, loading } = useFamily(primaryFamilyId);
  const { canInviteMember } = usePermissions();

  const canManage = domainUser?.isTitular || domainUser?.isMaster;

  const members = useMemo(() => {
    if (!family) return [];
    return Object.entries(family.members).map(([id, member]) => ({
      id,
      ...member,
    }));
  }, [family]);

  const activeMembers = useMemo(
    () => members.filter((m) => m.status === "active"),
    [members]
  );

  const titular = useMemo(
    () => activeMembers.find((m) => m.role === "owner" || m.role === "titular"),
    [activeMembers]
  );

  const otherMembers = useMemo(
    () => activeMembers.filter((m) => m.role !== "owner" && m.role !== "titular"),
    [activeMembers]
  );

  // Buscar detalhes dos membros
  useEffect(() => {
    if (!family) return;

    const fetchMemberDetails = async () => {
      const details = new Map<string, DomainUserProps>();

      for (const member of members) {
        if (member.id) {
          try {
            const userData = await getUserById(member.id);
            if (userData) {
              details.set(member.id, userData);
            }
          } catch (error) {
            console.error(`Erro ao buscar usuário ${member.id}:`, error);
          }
        }
      }

      setMemberDetails(details);
    };

    fetchMemberDetails();
  }, [family, members]);

  const handleRemoveMember = async (userId: string) => {
    if (!primaryFamilyId || !canManage) return;
    if (
      !confirm(
        t("family.confirmRemove", {
          defaultValue: "Tem certeza que deseja remover este membro?",
        })
      )
    )
      return;

    setRemoving(userId);
    try {
      await removeFamilyMember(primaryFamilyId, userId);
    } catch (error) {
      console.error("Erro ao remover membro:", error);
      alert(
        t("family.removeError", { defaultValue: "Erro ao remover membro" })
      );
    } finally {
      setRemoving(null);
    }
  };

  const handleInviteMember = () => {
    alert(t("family.inviteNotImplemented", { defaultValue: "Em breve!" }));
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Users className="mx-auto mb-4 size-12 animate-pulse text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("family.loading", { defaultValue: "Carregando..." })}
          </p>
        </div>
      </div>
    );
  }

  if (!family) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Users className="mx-auto mb-4 size-12 text-gray-400" />
          <h2 className="mb-2 text-xl font-semibold">
            {t("family.noFamily", { defaultValue: "Nenhuma família encontrada" })}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("family.createOne", { defaultValue: "Crie uma para começar" })}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="space-y-6 p-6"
    >
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {t("family.title", { defaultValue: "Família" })}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {t("family.subtitle", {
              defaultValue: "Gerencie os membros da sua família",
            })}
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => {
              const check = canInviteMember();
              if (!check.allowed) {
                alert(check.reason || t("family.limitReached"));
                return;
              }
              handleInviteMember();
            }}
            icon={<UserPlus className="size-4" />}
          >
            {t("family.inviteMember", { defaultValue: "Convidar Membro" })}
          </Button>
        )}
      </motion.div>

      <motion.div variants={item}>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-linear-to-br from-green-500 to-emerald-600 p-3">
              <Users className="size-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("family.totalMembers")}
              </p>
              <p className="text-2xl font-bold">{activeMembers.length}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Titular */}
      {titular && (
        <motion.div variants={item} className="space-y-3">
          <h2 className="text-lg font-semibold">
            {t("family.titular", { defaultValue: "Titular" })}
          </h2>
          <Card className="border-2 border-yellow-500/20 bg-linear-to-br from-yellow-50 to-amber-50 p-4 dark:from-yellow-950/20 dark:to-amber-950/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar name={memberDetails.get(titular.id)?.displayName || memberDetails.get(titular.id)?.email || titular.id || "User"} />
                  <div className="absolute -right-1 -top-1 rounded-full bg-yellow-500 p-1">
                    <Crown className="size-3 text-white" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">
                      {memberDetails.get(titular.id)?.displayName || memberDetails.get(titular.id)?.email || titular.id?.slice(0, 8) || "Unknown"}
                      {titular.id === domainUser?.id && (
                        <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
                          ({t("family.you", { defaultValue: "você" })})
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {memberDetails.get(titular.id)?.email || "Titular da família"}
                  </p>
                </div>
              </div>

              <StatusPill tone="success">
                <Crown className="mr-1 size-3" />
                {t("family.titular", { defaultValue: "Titular" })}
              </StatusPill>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Outros Membros */}
      {otherMembers.length > 0 && (
        <motion.div variants={item} className="space-y-3">
          <h2 className="text-lg font-semibold">
            {t("family.otherMembers", { defaultValue: "Outros Membros" })} ({otherMembers.length})
          </h2>
          <div className="space-y-2">
            {otherMembers.map((member) => {
              const isCurrentUser = member.id === domainUser?.id;
              const userDetails = memberDetails.get(member.id);

              return (
                <Card key={member.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={userDetails?.displayName || userDetails?.email || member.id || "User"} />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {userDetails?.displayName || userDetails?.email || member.id?.slice(0, 8) || "Unknown"}
                            {isCurrentUser && (
                              <span className="ml-2 text-sm text-gray-500">
                                ({t("family.you", { defaultValue: "você" })})
                              </span>
                            )}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {userDetails?.email || "Membro"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusPill tone="info">
                        {t("family.member", { defaultValue: "Membro" })}
                      </StatusPill>

                      {canManage && !isCurrentUser && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                          disabled={removing === member.id}
                        >
                          <UserMinus className="size-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
