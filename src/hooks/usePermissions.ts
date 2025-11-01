import { useAuth } from "../features/auth/useAuth";
import { usePlans } from "../providers/usePlans";

export interface PermissionCheck {
    allowed: boolean;
    reason?: string;
    limit?: number;
    current?: number;
}

/**
 * Hook para verificar permissões do usuário baseado no plano e role
 */
export function usePermissions() {
    const { domainUser } = useAuth();
    const { getPlan } = usePlans();

    const currentPlan = getPlan(domainUser?.billing?.planId ?? null);

    /**
     * Verifica se o usuário pode criar uma nova lista
     */
    const canCreateList = (): PermissionCheck => {
        if (!domainUser) {
            return { allowed: false, reason: "Usuário não autenticado" };
        }

        // Members NÃO podem criar listas, apenas Titulares
        if (!domainUser.isTitular) {
            return {
                allowed: false,
                reason: "Apenas titulares podem criar listas"
            };
        }

        if (!currentPlan || !domainUser.billing) {
            return { allowed: false, reason: "Plano não encontrado" };
        }

        const limit = currentPlan.limits.listsPerFamily;
        const current = domainUser.billing.listsCreated || 0;

        if (currentPlan.isUnlimited) {
            return { allowed: true };
        }

        if (current >= limit) {
            return {
                allowed: false,
                reason: "Limite de listas atingido",
                limit,
                current
            };
        }

        return { allowed: true, limit, current };
    };

    /**
     * Verifica se o usuário pode convidar membros
     */
    const canInviteMember = (): PermissionCheck => {
        if (!domainUser) {
            return { allowed: false, reason: "Usuário não autenticado" };
        }

        // Members NÃO podem convidar, apenas Titulares
        if (!domainUser.isTitular) {
            return {
                allowed: false,
                reason: "Apenas titulares podem convidar membros"
            };
        }

        if (!currentPlan || !domainUser.billing) {
            return { allowed: false, reason: "Plano não encontrado" };
        }

        const limit = currentPlan.limits.familyMembers;
        const current = domainUser.billing.seats?.used ?? 0;

        if (currentPlan.isUnlimited) {
            return { allowed: true };
        }

        if (current >= limit) {
            return {
                allowed: false,
                reason: "Limite de membros atingido",
                limit,
                current
            };
        }

        return { allowed: true, limit, current };
    };

    /**
     * Verifica se o usuário pode criar uma nova família
     */
    const canCreateFamily = (): PermissionCheck => {
        if (!domainUser) {
            return { allowed: false, reason: "Usuário não autenticado" };
        }

        // Members NÃO podem criar famílias
        if (!domainUser.isTitular) {
            return {
                allowed: false,
                reason: "Apenas titulares podem criar famílias"
            };
        }

        if (!currentPlan) {
            return { allowed: false, reason: "Plano não encontrado" };
        }

        const limit = currentPlan.limits.families;
        const current = domainUser.activeFamilies.length;

        if (currentPlan.isUnlimited) {
            return { allowed: true };
        }

        if (current >= limit) {
            return {
                allowed: false,
                reason: "Limite de famílias atingido",
                limit,
                current
            };
        }

        return { allowed: true, limit, current };
    };

    /**
     * Verifica se o usuário pode adicionar itens em uma lista
     */
    const canAddItemToList = (currentItems: number): PermissionCheck => {
        if (!domainUser) {
            return { allowed: false, reason: "Usuário não autenticado" };
        }

        if (!currentPlan) {
            return { allowed: false, reason: "Plano não encontrado" };
        }

        const limit = currentPlan.limits.itemsPerList;

        if (currentPlan.isUnlimited) {
            return { allowed: true };
        }

        if (currentItems >= limit) {
            return {
                allowed: false,
                reason: "Limite de itens por lista atingido",
                limit,
                current: currentItems
            };
        }

        return { allowed: true, limit, current: currentItems };
    };

    /**
     * Verifica se o usuário é Titular (dono da família)
     */
    const isTitular = (): boolean => {
        return domainUser?.isTitular || false;
    };

    /**
     * Verifica se o usuário é Member
     */
    const isMember = (): boolean => {
        return domainUser?.props.role === "member";
    };

    return {
        canCreateList,
        canInviteMember,
        canCreateFamily,
        canAddItemToList,
        isTitular,
        isMember,
        currentPlan,
    };
}
