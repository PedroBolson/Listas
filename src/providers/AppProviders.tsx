import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../lib/i18n";
import { ThemeProvider } from "./ThemeProvider";
import { AuthProvider } from "../features/auth/AuthProvider";
import { PlanProvider } from "./PlanProvider";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <AuthProvider>
          <PlanProvider>{children}</PlanProvider>
        </AuthProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
