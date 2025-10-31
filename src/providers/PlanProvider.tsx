import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { SubscriptionPlan } from "../domain/models";

interface PlanDocument {
  id: string;
  tier: "free" | "plus" | "premium" | "master";
  name: string;
  description: string;
  translationKey: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  limits: {
    families: number;
    familyMembers: number;
    listsPerFamily: number;
    itemsPerList: number;
    collaboratorsPerList: number;
  };
  perks: string[];
  isUnlimited?: boolean;
  order?: number;
}

interface PlanContextValue {
  plans: SubscriptionPlan[];
  loading: boolean;
  error: string | null;
  getPlan: (planId: string | undefined | null) => SubscriptionPlan | undefined;
}

const PlanContext = createContext<PlanContextValue>({
  plans: [],
  loading: true,
  error: null,
  getPlan: () => undefined,
});

interface PlanProviderProps {
  children: ReactNode;
}

export function PlanProvider({ children }: PlanProviderProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const colRef = collection(db, "plans");

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const parsed = snapshot.docs.map((doc) => {
          const data = doc.data() as PlanDocument;
          return new SubscriptionPlan({
            ...data,
            id: doc.id,
            tier: data.tier,
            translationKey: data.translationKey ?? `plans.catalog.${doc.id}`,
            perks: data.perks ?? [],
            isUnlimited: Boolean(data.isUnlimited),
            currency: data.currency as "BRL" | "USD",
          });
        });

        // Ordenar client-side por order (se existir) ou por tier
        const sorted = parsed.sort((a, b) => {
          const orderA = (a.props as any).order ?? 999;
          const orderB = (b.props as any).order ?? 999;
          return orderA - orderB;
        });
        
        setPlans(sorted);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message ?? "Failed to load plans.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const getPlan = useCallback(
    (planId: string | undefined | null) => plans.find((plan) => plan.id === planId),
    [plans],
  );

  const value = useMemo(
    () => ({
      plans,
      loading,
      error,
      getPlan,
    }),
    [plans, loading, error, getPlan],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlansContext() {
  return useContext(PlanContext);
}
