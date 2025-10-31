import { useEffect, useState } from "react";
import { subscribeToFamilyLists, subscribeToListItems, subscribeToList } from "../services/listService";
import { type ListRecord, type ListItemRecord } from "../domain/models";

export function useFamilyLists(familyId: string | null) {
    const [lists, setLists] = useState<ListRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!familyId) {
            setLists([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToFamilyLists(
            familyId,
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
    }, [familyId]);

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
