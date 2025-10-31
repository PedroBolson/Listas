import { NavLink } from "react-router-dom";
import { useNavigationLinks } from "./useNavigationLinks";
import { cn } from "../../utils/cn";

export function MobileNav() {
  const links = useNavigationLinks();

  return (
    <nav className="fixed inset-x-4 bottom-4 z-50 flex items-center justify-around gap-2 rounded-3xl border border-soft bg-surface/80 p-2 shadow-soft/40 backdrop-blur lg:hidden">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-medium",
              isActive ? "bg-brand text-white" : "text-secondary hover:bg-brand-soft hover:text-brand",
            )
          }
        >
          <span className="text-lg">{link.icon}</span>
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
