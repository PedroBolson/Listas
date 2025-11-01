import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen gap-6 bg-background p-4 pb-24 lg:px-8 lg:py-6 lg:pb-6">
      <Sidebar />
      <div className="flex w-full flex-1 flex-col gap-4 rounded-4xl border border-soft bg-surface p-4 shadow-soft/30 sm:p-6 lg:p-8">
        <TopBar />
        <motion.main
          initial={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex-1 pb-4 lg:pb-0"
        >
          {children}
        </motion.main>
      </div>
      <MobileNav />
    </div>
  );
}
