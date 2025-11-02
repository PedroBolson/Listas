import { useMemo } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Users, Package, ArrowRight, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card } from "../../components/ui/Card";
import { StatusPill } from "../../components/feedback/StatusPill";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../auth/useAuth";
import { usePlans } from "../../providers/usePlans";
import { useFamily } from "../../hooks/useFamily";
import { useFamilyLists, useMaxListItemsCount } from "../../hooks/useLists";

export function DashboardPage() {
  const { domainUser } = useAuth();
  const { t } = useTranslation();
  const { getPlan } = usePlans();

  const familyId = domainUser?.managedFamilyId ?? null;
  const { family } = useFamily(familyId);
  const { lists } = useFamilyLists(familyId);

  const listIds = useMemo(() => lists.map(list => list.id), [lists]);
  const maxItemsInAnyList = useMaxListItemsCount(familyId, listIds);

  const plan = useMemo(
    () => getPlan(domainUser?.billing?.planId ?? null),
    [domainUser?.billing?.planId, getPlan],
  );

  const activeMembers = useMemo(() => {
    if (!family) return 0;
    return Object.values(family.members).filter((m) => m.status === "active").length;
  }, [family]);

  // Verifica se é membro (viewer) da família ATUAL, não globalmente
  const isViewerOfCurrentFamily = useMemo(() => {
    if (!family || !domainUser) return false;
    // Se é owner da família atual, não é viewer
    if (family.ownerId === domainUser.id) return false;
    // Verifica o role na família atual
    const memberData = family.members[domainUser.id];
    const isViewer = memberData?.role === 'viewer';

    console.log('🔍 Dashboard - isViewerOfCurrentFamily:', {
      familyId: family.id,
      familyOwnerId: family.ownerId,
      userId: domainUser.id,
      memberRole: memberData?.role,
      isViewer
    });

    return isViewer;
  }, [family, domainUser]);

  const stats = useMemo(() => {
    const listsCount = lists.length;
    const membersCount = activeMembers;

    if (isViewerOfCurrentFamily) {
      // Stats for family members
      return [
        {
          icon: ClipboardList,
          label: t("dashboard.stats.sharedLists", { defaultValue: "Listas Compartilhadas" }),
          value: listsCount,
          description: t("dashboard.stats.sharedListsDescription", { defaultValue: "Listas que você pode acessar" }),
        },
        {
          icon: Package,
          label: t("dashboard.stats.totalItems", { defaultValue: "Total de Itens" }),
          value: maxItemsInAnyList,
          description: t("dashboard.stats.totalItemsDescription", { defaultValue: "Em todas as suas listas" }),
        },
        {
          icon: Users,
          label: t("dashboard.stats.familyMembers", { defaultValue: "Membros da Família" }),
          value: membersCount,
          description: t("dashboard.stats.familyMembersDescription", { defaultValue: "Pessoas na família" }),
        },
      ];
    }

    // Stats for titular/master users
    return [
      {
        icon: ClipboardList,
        label: t("dashboard.stats.lists", { defaultValue: "Listas" }),
        value: listsCount,
        max: plan?.limits.listsPerFamily ?? 0,
        description: t("dashboard.stats.listsDescription", { defaultValue: "{{count}} famílias ativas", count: listsCount }),
      },
      {
        icon: Users,
        label: t("dashboard.stats.members", { defaultValue: "Membros" }),
        value: membersCount,
        max: plan?.limits.familyMembers ?? 0,
        description: t("dashboard.stats.membersDescription", { defaultValue: "Controle de acesso para convidados" }),
      },
      {
        icon: Package,
        label: t("dashboard.stats.items", { defaultValue: "Itens" }),
        value: maxItemsInAnyList,
        max: plan?.limits.itemsPerList ?? 0,
        description: maxItemsInAnyList > 0
          ? t("dashboard.stats.itemsDescriptionWithCount", { defaultValue: "Maior lista: {{count}} itens", count: maxItemsInAnyList })
          : t("dashboard.stats.itemsDescription", { defaultValue: "Nenhum item cadastrado" }),
      },
    ];
  }, [lists.length, activeMembers, maxItemsInAnyList, plan, t, isViewerOfCurrentFamily]);

  return (
    <motion.div
      className="mx-auto max-w-6xl space-y-6 p-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ staggerChildren: 0.08, delayChildren: 0.1 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">
            {isViewerOfCurrentFamily
              ? t("dashboard.memberTitle", { defaultValue: "Minhas Listas" })
              : t("dashboard.title", { defaultValue: "Dashboard" })
            }
          </h1>
          <p className="mt-1 text-sm text-muted">
            {isViewerOfCurrentFamily
              ? t("dashboard.memberSubtitle", {
                defaultValue: "{{familyName}}",
                familyName: family?.name || "Família"
              })
              : t("dashboard.subtitle", {
                defaultValue: "Bem-vindo de volta, {{name}}",
                name: domainUser?.displayName || "Usuário"
              })
            }
          </p>
        </div>
        {plan && !isViewerOfCurrentFamily && (
          <StatusPill tone="info" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {plan.translationKey
              ? t(`plans.${plan.translationKey}.name`, { defaultValue: plan.name || "Plano" })
              : plan.name || t("plans.currentPlan", { defaultValue: "Plano atual" })
            }
          </StatusPill>
        )}
      </div>

      {/* Upgrade CTA for members - só mostra se NÃO é titular de nenhuma família */}
      {domainUser?.isFamilyMemberOnly && (
        <Card elevated className="border-2 border-brand bg-linear-to-r from-brand/5 to-purple-500/5">
          <div className="flex flex-col items-start gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand" />
                <h3 className="text-xl font-bold text-primary">
                  {t("dashboard.upgradeCta.title", { defaultValue: "Crie sua própria família!" })}
                </h3>
              </div>
              <p className="text-sm text-secondary">
                {t("dashboard.upgradeCta.description", {
                  defaultValue: "Torne-se titular e tenha acesso ilimitado para criar listas, convidar membros e gerenciar sua própria família."
                })}
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="shrink-0"
              onClick={() => window.location.href = "/upgrade"}
            >
              {t("dashboard.upgradeCta.button", { defaultValue: "Virar Titular" })}
            </Button>
          </div>
        </Card>
      )}

      <div className={`grid gap-4 ${isViewerOfCurrentFamily ? "md:grid-cols-3" : "md:grid-cols-3"}`}>
        {stats.map((stat) => {
          const Icon = stat.icon;
          const hasMmax = 'max' in stat;
          const progress = hasMmax && stat.max && stat.max > 0 ? (stat.value / stat.max) * 100 : 0;
          const isUnlimited = !hasMmax || !stat.max || !Number.isFinite(stat.max);

          return (
            <Card key={stat.label} padding="lg" elevated>
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-xs text-muted">{stat.description}</span>
              </div>
              <div className="mt-4">
                <p className="text-3xl font-bold text-primary">
                  {stat.value}
                  {!isUnlimited && hasMmax && stat.max && <span className="text-lg text-muted">/{stat.max}</span>}
                </p>
                <p className="mt-1 text-sm font-medium text-secondary">{stat.label}</p>
              </div>
              {!isUnlimited && hasMmax && (
                <ProgressBar value={progress} className="mt-4" />
              )}
            </Card>
          );
        })}
      </div>

      <Card padding="lg" elevated>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary">
              {isViewerOfCurrentFamily
                ? t("dashboard.sharedLists", { defaultValue: "Listas Compartilhadas" })
                : t("dashboard.recentLists", { defaultValue: "Listas Recentes" })
              }
            </h2>
            <p className="mt-1 text-sm text-muted">
              {isViewerOfCurrentFamily
                ? t("dashboard.sharedListsHint", { defaultValue: "Listas que foram compartilhadas com você" })
                : t("dashboard.recentListsHint", { defaultValue: "Suas listas mais recentes" })
              }
            </p>
          </div>
          <Link to="/lists">
            <Button variant="ghost" trailingIcon={<ArrowRight className="h-4 w-4" />}>
              {t("actions.viewAll", { defaultValue: "Ver tudo" })}
            </Button>
          </Link>
        </div>

        <div className="mt-6 space-y-3">
          {lists.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-soft bg-surface-alt p-8 text-center">
              <ClipboardList className="mx-auto h-12 w-12 text-muted" />
              <p className="mt-3 text-sm text-muted">
                {t("dashboard.noLists", { defaultValue: "Nenhuma lista criada ainda" })}
              </p>
              <Link to="/lists">
                <Button className="mt-4" size="sm">
                  {t("actions.createList", { defaultValue: "Criar lista" })}
                </Button>
              </Link>
            </div>
          ) : (
            lists.slice(0, 5).map((list) => (
              <Link
                key={list.id}
                to={`/lists/${list.id}`}
                className="block rounded-2xl border border-soft bg-surface-alt p-4 transition hover:border-brand hover:bg-elevated"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-primary">{list.name}</p>
                      {list.description && (
                        <p className="hidden text-xs text-muted sm:block">
                          {list.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted whitespace-nowrap">
                      {list.collaborators?.length || 0} {t("common.members", { defaultValue: "membros" })}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted shrink-0" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </Card>

      {domainUser?.isMaster && (
        <Card padding="lg" elevated className="border-accent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-primary">
                  {t("dashboard.masterAccess", { defaultValue: "Acesso Master" })}
                </h3>
                <p className="text-sm text-muted">
                  {t("dashboard.masterHint", { defaultValue: "Você tem privilégios ilimitados" })}
                </p>
              </div>
            </div>
            <Link to="/master">
              <Button className="gap-2">
                {t("actions.openConsole", { defaultValue: "Abrir console" })}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </motion.div>
  );
}
