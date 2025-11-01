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

/**
 * Adiciona uma família ao array families[] do usuário
 */
export async function addFamilyToUser(userId: string, familyId: string, invitedBy?: string): Promise<void> {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        throw new Error("Usuário não encontrado");
    }

    const userData = userSnap.data() as DomainUserProps;
    const existingFamily = userData.families?.find((f) => f.familyId === familyId);

    if (existingFamily && !existingFamily.removedAt) {
        // Já é membro ativo
        return;
    }

    const now = new Date().toISOString();
    const familyLink = {
        familyId,
        lists: [],
        invitedBy,
        joinedAt: now,
    };

    // Se já existia mas foi removido, atualiza. Senão, adiciona
    let newFamilies = userData.families || [];
    if (existingFamily) {
        newFamilies = newFamilies.map((f) => (f.familyId === familyId ? familyLink : f));
    } else {
        newFamilies = [...newFamilies, familyLink];
    }

    await updateDoc(userRef, {
        families: newFamilies,
        updatedAt: now,
    });
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

/**
 * Converte um membro em titular criando uma nova família
 */
export async function upgradeToTitular(planId: string = "free"): Promise<{
    success: boolean;
    familyId?: string;
    message: string;
}> {
    const { httpsCallable } = await import("firebase/functions");
    const { functions } = await import("../lib/firebase");

    const upgradeFunction = httpsCallable<
        { planId?: string },
        { success: boolean; familyId: string; message: string }
    >(functions, "upgradeToTitular");

    const result = await upgradeFunction({ planId });
    return result.data;
}
