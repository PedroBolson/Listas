import { doc, getDoc, setDoc, updateDoc, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { db } from "../lib/firebase";
import { COLLECTIONS, type DomainUserProps } from "../domain/models";

export async function getUserById(userId: string): Promise<DomainUserProps | null> {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.data() as DomainUserProps;
}

export async function updateUser(userId: string, data: Partial<DomainUserProps>): Promise<void> {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await updateDoc(userRef, {
        ...data,
        updatedAt: new Date().toISOString(),
    });
}

export async function createOrUpdateUser(userId: string, data: DomainUserProps): Promise<void> {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    await setDoc(userRef, data, { merge: true });
}

export function subscribeToUser(
    userId: string,
    onUpdate: (user: DomainUserProps | null) => void,
    onError?: (error: Error) => void
): Unsubscribe {
    const userRef = doc(db, COLLECTIONS.USERS, userId);

    return onSnapshot(
        userRef,
        (snapshot) => {
            if (snapshot.exists()) {
                onUpdate(snapshot.data() as DomainUserProps);
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
