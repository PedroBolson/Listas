import {
  LogOut,
  ChevronDown,
  User,
  ListChecks,
  LayoutDashboard,
  Users,
  CreditCard,
  ShieldCheck,
  Crown,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { FamilySelector } from "./FamilySelector";
import { Avatar } from "../ui/Avatar";
import { BottomSheet } from "../ui/BottomSheet";
import { UserProfileModal } from "../profile/UserProfileModal";
import { USER_ROLE } from "../../domain/models";

// ─── Role badge ───────────────────────────────────────────────────────────────

interface RoleBadgeProps {
  role: string;
}

function RoleBadge({ role }: RoleBadgeProps) {
  const { t } = useTranslation();

  const config: Record<string, { label: string; className: string }> = {
    master: {
      label: t("roles.master", { defaultValue: "Master" }),
      className: "bg-amber-400/15 text-amber-600 dark:text-amber-400",
    },
    titular: {
      label: t("roles.titular", { defaultValue: "Titular" }),
      className: "bg-brand-soft text-brand",
    },
    owner: {
      label: t("roles.titular", { defaultValue: "Titular" }),
      className: "bg-brand-soft text-brand",
    },
    member: {
      label: t("roles.member", { defaultValue: "Membro" }),
      className: "bg-surface-alt text-secondary",
    },
    collaborator: {
      label: t("roles.collaborator", { defaultValue: "Colaborador" }),
      className: "bg-surface-alt text-secondary",
    },
    viewer: {
      label: t("roles.viewer", { defaultValue: "Visualizador" }),
      className: "bg-surface-alt text-secondary",
    },
  };

  const { label, className } = config[role] ?? config.member;

  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${className}`}
    >
      {label}
    </span>
  );
}

// ─── Master crown badge on avatar ─────────────────────────────────────────────

function MasterBadge() {
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 shadow-sm">
      <Crown className="h-2.5 w-2.5 text-white" />
    </span>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────

export function TopBar() {
  const { domainUser, signOut } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [currentFamilyRole, setCurrentFamilyRole] = useState<string | null>(null);
  const [avatarKey, setAvatarKey] = useState(Date.now());

  // Fetch role in current family
  useEffect(() => {
    const fetchRole = async () => {
      if (!domainUser?.managedFamilyId) {
        setCurrentFamilyRole(null);
        return;
      }
      try {
        const { getFamilyById } = await import("../../services/familyService");
        const family = await getFamilyById(domainUser.managedFamilyId);
        if (!family) return setCurrentFamilyRole(null);
        if (family.ownerId === domainUser.id) return setCurrentFamilyRole("owner");
        const memberData = family.members?.[domainUser.id];
        setCurrentFamilyRole(memberData?.role ?? "viewer");
      } catch {
        setCurrentFamilyRole(null);
      }
    };
    fetchRole();
  }, [domainUser?.managedFamilyId, domainUser?.id]);

  // Breadcrumb: page icon + label based on current route
  const pageInfo = useMemo(() => {
    const path = location.pathname;
    if (path === "/" || path.startsWith("/lists"))
      return { icon: <ListChecks className="h-4 w-4" />, label: t("navigation.lists") };
    if (path === "/dashboard")
      return { icon: <LayoutDashboard className="h-4 w-4" />, label: t("navigation.dashboard") };
    if (path.startsWith("/family"))
      return { icon: <Users className="h-4 w-4" />, label: t("navigation.family") };
    if (path.startsWith("/billing"))
      return { icon: <CreditCard className="h-4 w-4" />, label: t("navigation.billing") };
    if (path.startsWith("/master"))
      return { icon: <ShieldCheck className="h-4 w-4" />, label: t("navigation.masterConsole") };
    return { icon: null, label: "ListsHub" };
  }, [location.pathname, t]);

  const displayRole = domainUser?.isMaster
    ? USER_ROLE.MASTER
    : (currentFamilyRole ?? domainUser?.role ?? "member");

  const firstName = domainUser?.displayName?.split(" ")[0]
    || domainUser?.email?.split("@")[0]
    || "—";

  const avatarSrc = domainUser?.photoURL ? `${domainUser.photoURL}?t=${avatarKey}` : null;
  const avatarFallback = domainUser?.displayName?.[0] || "U";

  // Shared user card JSX for dropdown + bottom sheet
  const userCard = (onPress: () => void) => (
    <button
      onClick={onPress}
      className="flex w-full items-center gap-3 rounded-2xl p-3 text-left transition hover:bg-surface-alt"
    >
      <div className="relative shrink-0">
        <Avatar key={avatarKey} src={avatarSrc} fallback={avatarFallback} size="md" />
        {domainUser?.isMaster && <MasterBadge />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-primary">
          {domainUser?.displayName || "—"}
        </p>
        <p className="truncate text-xs text-muted">{domainUser?.email}</p>
      </div>
      <User className="h-4 w-4 shrink-0 text-muted" />
    </button>
  );

  return (
    <>
      <header className="relative z-50 flex items-center gap-3 rounded-4xl border border-soft bg-surface px-5 py-3 shadow-soft/20 lg:px-6">

        {/* ── Desktop Left: animated breadcrumb ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname.split("/")[1] || "root"}
            className="hidden items-center gap-2 text-sm font-semibold text-secondary xl:flex"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          >
            {pageInfo.icon && <span className="text-brand">{pageInfo.icon}</span>}
            <span>{pageInfo.label}</span>
          </motion.div>
        </AnimatePresence>

        {/* ── Mobile Left: brand mark ── */}
        <div className="flex items-center gap-2 xl:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-brand/10">
            <ListChecks className="h-3.5 w-3.5 text-brand" />
          </div>
          <span className="text-sm font-bold text-brand">ListsHub</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* ── Desktop Right: controls ── */}
        <div className="hidden items-center gap-2 xl:flex">
          <FamilySelector />
          <ThemeToggle />
          <LanguageSwitcher />

          {/* User pill with dropdown */}
          <div className="relative">
            <motion.button
              onClick={() => setIsDropdownOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border border-soft bg-surface-alt py-1 pl-1.5 pr-3 transition-colors hover:border-brand/40 hover:bg-surface"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div className="relative">
                <Avatar key={avatarKey} src={avatarSrc} fallback={avatarFallback} size="sm" />
                {domainUser?.isMaster && <MasterBadge />}
              </div>
              <span className="max-w-[90px] truncate text-sm font-medium text-primary">
                {firstName}
              </span>
              <motion.span
                animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.22 }}
              >
                <ChevronDown className="h-3.5 w-3.5 text-muted" />
              </motion.span>
            </motion.button>

            {/* Desktop dropdown */}
            <AnimatePresence>
              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -8 }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute right-0 top-full z-50 mt-2 min-w-[230px] origin-top-right overflow-hidden rounded-2xl border border-soft bg-surface shadow-soft"
                  >
                    {/* User info */}
                    <div className="p-4 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <Avatar key={avatarKey} src={avatarSrc} fallback={avatarFallback} size="md" />
                          {domainUser?.isMaster && <MasterBadge />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-primary">
                            {domainUser?.displayName || "—"}
                          </p>
                          <p className="truncate text-xs text-muted">{domainUser?.email}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <RoleBadge role={displayRole} />
                      </div>
                    </div>

                    <div className="mx-3 h-px bg-surface-alt" />

                    <div className="p-2">
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          setIsProfileModalOpen(true);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-secondary transition hover:bg-surface-alt hover:text-primary"
                      >
                        <User className="h-4 w-4" />
                        {t("navigation.profile", { defaultValue: "Ver perfil" })}
                      </button>
                      <button
                        onClick={() => void signOut()}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-secondary transition hover:bg-danger/10 hover:text-danger"
                      >
                        <LogOut className="h-4 w-4" />
                        {t("actions.signOut")}
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Mobile Right: avatar button → opens bottom sheet ── */}
        <motion.button
          className="relative xl:hidden"
          onClick={() => setIsBottomSheetOpen(true)}
          whileTap={{ scale: 0.88 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          aria-label="Abrir menu"
        >
          <Avatar key={avatarKey} src={avatarSrc} fallback={avatarFallback} size="sm" />
          {domainUser?.isMaster && <MasterBadge />}
        </motion.button>
      </header>

      {/* ── Mobile Bottom Sheet ── */}
      <BottomSheet isOpen={isBottomSheetOpen} onClose={() => setIsBottomSheetOpen(false)}>
        {/* User card */}
        {userCard(() => {
          setIsBottomSheetOpen(false);
          setIsProfileModalOpen(true);
        })}

        <div className="mt-2 flex items-center justify-between px-3">
          <RoleBadge role={displayRole} />
        </div>

        <div className="my-4 h-px bg-surface-alt" />

        {/* Family selector — inline so it expands in-place within the sheet */}
        <FamilySelector variant="inline" />

        {/* Settings rows */}
        <div className="space-y-1">
          <div className="flex items-center justify-between rounded-xl px-2 py-3">
            <span className="text-sm text-secondary">
              {t("settings.theme", { defaultValue: "Tema" })}
            </span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between rounded-xl px-2 py-3">
            <span className="text-sm text-secondary">
              {t("settings.language", { defaultValue: "Idioma" })}
            </span>
            <LanguageSwitcher />
          </div>
        </div>

        <div className="my-4 h-px bg-surface-alt" />

        {/* Logout */}
        <button
          onClick={() => {
            setIsBottomSheetOpen(false);
            void signOut();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-sm text-danger transition hover:bg-danger/10"
        >
          <LogOut className="h-4 w-4" />
          {t("actions.signOut")}
        </button>
      </BottomSheet>

      {/* Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setAvatarKey(Date.now());
        }}
      />
    </>
  );
}
