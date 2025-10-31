import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "../../utils/cn";
import { useNavigationLinks } from "./useNavigationLinks";

export function Sidebar() {
  const links = useNavigationLinks();
  const { t } = useTranslation();

  return (
    <aside className="hidden h-full w-72 shrink-0 flex-col justify-between rounded-4xl border border-soft bg-surface p-6 shadow-soft/30 lg:flex">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 rounded-2xl bg-brand-soft p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-white text-lg font-semibold">
            LI
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-brand">ListsHub</span>
            <span className="text-xs text-muted">Household & Business OS</span>
          </div>
        </div>
        <nav className="flex flex-col gap-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                  isActive
                    ? "bg-brand text-white shadow-soft"
                    : "text-secondary hover:bg-brand-soft hover:text-brand",
                )
              }
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="rounded-2xl bg-surface-alt p-4 text-xs text-muted">
        {t("brand.tagline")}
      </div>
    </aside>
  );
}
