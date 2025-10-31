import { Crown, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../features/auth/useAuth";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { FamilySelector } from "./FamilySelector";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { StatusPill } from "../feedback/StatusPill";
import { USER_ROLE } from "../../domain/models";

export function TopBar() {
  const { domainUser, signOut } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="flex items-center justify-between gap-2 rounded-4xl border border-soft bg-surface px-4 py-3 shadow-soft/40 backdrop-blur lg:gap-3 lg:px-8 lg:py-4">
      {/* Left side - User info */}
      <div className="flex min-w-0 flex-1 items-center gap-2 lg:gap-4">
        {domainUser?.isMaster ? <Crown className="h-4 w-4 shrink-0 text-amber-400 lg:h-5 lg:w-5" /> : null}
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-xs font-semibold text-primary lg:text-sm">
            {domainUser?.displayName ?? "—"}
          </span>
          <div className="hidden items-center gap-2 text-xs text-muted md:flex">
            <span className="truncate">
              {domainUser?.role === USER_ROLE.MASTER
                ? t("roles.master")
                : domainUser?.role === USER_ROLE.TITULAR
                  ? t("plans.currentPlan")
                  : t("roles.guest")}
            </span>
            {domainUser?.status ? (
              <StatusPill tone="info" className="text-[10px]">
                {t(`status.${domainUser.status}`)}
              </StatusPill>
            ) : null}
          </div>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex shrink-0 items-center gap-1 lg:gap-2">
        <div className="hidden md:flex items-center gap-1 lg:gap-2">
          <FamilySelector />
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-soft bg-surface-alt px-3 py-2 lg:flex">
          <Avatar src={domainUser?.photoURL} fallback="U" size="sm" />
          <div className="flex flex-col">
            <span className="text-xs font-semibold">{domainUser?.email}</span>
            <span className="text-[10px] uppercase text-muted">
              {domainUser ? t(`roles.${domainUser.role}`) : ""}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<LogOut className="h-4 w-4" />}
          onClick={() => signOut()}
          className="hidden lg:inline-flex"
        >
          {t("actions.signOut")}
        </Button>
        {/* Mobile: só o ícone */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
          className="lg:hidden"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
