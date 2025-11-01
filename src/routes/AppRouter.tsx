import { createBrowserRouter, RouterProvider, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AppShell } from "../components/layout/AppShell";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { ListsPage } from "../features/lists/ListsPage";
import { CreateListPage } from "../features/lists/CreateListPage";
import { EditListPage } from "../features/lists/EditListPage";
import { ShareListPage } from "../features/lists/ShareListPage";
import { ListDetailPage } from "../features/lists/ListDetailPage";
import { FamilyPage } from "../features/family/FamilyPage";
import { BillingPage } from "../features/billing/BillingPage";
import { MasterConsolePage } from "../features/master/MasterConsolePage";
import { UpgradePage } from "../features/upgrade/UpgradePage";
import { AuthGate } from "../features/auth/AuthGate";
import { PlanSelectionPage } from "../features/onboarding/PlanSelectionPage";
import { InviteAcceptPage } from "../features/invites/InviteAcceptPage";

function AppLayout() {
  const location = useLocation();

  return (
    <AuthGate>
      <AppShell>
        <AnimatePresence mode="wait">
          <Outlet key={location.pathname} />
        </AnimatePresence>
      </AppShell>
    </AuthGate>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "dashboard",
        element: <DashboardPage />,
      },
      {
        path: "lists",
        element: <ListsPage />,
      },
      {
        path: "lists/new",
        element: <CreateListPage />,
      },
      {
        path: "lists/:listId",
        element: <ListDetailPage />,
      },
      {
        path: "lists/:listId/edit",
        element: <EditListPage />,
      },
      {
        path: "lists/:listId/share",
        element: <ShareListPage />,
      },
      {
        path: "family",
        element: <FamilyPage />,
      },
      {
        path: "billing",
        element: <BillingPage />,
      },
      {
        path: "master",
        element: <MasterConsolePage />,
      },
      {
        path: "upgrade",
        element: <UpgradePage />,
      },
    ],
  },
  {
    path: "/invite/:token",
    element: <InviteAcceptPage />,
  },
  {
    path: "/onboarding/plan",
    element: (
      <AuthGate>
        <PlanSelectionPage />
      </AuthGate>
    ),
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
