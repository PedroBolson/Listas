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

  const primaryFamilyId = domainUser?.props.primaryFamilyId ?? null;
  const { family } = useFamily(primaryFamilyId);
  const { lists } = useFamilyLists(primaryFamilyId);

  const listIds = useMemo(() => lists.map(list => list.id), [lists]);
  const maxItemsInAnyList = useMaxListItemsCount(primaryFamilyId, listIds);

  const plan = useMemo(
    () => getPlan(domainUser?.billing?.planId ?? null),
    [domainUser?.billing?.planId, getPlan],
  );

  const activeMembers = useMemo(() => {
    if (!family) return 0;
    return Object.values(family.members).filter((m) => m.status === "active").length;
  }, [family]);

  const stats = useMemo(() => {
    const listsCount = lists.length;
    const membersCount = activeMembers;

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
  }, [lists.length, activeMembers, maxItemsInAnyList, plan, t]);

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
            {t("dashboard.title", { defaultValue: "Dashboard" })}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {t("dashboard.subtitle", {
              defaultValue: "Bem-vindo de volta, {{name}}",
              name: domainUser?.displayName || "Usuário"
            })}
          </p>
        </div>
        {plan && (
          <StatusPill tone="info" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {plan.translationKey
              ? t(`plans.${plan.translationKey}.name`, { defaultValue: plan.name || "Plano" })
              : plan.name || t("plans.currentPlan", { defaultValue: "Plano atual" })
            }
          </StatusPill>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const progress = stat.max > 0 ? (stat.value / stat.max) * 100 : 0;
          const isUnlimited = !Number.isFinite(stat.max);

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
                  {!isUnlimited && <span className="text-lg text-muted">/{stat.max}</span>}
                </p>
                <p className="mt-1 text-sm font-medium text-secondary">{stat.label}</p>
              </div>
              {!isUnlimited && (
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
              {t("dashboard.recentLists", { defaultValue: "Listas Recentes" })}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {t("dashboard.recentListsHint", { defaultValue: "Suas listas mais recentes" })}
            </p>
          </div>
          <Link to="/lists">
            <Button variant="ghost" className="gap-2">
              {t("actions.viewAll", { defaultValue: "Ver todas" })}
              <ArrowRight className="h-4 w-4" />
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
                      <p className="text-xs text-muted">
                        {list.description || t("lists.noDescription", { defaultValue: "Sem descrição" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted">
                      {list.collaborators?.length || 0} {t("common.members", { defaultValue: "membros" })}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted" />
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
