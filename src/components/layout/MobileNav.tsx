import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useNavigationLinks } from "./useNavigationLinks";
import { cn } from "../../utils/cn";

export function MobileNav() {
  const links = useNavigationLinks();
  const location = useLocation();

  return (
    <nav className="fixed inset-x-4 bottom-4 z-40 flex items-center justify-around gap-2 rounded-3xl border border-soft bg-surface/80 p-2 shadow-soft/40 backdrop-blur xl:hidden">
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
            className="flex-1"
          >
            {({ isActive }) => {
              // Usa customIsActive se definido, senão usa o isActive padrão
              const active = customIsActive !== undefined ? customIsActive : isActive;

              return (
                <div className="relative flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-medium transition-colors">
                  {active && (
                    <motion.div
                      layoutId="mobile-bubble"
                      className="absolute inset-0 rounded-2xl bg-brand shadow-lg shadow-brand/30"
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className={cn("relative z-10 text-lg", active ? "text-white" : "text-secondary")}>
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
  );
}
