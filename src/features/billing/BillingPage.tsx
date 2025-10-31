import { useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { CreditCard, Users, ClipboardList, Package, ArrowUpRight, Sparkles, Infinity as InfinityIcon, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { StatusPill } from "../../components/feedback/StatusPill";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { useAuth } from "../auth/useAuth";
import { usePlans } from "../../providers/usePlans";
import { useFamily } from "../../hooks/useFamily";
import { useFamilyLists } from "../../hooks/useLists";

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

const isUnlimited = (value: number) => !Number.isFinite(value);

export function BillingPage() {
  const { domainUser } = useAuth();
  const { t } = useTranslation();
  const { plans, getPlan } = usePlans();

  const primaryFamilyId = domainUser?.props.primaryFamilyId ?? null;
  const { family } = useFamily(primaryFamilyId);
  const { lists } = useFamilyLists(primaryFamilyId);

  const billing = domainUser?.billing;
  const currentPlan = useMemo(
    () => getPlan(billing?.planId ?? null) ?? null,
    [billing?.planId, getPlan]
  );

  const otherPlans = useMemo(() => {
    if (!plans.length) return [];
    return plans.filter((plan) => plan.id !== billing?.planId && plan.tier !== "master");
  }, [plans, billing?.planId]);

  const activeMembers = useMemo(() => {
    if (!family) return 0;
    return Object.values(family.members).filter((m) => m.status === "active").length;
  }, [family]);

  const usage = useMemo(() => {
    if (!currentPlan) return [];

    return [
      {
        icon: ClipboardList,
        label: t("billing.listsUsage", { defaultValue: "Listas" }),
        current: lists.length,
        max: currentPlan.limits.listsPerFamily,
      },
      {
        icon: Users,
        label: t("billing.membersUsage", { defaultValue: "Membros" }),
        current: activeMembers,
        max: currentPlan.limits.familyMembers,
      },
    ];
  }, [currentPlan, lists.length, activeMembers, t]);

  if (!billing || !currentPlan) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Package className="mx-auto mb-4 size-12 text-gray-400" />
          <h2 className="mb-2 text-xl font-semibold">
            {t("billing.noPlan", { defaultValue: "Nenhum plano ativo" })}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("billing.selectPlan", { defaultValue: "Selecione um plano para começar" })}
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
            {t("billing.title", { defaultValue: "Plano e Cobrança" })}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {t("billing.subtitle", { defaultValue: "Gerencie sua assinatura e uso" })}
          </p>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <Card className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-linear-to-br from-blue-500 to-purple-600 p-3">
              <CreditCard className="size-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">
                  {t(`${currentPlan.translationKey}.name`, { defaultValue: currentPlan.name || currentPlan.tier })}
                </h2>
                <StatusPill
                  tone={billing.status === "active" ? "success" : "warning"}
                >
                  {t(`billing.status.${billing.status}`, {
                    defaultValue: billing.status,
                  })}
                </StatusPill>
              </div>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {t(`${currentPlan.translationKey}.description`, { defaultValue: currentPlan.description || '' })}
              </p>
              {currentPlan.props.monthlyPrice > 0 && (
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">
                    R$ {currentPlan.props.monthlyPrice}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    / {t("billing.month", { defaultValue: "mês" })}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {usage.map((stat) => {
              const Icon = stat.icon;
              const percent = isUnlimited(stat.max)
                ? 0
                : Math.round((stat.current / stat.max) * 100);

              return (
                <div key={stat.label}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-gray-500" />
                      <span className="text-sm font-medium">{stat.label}</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.current} /{" "}
                      {isUnlimited(stat.max) ? (
                        <span className="inline-flex items-center gap-1">
                          <InfinityIcon className="size-4" />
                        </span>
                      ) : (
                        stat.max
                      )}
                    </span>
                  </div>
                  {!isUnlimited(stat.max) && <ProgressBar value={percent} />}
                </div>
              );
            })}

            {/* Info de itens por lista (sem contador) */}
            <div className="mt-4 rounded-xl border border-soft bg-surface-alt p-4">
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Package className="size-4 text-gray-500" />
                  <span className="text-sm font-medium">
                    {t("billing.itemsPerList", { defaultValue: "Itens por lista" })}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 sm:text-right">
                  {isUnlimited(currentPlan.limits.itemsPerList) ? (
                    <span className="inline-flex items-center gap-1">
                      <InfinityIcon className="size-4" /> {t("billing.unlimitedItems", { defaultValue: "Itens ilimitados por lista" })}
                    </span>
                  ) : (
                    t("billing.itemsPerListInfo", { 
                      defaultValue: "Até {{count}} itens por lista",
                      count: currentPlan.limits.itemsPerList
                    })
                  )}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {otherPlans.length > 0 && (
        <motion.div variants={item}>
          <h2 className="mb-4 text-lg font-semibold">
            {t("billing.otherPlans", { defaultValue: "Outros Planos" })}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherPlans.map((plan) => {
              const isUpgrade =
                plan.props.monthlyPrice > (currentPlan.props.monthlyPrice || 0) ||
                plan.tier === "master";

              return (
                <Card key={plan.id} className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {t(`${plan.translationKey}.name`, { defaultValue: plan.name || plan.tier })}
                      </h3>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                        {t(`${plan.translationKey}.description`, { defaultValue: plan.description || '' })}
                      </p>
                    </div>
                    {plan.tier === "premium" && (
                      <Sparkles className="size-5 text-yellow-500" />
                    )}
                  </div>

                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-2xl font-bold">
                      {plan.props.monthlyPrice === 0
                        ? t("billing.free", { defaultValue: "Grátis" })
                        : `R$ ${plan.props.monthlyPrice}`}
                    </span>
                    {plan.props.monthlyPrice > 0 && (
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        /{t("billing.month", { defaultValue: "mês" })}
                      </span>
                    )}
                  </div>

                  <ul className="mt-4 space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-green-500" />
                      <span>
                        {isUnlimited(plan.limits.listsPerFamily) ? (
                          <span className="inline-flex items-center gap-1">
                            <InfinityIcon className="size-3" /> {t("billing.lists")}
                          </span>
                        ) : (
                          `${plan.limits.listsPerFamily} ${t("billing.lists")}`
                        )}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-green-500" />
                      <span>
                        {isUnlimited(plan.limits.familyMembers) ? (
                          <span className="inline-flex items-center gap-1">
                            <InfinityIcon className="size-3" /> {t("billing.members")}
                          </span>
                        ) : (
                          `${plan.limits.familyMembers} ${t("billing.members")}`
                        )}
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="size-4 text-green-500" />
                      <span>
                        {isUnlimited(plan.limits.itemsPerList) ? (
                          <span className="inline-flex items-center gap-1">
                            <InfinityIcon className="size-3" /> {t("billing.items")}
                          </span>
                        ) : (
                          `${plan.limits.itemsPerList} ${t("billing.items")}`
                        )}
                      </span>
                    </li>
                  </ul>

                  <Button
                    className="mt-4 w-full"
                    variant={isUpgrade ? "primary" : "outline"}
                    size="sm"
                    trailingIcon={isUpgrade ? <ArrowUpRight className="size-4" /> : undefined}
                  >
                    {isUpgrade
                      ? t("billing.upgrade", { defaultValue: "Upgrade" })
                      : t("billing.downgrade", { defaultValue: "Downgrade" })
                    }
                  </Button>
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
