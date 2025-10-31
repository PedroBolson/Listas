import { useEffect, useState } from "react";
import { subscribeToFamily, subscribeToUserFamilies } from "../services/familyService";
import { type FamilyRecord } from "../domain/models";

export function useFamily(familyId: string | null) {
    const [family, setFamily] = useState<FamilyRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!familyId) {
            setFamily(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToFamily(
            familyId,
            (data) => {
                setFamily(data);
                setLoading(false);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [familyId]);

    return { family, loading, error };
}

export function useUserFamilies(userId: string | null) {
    const [families, setFamilies] = useState<FamilyRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!userId) {
            setFamilies([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToUserFamilies(
            userId,
            (data) => {
                setFamilies(data);
                setLoading(false);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [userId]);

    return { families, loading, error };
}
