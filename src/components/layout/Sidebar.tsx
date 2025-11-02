import { NavLink, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import Lottie from "lottie-react";
import { cn } from "../../utils/cn";
import { useNavigationLinks } from "./useNavigationLinks";
import { useTheme } from "../../providers/useTheme";
import animationData from "../../assets/images/wired-outline-56-document-hover-unfold.json";

export function Sidebar() {
  const links = useNavigationLinks();
  const { t } = useTranslation();
  const location = useLocation();
  const { theme } = useTheme();

  return (
    <aside className="hidden h-full w-72 shrink-0 flex-col justify-between rounded-4xl border border-soft bg-surface p-6 shadow-soft/30 xl:flex">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 rounded-2xl bg-brand/5 p-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand/10">
            <Lottie
              animationData={animationData}
              loop={true}
              renderer="svg"
              className="h-full w-full"
              style={{
                filter: theme === 'dark' ? 'brightness(3) invert(1) hue-rotate(180deg)' : 'none'
              }}
            />
          </div>
          <span className="text-base font-bold text-brand">ListsHub</span>
        </div>
        <nav className="relative flex flex-col gap-2">
          {links.map((link) => {
            // Dashboard deve estar ativo tanto em "/" quanto em "/dashboard"
            const isDashboardLink = link.to === "/dashboard";
            const customIsActive = isDashboardLink
              ? (location.pathname === "/" || location.pathname === "/dashboard")
              : undefined;

            return (
              <NavLink
                key={link.to}
                to={link.to}
              >
                {({ isActive }) => {
                  // Usa customIsActive se definido, senão usa o isActive padrão
                  const active = customIsActive !== undefined ? customIsActive : isActive;

                  return (
                    <div className="relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors">
                      {active && (
                        <motion.div
                          layoutId="sidebar-bubble"
                          className="absolute inset-0 rounded-2xl bg-brand shadow-lg shadow-brand/30"
                          transition={{
                            type: "spring",
                            stiffness: 350,
                            damping: 30,
                          }}
                        />
                      )}
                      <span className={cn("relative z-10", active ? "text-white" : "text-secondary")}>
                        {link.icon}
                      </span>
                      <span className={cn("relative z-10", active ? "text-white" : "text-secondary")}>
                        {link.label}
                      </span>
                    </div>
                  );
                }}
              </NavLink>
            );
          })}
        </nav>
      </div>
      <div className="rounded-2xl bg-surface-alt p-4 text-xs text-muted">
        {t("brand.tagline")}
      </div>
    </aside>
  );
}
