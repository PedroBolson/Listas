import { useMemo, useState } from "react";
import { doc, writeBatch } from "firebase/firestore";
import { motion } from "framer-motion";
import { Crown, Loader2, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { db } from "../../lib/firebase";
import { usePlans } from "../../providers/usePlans";
import { useAuth } from "../auth/useAuth";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { StatusPill } from "../../components/feedback/StatusPill";

export function PlanSelectionPage() {
  const { plans, loading, error } = usePlans();
  const { domainUser, refreshProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [savingPlanId, setSavingPlanId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "error" | "success"; message: string } | null>(
    null,
  );

  const selectablePlans = useMemo(
    () => plans.filter((plan) => plan.tier !== "master"),
    [plans],
  );

  const localeCurrency = new Intl.NumberFormat(i18n.language, {
    style: "currency",
    currency: selectablePlans[0]?.props.currency ?? "BRL",
    maximumFractionDigits: 0,
  });

  const handleSelect = async (planId: string) => {
    if (!domainUser) return;
    const plan = plans.find((item) => item.id === planId);
    if (!plan) return;

    setSavingPlanId(planId);
    setFeedback(null);
    try {
      const now = new Date().toISOString();
      const userRef = doc(db, "users", domainUser.id);
      const familyRef = doc(db, "families");

      const batch = writeBatch(db);

      batch.update(userRef, {
        billing: {
          planId: plan.id,
          status: "active",
          seats: {
            total: plan.limits.familyMembers,
            used: 1,
          },
          invites: {
            total: plan.limits.familyMembers,
            used: 1,
          },
          limits: {
            families: plan.limits.families,
            familyMembers: plan.limits.familyMembers,
            listsPerFamily: plan.limits.listsPerFamily,
            itemsPerList: plan.limits.itemsPerList,
            collaboratorsPerList: plan.limits.collaboratorsPerList,
          },
        },
        families: [
          {
            familyId: familyRef.id,
            lists: [],
            invitedBy: domainUser.id,
            joinedAt: now,
          },
        ],
        primaryFamilyId: familyRef.id,
        updatedAt: now,
      });

      batch.set(familyRef, {
        id: familyRef.id,
        name: `${domainUser.displayName ?? "Minha família"}`,
        ownerId: domainUser.id,
        members: {
          [domainUser.id]: {
            userId: domainUser.id,
            role: "owner",
            status: "active",
            joinedAt: now,
          },
        },
        blockedMembers: [],
        createdAt: now,
        updatedAt: now,
        metadata: {
          planId: plan.id,
        },
      });

      await batch.commit();
      await refreshProfile();
      setFeedback({ type: "success", message: t("billing.title") });
      navigate("/", { replace: true });
    } catch (err) {
      console.error(err);
      setFeedback({
        type: "error",
        message: t("plans.selectionError", { defaultValue: "Não foi possível aplicar o plano." }),
      });
    } finally {
      setSavingPlanId(null);
    }
  };

  if (!domainUser) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-5xl space-y-8" padding="lg" elevated>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-primary">
              {t("plans.choosePlan", { defaultValue: "Escolha seu plano" })}
            </h1>
            <p className="text-sm text-muted">
              {t("plans.choosePlanHint", {
                defaultValue: "Selecione a opção ideal para começar a organizar tudo com a família.",
              })}
            </p>
          </div>
          <StatusPill tone="info" className="flex items-center gap-2 text-xs uppercase">
            <ShieldCheck className="h-4 w-4" />
            {t("plans.currentPlan")}
          </StatusPill>
        </div>

        {feedback ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                : "border-rose-500/40 bg-rose-500/10 text-rose-500"
            }`}
          >
            {feedback.message}
          </div>
        ) : null}

        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center text-muted">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {t("plans.loading", { defaultValue: "Carregando planos..." })}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
            {error}
          </div>
        ) : null}

        {!loading && !error ? (
          <div className="grid gap-4 md:grid-cols-3">
            {selectablePlans.map((plan) => {
              const isSaving = savingPlanId === plan.id;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, translateY: 12 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  <Card
                    padding="lg"
                    elevated
                    className="h-full rounded-3xl border border-soft bg-surface transition hover:border-brand"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-primary">
                          {t(`${plan.translationKey}.name`, { defaultValue: plan.name })}
                        </h2>
                        <p className="mt-2 text-sm text-muted">
                          {t(`${plan.translationKey}.description`, { defaultValue: plan.description })}
                        </p>
                      </div>
                      {plan.tier === "premium" ? (
                        <StatusPill tone="neutral" className="text-[10px] uppercase">
                          <Crown className="mr-1 h-3 w-3" />
                          Premium
                        </StatusPill>
                      ) : null}
                    </div>

                    <div className="mt-6 space-y-3 text-sm text-muted">
                      <div className="flex items-center justify-between rounded-2xl bg-surface-alt px-4 py-3">
                        <span>{t("plans.membersLimit")}</span>
                        <span>{plan.limits.familyMembers}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-surface-alt px-4 py-3">
                        <span>{t("plans.listsLimit")}</span>
                        <span>{plan.limits.listsPerFamily}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-surface-alt px-4 py-3">
                        <span>{t("plans.itemsLimit")}</span>
                        <span>{plan.limits.itemsPerList}</span>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3 text-sm">
                      {plan.perks.map((perk) => (
                        <div key={perk} className="flex items-center gap-2 text-muted">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-soft text-brand">
                            •
                          </span>
                          <span>{t(perk)}</span>
                        </div>
                      ))}
                    </div>

                    <Button
                      className="mt-8 w-full justify-center"
                      variant={plan.tier === "premium" ? "primary" : "secondary"}
                      size="lg"
                      isLoading={isSaving}
                      onClick={() => handleSelect(plan.id)}
                    >
                      {plan.monthlyPrice > 0
                        ? `${localeCurrency.format(plan.monthlyPrice)}/mês`
                        : t("plans.selectFree", { defaultValue: "Começar agora" })}
                    </Button>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
