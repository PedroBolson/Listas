import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    type Unsubscribe,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { COLLECTIONS, type ListRecord, type ListItemRecord } from "../domain/models";

export async function createList(
    familyId: string,
    listData: Omit<ListRecord, "id" | "createdAt" | "updatedAt">
): Promise<ListRecord> {
    const listRef = doc(collection(db, COLLECTIONS.FAMILIES, familyId, "lists"));
    const now = new Date().toISOString();

    const list: ListRecord = {
        ...listData,
        id: listRef.id,
        familyId,
        createdAt: now,
        updatedAt: now,
    };

    // Remover campos undefined antes de salvar no Firestore
    const cleanData = Object.fromEntries(
        Object.entries(list).filter(([_, value]) => value !== undefined)
    ) as ListRecord;

    await setDoc(listRef, cleanData);
    return list;
}

export async function getListById(familyId: string, listId: string): Promise<ListRecord | null> {
    const listRef = doc(db, COLLECTIONS.FAMILIES, familyId, "lists", listId);
    const snapshot = await getDoc(listRef);

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.data() as ListRecord;
}

export async function updateList(
    familyId: string,
    listId: string,
    data: Partial<ListRecord>
): Promise<void> {
    const listRef = doc(db, COLLECTIONS.FAMILIES, familyId, "lists", listId);
    await updateDoc(listRef, {
        ...data,
        updatedAt: new Date().toISOString(),
    });
}

export async function deleteList(familyId: string, listId: string): Promise<void> {
    const listRef = doc(db, COLLECTIONS.FAMILIES, familyId, "lists", listId);
    await deleteDoc(listRef);
}

export async function shareListWithUser(
    familyId: string,
    listId: string,
    userId: string,
    permissions: { canCreateItems: boolean; canToggleItems: boolean; canDeleteItems: boolean }
): Promise<void> {
    const listRef = doc(db, COLLECTIONS.FAMILIES, familyId, "lists", listId);
    const list = await getDoc(listRef);

    if (!list.exists()) {
        throw new Error("List not found");
    }

    const listData = list.data() as ListRecord;
    const existingPermissions = listData.permissions || [];
    const filteredPermissions = existingPermissions.filter((p) => p.userId !== userId);

    await updateDoc(listRef, {
        permissions: [...filteredPermissions, { userId, ...permissions }],
        collaborators: [...new Set([...(listData.collaborators || []), userId])],
        updatedAt: new Date().toISOString(),
    });
}

export async function removeListAccess(
    familyId: string,
    listId: string,
    userId: string
): Promise<void> {
    const listRef = doc(db, COLLECTIONS.FAMILIES, familyId, "lists", listId);
    const list = await getDoc(listRef);

    if (!list.exists()) {
        throw new Error("List not found");
    }

    const listData = list.data() as ListRecord;
    const filteredPermissions = (listData.permissions || []).filter((p) => p.userId !== userId);
    const filteredCollaborators = (listData.collaborators || []).filter((id) => id !== userId);

    await updateDoc(listRef, {
        permissions: filteredPermissions,
        collaborators: filteredCollaborators,
        updatedAt: new Date().toISOString(),
    });
}

export function subscribeToFamilyLists(
    familyId: string,
    onUpdate: (lists: ListRecord[]) => void,
    onError?: (error: Error) => void
): Unsubscribe {
    const listsRef = collection(db, COLLECTIONS.FAMILIES, familyId, "lists");
    const q = query(listsRef, orderBy("createdAt", "desc"));

    return onSnapshot(
        q,
        (snapshot) => {
            const lists = snapshot.docs.map((doc) => doc.data() as ListRecord);
            onUpdate(lists);
        },
        (error) => {
            if (onError) {
                onError(error);
            }
        }
    );
}

export function subscribeToList(
    familyId: string,
    listId: string,
    onUpdate: (list: ListRecord | null) => void,
    onError?: (error: Error) => void
): Unsubscribe {
    const listRef = doc(db, COLLECTIONS.FAMILIES, familyId, "lists", listId);

    return onSnapshot(
        listRef,
        (snapshot) => {
            if (snapshot.exists()) {
                onUpdate(snapshot.data() as ListRecord);
            } else {
                onUpdate(null);
            }
        },
        (error) => {
            if (onError) {
                onError(error);
            }
        }
    );
}

export async function createListItem(
    familyId: string,
    listId: string,
    itemData: Omit<ListItemRecord, "id" | "createdAt">
): Promise<ListItemRecord> {
    const itemRef = doc(collection(db, COLLECTIONS.FAMILIES, familyId, "lists", listId, "items"));
    const now = new Date().toISOString();

    const item: ListItemRecord = {
        ...itemData,
        id: itemRef.id,
        createdAt: now,
    };

    await setDoc(itemRef, item);
    return item;
}

export async function updateListItem(
    familyId: string,
    listId: string,
    itemId: string,
    data: Partial<ListItemRecord>
): Promise<void> {
    const itemRef = doc(db, COLLECTIONS.FAMILIES, familyId, "lists", listId, "items", itemId);
    await updateDoc(itemRef, data);
}

export async function toggleListItem(
    familyId: string,
    listId: string,
    itemId: string,
    checked: boolean,
    userId: string
): Promise<void> {
    const itemRef = doc(db, COLLECTIONS.FAMILIES, familyId, "lists", listId, "items", itemId);
    const now = new Date().toISOString();

    await updateDoc(itemRef, {
        checked,
        checkedAt: checked ? now : null,
        checkedBy: checked ? userId : null,
    });
}

export async function deleteListItem(
    familyId: string,
    listId: string,
    itemId: string
): Promise<void> {
    const itemRef = doc(db, COLLECTIONS.FAMILIES, familyId, "lists", listId, "items", itemId);
    await deleteDoc(itemRef);
}

export function subscribeToListItems(
    familyId: string,
    listId: string,
    onUpdate: (items: ListItemRecord[]) => void,
    onError?: (error: Error) => void
): Unsubscribe {
    const itemsRef = collection(db, COLLECTIONS.FAMILIES, familyId, "lists", listId, "items");
    const q = query(itemsRef, orderBy("createdAt", "asc"));

    return onSnapshot(
        q,
        (snapshot) => {
            const items = snapshot.docs.map((doc) => doc.data() as ListItemRecord);
            onUpdate(items);
        },
        (error) => {
            if (onError) {
                onError(error);
            }
        }
    );
}

export async function getListsByIds(
    familyId: string,
    listIds: string[]
): Promise<ListRecord[]> {
    if (listIds.length === 0) return [];

    const listsRef = collection(db, COLLECTIONS.FAMILIES, familyId, "lists");
    const q = query(listsRef, where("__name__", "in", listIds));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => doc.data() as ListRecord);
}
