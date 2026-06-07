import { useEffect, useState } from "react";
import { subscribeToAccessibleFamilyLists, subscribeToListItems, subscribeToList } from "../services/listService";
import { type ListRecord, type ListItemRecord } from "../domain/models";
import { useAuth } from "../features/auth/useAuth";
import { useFamily } from "./useFamily";

export function useFamilyLists(familyId: string | null) {
    const [lists, setLists] = useState<ListRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { domainUser } = useAuth();
    const { family, loading: familyLoading } = useFamily(familyId);

    useEffect(() => {
        if (!familyId || !domainUser) {
            setLists([]);
            setLoading(!domainUser);
            return;
        }

        if (familyLoading) {
            setLoading(true);
            return;
        }

        if (!domainUser.isMaster && !family) {
            setLists([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const canReadAll = domainUser.isMaster || family?.ownerId === domainUser.id;

        const unsubscribe = subscribeToAccessibleFamilyLists(
            familyId,
            domainUser.id,
            canReadAll,
            (data) => {
                setLists(data);
                setLoading(false);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [familyId, domainUser, family, familyLoading]);

    return { lists, loading, error };
}

export function useList(familyId: string | null, listId: string | null) {
    const [list, setList] = useState<ListRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!familyId || !listId) {
            setList(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToList(
            familyId,
            listId,
            (data) => {
                setList(data);
                setLoading(false);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [familyId, listId]);

    return { list, loading, error };
}

export function useListItems(familyId: string | null, listId: string | null) {
    const [items, setItems] = useState<ListItemRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!familyId || !listId) {
            setItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToListItems(
            familyId,
            listId,
            (data) => {
                setItems(data);
                setLoading(false);
            },
            (err) => {
                setError(err);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [familyId, listId]);

    return { items, loading, error };
}

export function useListItemsCount(familyId: string | null, listId: string) {
    const [itemsCount, setItemsCount] = useState(0);
    const [completedCount, setCompletedCount] = useState(0);

    useEffect(() => {
        if (!familyId) {
            setItemsCount(0);
            setCompletedCount(0);
            return;
        }

        const unsubscribe = subscribeToListItems(
            familyId,
            listId,
            (data) => {
                setItemsCount(data.length);
                setCompletedCount(data.filter(item => item.checked).length);
            },
            (err) => {
                console.error("Error loading items count:", err);
            }
        );

        return () => unsubscribe();
    }, [familyId, listId]);

    return { itemsCount, completedCount };
}

export function useMaxListItemsCount(familyId: string | null, listIds: string[]) {
    const [maxItemsCount, setMaxItemsCount] = useState(0);

    useEffect(() => {
        if (!familyId || listIds.length === 0) {
            setMaxItemsCount(0);
            return;
        }

        const unsubscribes: (() => void)[] = [];
        const itemsCounts = new Map<string, number>();

        listIds.forEach((listId) => {
            const unsubscribe = subscribeToListItems(
                familyId,
                listId,
                (data) => {
                    itemsCounts.set(listId, data.length);
                    const max = Math.max(...Array.from(itemsCounts.values()));
                    setMaxItemsCount(max);
                },
                (err) => {
                    console.error(`Error loading items for list ${listId}:`, err);
                }
            );
            unsubscribes.push(unsubscribe);
        });

        return () => {
            unsubscribes.forEach(unsub => unsub());
        };
    }, [familyId, listIds]);

    return maxItemsCount;
}
