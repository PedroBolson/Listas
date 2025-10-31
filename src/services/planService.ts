import { type BillingSnapshot, type SubscriptionPlanProps, USER_ROLE } from "../domain/models";

export const PLANS: SubscriptionPlanProps[] = [
    {
        id: "free",
        tier: "free",
        name: "Free",
        description: "Perfect for personal use",
        translationKey: "plans.free",
        monthlyPrice: 0,
        yearlyPrice: 0,
        currency: "BRL",
        limits: {
            families: 1,
            familyMembers: 3,
            listsPerFamily: 3,
            itemsPerList: 50,
            collaboratorsPerList: 3,
        },
        perks: ["plans.free.perk1", "plans.free.perk2", "plans.free.perk3"],
    },
    {
        id: "plus",
        tier: "plus",
        name: "Plus",
        description: "For small families and teams",
        translationKey: "plans.plus",
        monthlyPrice: 19.9,
        yearlyPrice: 199,
        currency: "BRL",
        limits: {
            families: 1,
            familyMembers: 5,
            listsPerFamily: 10,
            itemsPerList: 100,
            collaboratorsPerList: 5,
        },
        perks: ["plans.plus.perk1", "plans.plus.perk2", "plans.plus.perk3", "plans.plus.perk4"],
    },
    {
        id: "premium",
        tier: "premium",
        name: "Premium",
        description: "For large families and power users",
        translationKey: "plans.premium",
        monthlyPrice: 39.9,
        yearlyPrice: 399,
        currency: "BRL",
        limits: {
            families: 1,
            familyMembers: 15,
            listsPerFamily: 50,
            itemsPerList: 200,
            collaboratorsPerList: 15,
        },
        perks: [
            "plans.premium.perk1",
            "plans.premium.perk2",
            "plans.premium.perk3",
            "plans.premium.perk4",
            "plans.premium.perk5",
        ],
    },
    {
        id: "master",
        tier: "master",
        name: "Master",
        description: "Unlimited everything",
        translationKey: "plans.master",
        monthlyPrice: 0,
        yearlyPrice: 0,
        currency: "BRL",
        limits: {
            families: Number.POSITIVE_INFINITY,
            familyMembers: Number.POSITIVE_INFINITY,
            listsPerFamily: Number.POSITIVE_INFINITY,
            itemsPerList: Number.POSITIVE_INFINITY,
            collaboratorsPerList: Number.POSITIVE_INFINITY,
        },
        perks: ["plans.master.perk1", "plans.master.perk2", "plans.master.perk3"],
        isUnlimited: true,
    },
];

export function getPlanById(planId: string | null): SubscriptionPlanProps | null {
    if (!planId) return null;
    return PLANS.find((p) => p.id === planId) || null;
}

export function createInitialBillingSnapshot(
    planId: string,
    customLimits?: Partial<SubscriptionPlanProps["limits"]>
): BillingSnapshot {
    const plan = getPlanById(planId);

    if (!plan) {
        throw new Error(`Plan ${planId} not found`);
    }

    const now = new Date();
    const renewsAt = new Date(now);
    renewsAt.setMonth(renewsAt.getMonth() + 1);

    return {
        planId,
        status: "active",
        renewsAt: renewsAt.toISOString(),
        seats: {
            total: customLimits?.familyMembers ?? plan.limits.familyMembers,
            used: 0,
        },
        invites: {
            total: customLimits?.familyMembers ?? plan.limits.familyMembers,
            used: 0,
        },
        limits: customLimits
            ? {
                ...plan.limits,
                ...customLimits,
            }
            : undefined,
        listsCreated: 0,
        itemsTracked: 0,
    };
}

export function canPerformAction(
    billing: BillingSnapshot | undefined,
    action: "createList" | "addMember" | "addItem",
    role: string
): { allowed: boolean; reason?: string } {
    if (role === USER_ROLE.MASTER) {
        return { allowed: true };
    }

    if (!billing) {
        return { allowed: false, reason: "No billing information" };
    }

    if (billing.status !== "active") {
        return { allowed: false, reason: "Subscription inactive" };
    }

    const plan = getPlanById(billing.planId);
    if (!plan) {
        return { allowed: false, reason: "Invalid plan" };
    }

    const effectiveLimits = billing.limits || plan.limits;

    switch (action) {
        case "createList": {
            const limit = effectiveLimits.listsPerFamily ?? Number.POSITIVE_INFINITY;
            if (!Number.isFinite(limit)) return { allowed: true };
            if ((billing.listsCreated || 0) >= limit) {
                return { allowed: false, reason: "List limit reached" };
            }
            return { allowed: true };
        }

        case "addMember": {
            const limit = effectiveLimits.familyMembers ?? Number.POSITIVE_INFINITY;
            if (!Number.isFinite(limit)) return { allowed: true };
            if (billing.invites.used >= limit) {
                return { allowed: false, reason: "Member limit reached" };
            }
            return { allowed: true };
        }

        case "addItem": {
            const limit = effectiveLimits.itemsPerList;
            if (!Number.isFinite(limit)) return { allowed: true };
            return { allowed: true };
        }

        default:
            return { allowed: false, reason: "Unknown action" };
    }
}
