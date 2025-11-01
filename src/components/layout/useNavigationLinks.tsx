import { useMemo } from "react";
import {
  LayoutDashboard,
  ListChecks,
  Users,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import { useAuth } from "../../features/auth/useAuth";
import { useFamily } from "../../hooks/useFamily";
import { USER_ROLE, type UserRole } from "../../domain/models";

export interface NavigationItem {
  to: string;
  icon: ReactNode;
  label: string;
  roles?: UserRole[];
}

export function useNavigationLinks() {
  const { domainUser } = useAuth();
  const { t } = useTranslation();
  const currentFamilyId = domainUser?.managedFamilyId ?? null;
  const { family } = useFamily(currentFamilyId);

  return useMemo<NavigationItem[]>(() => {
    if (!domainUser) return [];

    // Verifica se pode gerenciar a família atual usando o FamilyRecord REAL
    const canManageCurrentFamily = domainUser.canManageFamilyFromRecord(family);

    const base: NavigationItem[] = [
      {
        to: "/",
        icon: <LayoutDashboard className="h-4 w-4" />,
        label: t("navigation.dashboard"),
      },
      {
        to: "/lists",
        icon: <ListChecks className="h-4 w-4" />,
        label: t("navigation.lists"),
      },
      {
        to: "/family",
        icon: <Users className="h-4 w-4" />,
        label: t("navigation.family"),
        roles: [USER_ROLE.TITULAR, USER_ROLE.MASTER],
      },
      {
        to: "/billing",
        icon: <CreditCard className="h-4 w-4" />,
        label: t("navigation.billing"),
        roles: [USER_ROLE.TITULAR, USER_ROLE.MASTER],
      },
      {
        to: "/master",
        icon: <ShieldCheck className="h-4 w-4" />,
        label: t("navigation.masterConsole"),
        roles: [USER_ROLE.MASTER],
      },
    ];

    return base.filter((link) => {
      if (!link.roles || link.roles.length === 0) return true;

      // Master sempre vê tudo
      if (domainUser.isMaster) return true;

      // Para Family e Billing, verifica se pode gerenciar a família ATUAL
      if (link.to === "/family" || link.to === "/billing") {
        return canManageCurrentFamily;
      }

      // Para outras rotas com roles, verifica role global
      return link.roles.includes(domainUser.role);
    });
  }, [domainUser, family, t]);
}
