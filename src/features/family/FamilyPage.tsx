import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import { Users, UserPlus, UserMinus, Crown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Avatar";
import { StatusPill } from "../../components/feedback/StatusPill";
import { InviteMemberModal } from "../../components/invites/InviteMemberModal";
import { JoinFamilyModal } from "../../components/invites/JoinFamilyModal";
import { useAuth } from "../auth/useAuth";
import { useFamily } from "../../hooks/useFamily";
import { removeFamilyMember } from "../../services/familyService";
import { usePermissions } from "../../hooks/usePermissions";
import type { DomainUserProps } from "../../domain/models";
import { memberProfileToDomainUser } from "../../utils/memberProfile";

const container: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { delayChildren: 0.06, staggerChildren: 0.09 },
  },
};

const block: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 380, damping: 30 } },
};

export function FamilyPage() {
  const { domainUser } = useAuth();
  const { t } = useTranslation();
  const shouldReduce = useReducedMotion();

  const [removing, setRemoving] = useState<string | null>(null);
  const [memberDetails, setMemberDetails] = useState<Map<string, DomainUserProps>>(new Map());
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const currentFamilyId = domainUser?.managedFamilyId ?? null;
  const { family, loading } = useFamily(currentFamilyId);
  const { canInviteMember } = usePermissions();

  const canManage = domainUser?.canManageFamilyFromRecord(family) ?? false;

  const availableSlots = useMemo(() => {
    if (!domainUser?.billing?.seats) return 0;
    const total = domainUser.billing.seats?.total ?? 0;
    const used = domainUser.billing.seats?.used ?? 0;
    return Math.max(0, total - used);
  }, [domainUser]);

  const members = useMemo(() => {
    if (!family) return [];
    return Object.entries(family.members).map(([id, member]) => ({ id, ...member }));
  }, [family]);

  const activeMembers = useMemo(() => members.filter((m) => m.status === "active"), [members]);
  const titular = useMemo(() => activeMembers.find((m) => m.role === "owner" || m.role === "titular"), [activeMembers]);
  const otherMembers = useMemo(() => activeMembers.filter((m) => m.role !== "owner" && m.role !== "titular"), [activeMembers]);

  useEffect(() => {
    if (!family) return;
    const details = new Map<string, DomainUserProps>();
    for (const member of members) {
      if (member.id) details.set(member.id, memberProfileToDomainUser(member.id, member));
    }
    setMemberDetails(details);
  }, [family, members]);

  const handleRemoveMember = async (userId: string) => {
    if (!currentFamilyId || !canManage) return;
    if (!confirm(t("family.confirmRemove", { defaultValue: "Tem certeza que deseja remover este membro?" }))) return;

    setRemoving(userId);
    try {
      await removeFamilyMember(currentFamilyId, userId);
    } catch (error) {
      console.error("Erro ao remover membro:", error);
      alert(t("family.removeError", { defaultValue: "Erro ao remover membro" }));
    } finally {
      setRemoving(null);
    }
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-32 animate-pulse rounded-lg bg-surface-alt" />
            <div className="h-4 w-52 animate-pulse rounded bg-surface-alt" />
          </div>
          <div className="h-9 w-36 animate-pulse rounded-xl bg-surface-alt" />
        </div>
        {/* Stat card skeleton */}
        <div className="h-20 animate-pulse rounded-2xl bg-surface-alt" />
        {/* Member skeletons */}
        <div className="space-y-3">
          <div className="h-5 w-20 animate-pulse rounded bg-surface-alt" />
          <div className="h-24 animate-pulse rounded-2xl bg-surface-alt" />
        </div>
        <div className="space-y-2">
          <div className="h-5 w-28 animate-pulse rounded bg-surface-alt" />
          {[1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface-alt" />
          ))}
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
          <Users className="mx-auto mb-4 size-12 text-muted" />
          <h2 className="mb-2 text-xl font-semibold text-primary">
            {t("family.noFamily", { defaultValue: "Nenhuma família encontrada" })}
          </h2>
          <p className="text-sm text-muted">
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
      className="space-y-6 p-4 sm:p-6"
    >
      {/* ── Header ── */}
      <motion.div variants={block} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            {t("family.title", { defaultValue: "Família" })}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t("family.subtitle", { defaultValue: "Gerencie os membros da sua família" })}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          {canManage && (
            <Button
              onClick={() => {
                const check = canInviteMember();
                if (!check.allowed) { alert(check.reason || t("family.limitReached")); return; }
                setShowInviteModal(true);
              }}
              icon={<UserPlus className="size-4" />}
              className="whitespace-nowrap"
            >
              {t("family.inviteMember", { defaultValue: "Convidar Membro" })}
            </Button>
          )}
          <Button
            onClick={() => setShowJoinModal(true)}
            variant="outline"
            icon={<UserPlus className="size-4" />}
            className="whitespace-nowrap"
          >
            {t("invites.joinFamily", { defaultValue: "Participar de outra família" })}
          </Button>
        </div>
      </motion.div>

      {/* ── Active members stat card ── */}
      <motion.div variants={block}>
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted">{t("family.totalMembers")}</p>
              <p className="text-2xl font-bold text-primary">{activeMembers.length}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ── Titular ── */}
      {titular && (
        <motion.div variants={block} className="space-y-3">
          <h2 className="text-base font-semibold text-primary">
            {t("family.titular", { defaultValue: "Titular" })}
          </h2>
          <Card className="border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar name={memberDetails.get(titular.id)?.displayName || memberDetails.get(titular.id)?.email || titular.id || "User"} />
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 shadow-sm">
                    <Crown className="size-3 text-white" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-primary">
                    {memberDetails.get(titular.id)?.displayName || memberDetails.get(titular.id)?.email || titular.id?.slice(0, 8) || "Unknown"}
                    {titular.id === domainUser?.id && (
                      <span className="ml-2 text-sm font-normal text-muted">
                        ({t("family.you", { defaultValue: "você" })})
                      </span>
                    )}
                  </p>
                  <p className="truncate text-sm text-muted">
                    {memberDetails.get(titular.id)?.email || "Titular da família"}
                  </p>
                </div>
              </div>
              <StatusPill tone="success" className="shrink-0">
                <Crown className="mr-1 size-3" />
                {t("family.titular", { defaultValue: "Titular" })}
              </StatusPill>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── Other members ── */}
      {otherMembers.length > 0 && (
        <motion.div variants={block} className="space-y-3">
          <h2 className="text-base font-semibold text-primary">
            {t("family.otherMembers", { defaultValue: "Outros Membros" })}{" "}
            <span className="font-normal text-muted">({otherMembers.length})</span>
          </h2>
          <div className="space-y-2">
            <AnimatePresence>
              {otherMembers.map((member, idx) => {
                const isCurrentUser = member.id === domainUser?.id;
                const userDetails = memberDetails.get(member.id);

                return (
                  <motion.div
                    key={member.id}
                    initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={shouldReduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                    transition={{ delay: idx * 0.05, type: "spring", stiffness: 400, damping: 32 }}
                    whileHover={shouldReduce ? {} : { y: -2 }}
                  >
                    <Card className="p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar name={userDetails?.displayName || userDetails?.email || member.id || "User"} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-primary">
                              {userDetails?.displayName || userDetails?.email || member.id?.slice(0, 8) || "Unknown"}
                              {isCurrentUser && (
                                <span className="ml-2 text-sm font-normal text-muted">
                                  ({t("family.you", { defaultValue: "você" })})
                                </span>
                              )}
                            </p>
                            <p className="truncate text-sm text-muted">
                              {userDetails?.email || "Membro"}
                            </p>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <StatusPill tone="info">
                            {t("family.member", { defaultValue: "Membro" })}
                          </StatusPill>

                          {canManage && !isCurrentUser && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleRemoveMember(member.id)}
                              disabled={removing === member.id}
                            >
                              <UserMinus className="size-4 text-danger" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* ── Modals ── */}
      {canManage && domainUser && family && (
        <InviteMemberModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          familyId={family.id}
          userId={domainUser.id}
          familyName={family.name}
          availableSlots={availableSlots}
        />
      )}

      {domainUser && (
        <JoinFamilyModal
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          userId={domainUser.id}
          onSuccess={() => {}}
        />
      )}
    </motion.div>
  );
}
