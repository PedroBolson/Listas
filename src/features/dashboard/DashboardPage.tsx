import { useMemo, useEffect } from "react";
import { motion, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { ClipboardList, Users, Package, ArrowRight, Sparkles, ShoppingCart } from "lucide-react";
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

// ─── Per-metric color palette ──────────────────────────────────────────────────

const STAT_COLORS = [
  { bg: "bg-brand/10", icon: "text-brand", value: "text-brand" },
  { bg: "bg-purple-500/10", icon: "text-purple-500", value: "text-purple-600 dark:text-purple-400" },
  { bg: "bg-amber-500/10", icon: "text-amber-600 dark:text-amber-400", value: "text-amber-600 dark:text-amber-400" },
];

// ─── Animated counter ──────────────────────────────────────────────────────────

function AnimatedNumber({ value, reduced }: { value: number; reduced: boolean | null }) {
  const spring = useSpring(reduced ? value : 0, { stiffness: 100, damping: 20, mass: 0.6 });
  const rounded = useTransform(spring, Math.round);

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  if (reduced) return <span>{value}</span>;
  return <motion.span>{rounded}</motion.span>;
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { domainUser } = useAuth();
  const { t } = useTranslation();
  const { getPlan } = usePlans();
  const shouldReduce = useReducedMotion();

  const familyId = domainUser?.managedFamilyId ?? null;
  const { family } = useFamily(familyId);
  const { lists } = useFamilyLists(familyId);

  const listIds = useMemo(() => lists.map((l) => l.id), [lists]);
  const maxItemsInAnyList = useMaxListItemsCount(familyId, listIds);

  const plan = useMemo(
    () => getPlan(domainUser?.billing?.planId ?? null),
    [domainUser?.billing?.planId, getPlan],
  );

  const activeMembers = useMemo(() => {
    if (!family) return 0;
    return Object.values(family.members).filter((m) => m.status === "active").length;
  }, [family]);

  const isViewerOfCurrentFamily = useMemo(() => {
    if (!family || !domainUser) return false;
    if (family.ownerId === domainUser.id) return false;
    const memberData = family.members[domainUser.id];
    return memberData?.role === "viewer";
  }, [family, domainUser]);

  const stats = useMemo(() => {
    const listsCount = lists.length;
    const membersCount = activeMembers;

    if (isViewerOfCurrentFamily) {
      return [
        {
          icon: ClipboardList,
          label: t("dashboard.stats.sharedLists", { defaultValue: "Listas Compartilhadas" }),
          value: listsCount,
          description: t("dashboard.stats.sharedListsDescription", { defaultValue: "Acessíveis para você" }),
        },
        {
          icon: Package,
          label: t("dashboard.stats.totalItems", { defaultValue: "Total de Itens" }),
          value: maxItemsInAnyList,
          description: t("dashboard.stats.totalItemsDescription", { defaultValue: "Em todas as listas" }),
        },
        {
          icon: Users,
          label: t("dashboard.stats.familyMembers", { defaultValue: "Membros" }),
          value: membersCount,
          description: t("dashboard.stats.familyMembersDescription", { defaultValue: "Na família" }),
        },
      ];
    }

    return [
      {
        icon: ClipboardList,
        label: t("dashboard.stats.lists", { defaultValue: "Listas" }),
        value: listsCount,
        max: plan?.limits.listsPerFamily ?? 0,
        description: t("dashboard.stats.listsDescription", {
          defaultValue: "{{count}} ativas",
          count: listsCount,
        }),
      },
      {
        icon: Users,
        label: t("dashboard.stats.members", { defaultValue: "Membros" }),
        value: membersCount,
        max: plan?.limits.familyMembers ?? 0,
        description: t("dashboard.stats.membersDescription", { defaultValue: "Acesso da família" }),
      },
      {
        icon: Package,
        label: t("dashboard.stats.items", { defaultValue: "Itens" }),
        value: maxItemsInAnyList,
        max: plan?.limits.itemsPerList ?? 0,
        description:
          maxItemsInAnyList > 0
            ? t("dashboard.stats.itemsDescriptionWithCount", {
                defaultValue: "Maior lista: {{count}}",
                count: maxItemsInAnyList,
              })
            : t("dashboard.stats.itemsDescription", { defaultValue: "Nenhum item ainda" }),
      },
    ];
  }, [lists.length, activeMembers, maxItemsInAnyList, plan, t, isViewerOfCurrentFamily]);

  const firstName =
    domainUser?.displayName?.split(" ")[0] ||
    domainUser?.email?.split("@")[0] ||
    "você";

  const planName = plan?.translationKey
    ? t(`plans.${plan.translationKey}.name`, { defaultValue: plan.name || "Plano" })
    : plan?.name || t("plans.currentPlan", { defaultValue: "Plano atual" });

  // Framer: use delay-based approach for reliable entrance animations
  const blockTransition = (delay: number) => ({
    initial: shouldReduce ? { opacity: 0 } : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: {
      delay,
      type: "spring" as const,
      stiffness: 400,
      damping: 32,
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">

      {/* ── Header ── */}
      <motion.div
        className="flex items-center justify-between gap-4"
        {...blockTransition(0.04)}
      >
        <div>
          <h1 className="text-2xl font-bold text-primary sm:text-3xl">
            {isViewerOfCurrentFamily
              ? t("dashboard.memberTitle", { defaultValue: "Minhas Listas" })
              : `${t("dashboard.greeting", { defaultValue: "Olá" })}, ${firstName} 👋`}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {family?.name ?? domainUser?.email ?? "—"}
          </p>
        </div>

        {plan && !isViewerOfCurrentFamily && (
          <StatusPill tone="info" className="flex shrink-0 items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            {planName}
          </StatusPill>
        )}
      </motion.div>

      {/* ── Upgrade CTA ── */}
      {domainUser?.isFamilyMemberOnly && (
        <motion.div {...blockTransition(0.1)}>
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
                    defaultValue:
                      "Torne-se titular e tenha acesso ilimitado para criar listas, convidar membros e gerenciar sua própria família.",
                  })}
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                className="shrink-0"
                onClick={() => (window.location.href = "/upgrade")}
              >
                {t("dashboard.upgradeCta.button", { defaultValue: "Virar Titular" })}
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          const hasMmax = "max" in stat;
          // Treat very large limits (≥ 999_999) as unlimited
          const isUnlimited =
            !hasMmax ||
            !stat.max ||
            !Number.isFinite(stat.max) ||
            stat.max >= 999_999;
          const progress =
            !isUnlimited && hasMmax && stat.max
              ? Math.min((stat.value / stat.max) * 100, 100)
              : 0;
          const colors = STAT_COLORS[idx % STAT_COLORS.length];

          return (
            <motion.div
              key={stat.label}
              className="h-full"
              {...blockTransition(0.08 + idx * 0.08)}
              whileHover={shouldReduce ? {} : { y: -6 }}
            >
              <Card padding="lg" elevated className="h-full">
                {/* Icon row */}
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${colors.bg} ${colors.icon}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="max-w-[110px] text-right text-xs leading-tight text-muted">
                    {stat.description}
                  </p>
                </div>

                {/* Value */}
                <div className="mt-5">
                  <p className={`text-4xl font-bold tabular-nums ${colors.value}`}>
                    <AnimatedNumber value={stat.value} reduced={shouldReduce} />
                    {!isUnlimited && hasMmax && stat.max && (
                      <span className="ml-1 text-xl font-normal text-muted">
                        /{stat.max}
                      </span>
                    )}
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-secondary">{stat.label}</p>
                </div>

                {!isUnlimited && hasMmax && (
                  <ProgressBar value={progress} className="mt-5" />
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ── Recent Lists ── */}
      <motion.div {...blockTransition(0.32)}>
        <Card padding="lg" elevated>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary">
                {isViewerOfCurrentFamily
                  ? t("dashboard.sharedLists", { defaultValue: "Listas Compartilhadas" })
                  : t("dashboard.recentLists", { defaultValue: "Listas Recentes" })}
              </h2>
              <p className="mt-0.5 text-sm text-muted">
                {isViewerOfCurrentFamily
                  ? t("dashboard.sharedListsHint", { defaultValue: "Compartilhadas com você" })
                  : t("dashboard.recentListsHint", { defaultValue: "Suas listas mais recentes" })}
              </p>
            </div>
            <Link to="/lists">
              <Button
                variant="ghost"
                size="sm"
                trailingIcon={<ArrowRight className="h-4 w-4" />}
              >
                {t("actions.viewAll", { defaultValue: "Ver tudo" })}
              </Button>
            </Link>
          </div>

          <div className="mt-5 space-y-2">
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
              lists.slice(0, 5).map((list, idx) => {
                const isShopping = list.type === "shopping";
                const ListIcon = isShopping ? ShoppingCart : ClipboardList;
                const iconClass = isShopping
                  ? "bg-purple-500/10 text-purple-500"
                  : "bg-blue-500/10 text-blue-500";

                return (
                  <motion.div
                    key={list.id}
                    initial={shouldReduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.36 + idx * 0.055,
                      type: "spring",
                      stiffness: 420,
                      damping: 34,
                    }}
                    whileHover={shouldReduce ? {} : { y: -2 }}
                  >
                    <Link
                      to={`/lists/${list.id}`}
                      className="group flex items-center gap-3 rounded-xl border border-soft bg-surface-alt p-3.5 transition hover:border-brand/30 hover:bg-surface hover:shadow-sm"
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                      >
                        <ListIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-primary">
                          {list.name}
                        </p>
                        {list.description && (
                          <p className="hidden truncate text-xs text-muted sm:block">
                            {list.description}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-1">
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </Link>
                  </motion.div>
                );
              })
            )}
          </div>
        </Card>
      </motion.div>

      {/* ── Master card ── */}
      {domainUser?.isMaster && (
        <motion.div {...blockTransition(0.4)}>
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
                    {t("dashboard.masterHint", { defaultValue: "Privilégios ilimitados" })}
                  </p>
                </div>
              </div>
              <Link to="/master">
                <Button trailingIcon={<ArrowRight className="h-4 w-4" />}>
                  {t("actions.openConsole", { defaultValue: "Abrir console" })}
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
