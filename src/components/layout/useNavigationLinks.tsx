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

  return useMemo<NavigationItem[]>(() => {
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
      if (!domainUser) return false;
      return link.roles.includes(domainUser.role);
    });
  }, [domainUser, t]);
}
