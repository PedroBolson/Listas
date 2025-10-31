import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    onSnapshot,
    type Unsubscribe,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { COLLECTIONS, type FamilyRecord, type FamilyMemberProfile } from "../domain/models";

export async function createFamily(
    familyId: string,
    ownerId: string,
    name: string
): Promise<FamilyRecord> {
    const now = new Date().toISOString();

    const family: FamilyRecord = {
        id: familyId,
        name,
        ownerId,
        members: {
            [ownerId]: {
                userId: ownerId,
                role: "owner",
                status: "active",
                joinedAt: now,
            },
        },
        blockedMembers: [],
        createdAt: now,
        updatedAt: now,
    };

    const familyRef = doc(db, COLLECTIONS.FAMILIES, familyId);
    await setDoc(familyRef, family);

    return family;
}

export async function getFamilyById(familyId: string): Promise<FamilyRecord | null> {
    const familyRef = doc(db, COLLECTIONS.FAMILIES, familyId);
    const snapshot = await getDoc(familyRef);

    if (!snapshot.exists()) {
        return null;
    }

    return snapshot.data() as FamilyRecord;
}

export async function addFamilyMember(
    familyId: string,
    userId: string,
    role: "collaborator" | "viewer" = "viewer"
): Promise<void> {
    const familyRef = doc(db, COLLECTIONS.FAMILIES, familyId);
    const now = new Date().toISOString();

    const member: FamilyMemberProfile = {
        userId,
        role,
        status: "active",
        joinedAt: now,
    };

    await updateDoc(familyRef, {
        [`members.${userId}`]: member,
        updatedAt: now,
    });
}

export async function removeFamilyMember(familyId: string, userId: string): Promise<void> {
    const familyRef = doc(db, COLLECTIONS.FAMILIES, familyId);
    const now = new Date().toISOString();

    // 1. Remover membro da família
    await updateDoc(familyRef, {
        [`members.${userId}.status`]: "removed",
        [`members.${userId}.removedAt`]: now,
        updatedAt: now,
    });

    // 2. Verificar se o usuário ainda tem outras famílias ativas
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const activeFamilies = (userData.families || []).filter(
        (f: any) => !f.removedAt && f.familyId !== familyId
    );

    // 3. Se não tem mais nenhuma família ativa, promover para Titular
    if (activeFamilies.length === 0) {
        // Criar nova família para o ex-member
        const newFamilyId = `family_${userId}_${Date.now()}`;
        await createFamily(newFamilyId, userId, "Minha Família");

        // Atualizar user para Titular com plano Free
        await updateDoc(userRef, {
            role: "titular",
            primaryFamilyId: newFamilyId,
            families: [{
                familyId: newFamilyId,
                lists: [],
                joinedAt: now,
            }],
            billing: {
                planId: "free",
                status: "active",
                seats: { total: 3, used: 1 },
                invites: { total: 3, used: 0 },
            },
            updatedAt: now,
        });
    } else {
        // Apenas remover a família da lista
        const updatedFamilies = userData.families.map((f: any) =>
            f.familyId === familyId ? { ...f, removedAt: now } : f
        );

        await updateDoc(userRef, {
            families: updatedFamilies,
            primaryFamilyId: activeFamilies[0].familyId, // Mudar para outra família ativa
            updatedAt: now,
        });
    }
}

export async function updateFamilyMemberRole(
    familyId: string,
    userId: string,
    role: "collaborator" | "viewer"
): Promise<void> {
    const familyRef = doc(db, COLLECTIONS.FAMILIES, familyId);

    await updateDoc(familyRef, {
        [`members.${userId}.role`]: role,
        updatedAt: new Date().toISOString(),
    });
}

export async function updateFamilyName(familyId: string, name: string): Promise<void> {
    const familyRef = doc(db, COLLECTIONS.FAMILIES, familyId);

    await updateDoc(familyRef, {
        name,
        updatedAt: new Date().toISOString(),
    });
}

export function subscribeToFamily(
    familyId: string,
    onUpdate: (family: FamilyRecord | null) => void,
    onError?: (error: Error) => void
): Unsubscribe {
    const familyRef = doc(db, COLLECTIONS.FAMILIES, familyId);

    return onSnapshot(
        familyRef,
        (snapshot) => {
            if (snapshot.exists()) {
                onUpdate(snapshot.data() as FamilyRecord);
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

export function subscribeToUserFamilies(
    userId: string,
    onUpdate: (families: FamilyRecord[]) => void,
    onError?: (error: Error) => void
): Unsubscribe {
    const familiesRef = collection(db, COLLECTIONS.FAMILIES);
    const q = query(familiesRef, where(`members.${userId}.status`, "==", "active"));

    return onSnapshot(
        q,
        (snapshot) => {
            const families = snapshot.docs.map((doc) => doc.data() as FamilyRecord);
            onUpdate(families);
        },
        (error) => {
            if (onError) {
                onError(error);
            }
        }
    );
}

/**
 * Titular define quais listas um Member pode visualizar
 * Members com role="owner" sempre veem todas as listas
 */
export async function updateMemberAllowedLists(
    familyId: string,
    memberId: string,
    allowedListIds: string[]
): Promise<void> {
    const familyRef = doc(db, COLLECTIONS.FAMILIES, familyId);

    await updateDoc(familyRef, {
        [`members.${memberId}.allowedLists`]: allowedListIds,
        updatedAt: new Date().toISOString(),
    });
}

/**
 * Verifica se um Member pode ver uma lista específica
 */
export function canMemberViewList(
    member: FamilyMemberProfile,
    listId: string
): boolean {
    // Owner sempre vê todas
    if (member.role === "owner") return true;

    // Se não tem allowedLists definido, não vê nenhuma (segurança)
    if (!member.allowedLists) return false;

    // Verifica se a lista está na allowedLists
    return member.allowedLists.includes(listId);
}
