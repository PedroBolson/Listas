import { Suspense } from "react";
import { AppProviders } from "./providers/AppProviders";
import { AppRouter } from "./routes/AppRouter";
import { Spinner } from "./components/ui/Spinner";

function App() {
  return (
    <AppProviders>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-background">
            <Spinner className="h-12 w-12 border-4" />
          </div>
        }
      >
        <AppRouter />
      </Suspense>
    </AppProviders>
  );
}

export default App;
