import { Crown, LogOut, ChevronDown, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "../../features/auth/useAuth";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { FamilySelector } from "./FamilySelector";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { UserProfileModal } from "../profile/UserProfileModal";
import { USER_ROLE } from "../../domain/models";

export function TopBar() {
  const { domainUser, signOut } = useAuth();
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [currentFamilyRole, setCurrentFamilyRole] = useState<string | null>(null);
  const [avatarKey, setAvatarKey] = useState(Date.now());

  // Detectar role na família atual
  useEffect(() => {
    const fetchCurrentFamilyRole = async () => {
      if (!domainUser?.managedFamilyId) {
        setCurrentFamilyRole(null);
        return;
      }

      try {
        const { getFamilyById } = await import("../../services/familyService");
        const family = await getFamilyById(domainUser.managedFamilyId);

        if (!family) {
          setCurrentFamilyRole(null);
          return;
        }

        // Se é dono da família
        if (family.ownerId === domainUser.id) {
          setCurrentFamilyRole("titular");
        } else {
          // Se é membro, pegar o role do members
          const memberData = family.members?.[domainUser.id];
          setCurrentFamilyRole(memberData?.role || "viewer");
        }
      } catch (error) {
        console.error("Erro ao buscar role da família:", error);
        setCurrentFamilyRole(null);
      }
    };

    fetchCurrentFamilyRole();
  }, [domainUser?.managedFamilyId, domainUser?.id]);

  return (
    <>
      <header className="relative z-50 flex items-center justify-between gap-2 rounded-4xl border border-soft bg-surface px-4 py-3 shadow-soft/40 backdrop-blur lg:gap-3 lg:px-8 lg:py-4">
        {/* Left side - Master crown only */}
        <div className="flex items-center gap-2">
          {domainUser?.isMaster && (
            <Crown className="h-4 w-4 shrink-0 text-amber-400 lg:h-5 lg:w-5" />
          )}
        </div>

        {/* Center - Mobile: Clickable dropdown trigger - até 1280px */}
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="group relative flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 xl:hidden"
        >
          <div className="relative flex min-w-0 flex-col items-center">
            {!isDropdownOpen && (
              <span className="absolute -left-3 top-0 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand"></span>
              </span>
            )}
            <span className="truncate text-xs font-semibold text-primary">
              {domainUser?.displayName ?? "—"}
            </span>
            <span className="truncate text-xs text-muted capitalize">
              {domainUser?.role === USER_ROLE.MASTER
                ? t("roles.master")
                : currentFamilyRole
                  ? t(`roles.${currentFamilyRole}`)
                  : t("roles.guest")}
            </span>
          </div>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted transition-all duration-300 group-hover:text-brand ${isDropdownOpen ? "rotate-180" : "animate-bounce"
              }`}
          />
        </button>

        {/* Spacer for desktop */}
        <div className="hidden flex-1 xl:block" />

        {/* Right side - Actions */}
        <div className="flex shrink-0 items-center gap-1 lg:gap-2">
          <div className="hidden items-center gap-1 xl:flex lg:gap-2">
            <FamilySelector />
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
          {/* Clickable user card with avatar and role - Desktop */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="hidden items-center gap-2 rounded-full border border-soft bg-surface-alt px-3 py-2 transition-all hover:border-brand/40 hover:bg-surface xl:flex"
          >
            <Avatar
              key={avatarKey}
              src={domainUser?.photoURL ? `${domainUser.photoURL}?t=${avatarKey}` : null}
              fallback={domainUser?.displayName?.[0] || "U"}
              size="sm"
            />
            <div className="flex flex-col items-start">
              <span className="text-xs font-semibold">{domainUser?.email}</span>
              <span className="text-[10px] uppercase text-muted">
                {domainUser?.role === USER_ROLE.MASTER
                  ? t("roles.master")
                  : currentFamilyRole
                    ? t(`roles.${currentFamilyRole}`)
                    : ""}
              </span>
            </div>
          </button>
          <Button
            variant="ghost"
            size="sm"
            icon={<LogOut className="h-4 w-4" />}
            onClick={() => signOut()}
            className="hidden xl:inline-flex"
          >
            {t("actions.signOut")}
          </Button>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isDropdownOpen && (
            <>
              {/* Invisible backdrop for closing */}
              <div
                onClick={() => setIsDropdownOpen(false)}
                className="fixed inset-0 z-50 xl:hidden"
              />

              {/* Dropdown */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="fixed left-4 right-4 top-20 z-50 flex flex-col gap-2 rounded-2xl border border-soft bg-surface p-3 shadow-lg xl:hidden"
              >
                {/* User Info - Clicável para abrir modal de perfil */}
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="flex items-center gap-3 border-b border-soft pb-3 transition-colors hover:bg-surface-alt rounded-lg p-2 -m-2"
                >
                  <Avatar
                    key={avatarKey}
                    src={domainUser?.photoURL ? `${domainUser.photoURL}?t=${avatarKey}` : null}
                    fallback={domainUser?.displayName?.[0] || "U"}
                    size="md"
                  />
                  <div className="flex flex-1 flex-col items-start">
                    <span className="text-sm font-semibold text-primary">{domainUser?.displayName}</span>
                    <span className="text-xs text-muted">{domainUser?.email}</span>
                  </div>
                  <User className="h-4 w-4 text-muted" />
                </button>

                <div className="flex flex-col gap-2">
                  <div className="px-2 py-1">
                    <FamilySelector />
                  </div>

                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-sm text-secondary">{t("settings.theme", { defaultValue: "Tema" })}</span>
                    <ThemeToggle />
                  </div>

                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-sm text-secondary">{t("settings.language", { defaultValue: "Idioma" })}</span>
                    <LanguageSwitcher />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setAvatarKey(Date.now()); // Força atualização do avatar
        }}
      />
    </>
  );
}
