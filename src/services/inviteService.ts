import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    getDocs,
    type Unsubscribe,
    onSnapshot,
    collectionGroup,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { SUBCOLLECTIONS, type FamilyInviteRecord } from "../domain/models";
import { getFamilyById, addFamilyMember } from "./familyService";
import { addFamilyToUser, getUserById } from "./userService";

/**
 * Gera um código único de 6 caracteres (A-Z, 0-9)
 * Evita caracteres ambíguos: 0/O, 1/I/L
 */
function generateInviteCode(): string {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // Sem 0,O,1,I,L
    let code = "";
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Gera um token UUID único para o link de convite
 */
function generateInviteToken(): string {
    return crypto.randomUUID();
}

/**
 * Verifica se um código já existe no Firestore
 */
async function codeExists(familyId: string, code: string): Promise<boolean> {
    const invitesRef = collection(db, SUBCOLLECTIONS.FAMILY_INVITES(familyId));
    const q = query(
        invitesRef,
        where("code", "==", code.toUpperCase()),
        where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
}

/**
 * Gera um código único que não existe ainda
 */
async function generateUniqueCode(familyId: string): Promise<string> {
    let code = generateInviteCode();
    let attempts = 0;
    const maxAttempts = 10;

    while (await codeExists(familyId, code)) {
        if (attempts >= maxAttempts) {
            throw new Error("Não foi possível gerar um código único. Tente novamente.");
        }
        code = generateInviteCode();
        attempts++;
    }

    return code;
}

/**
 * Cria um novo convite para uma família
 * @param familyId - ID da família
 * @param createdBy - ID do usuário que está criando (deve ser owner)
 * @param expiresInDays - Dias até expirar (padrão: 7)
 * @returns FamilyInviteRecord com maxUses calculado baseado no plano
 */
export async function createInvite(
    familyId: string,
    createdBy: string,
    expiresInDays: number = 7
): Promise<FamilyInviteRecord> {
    // Validações de segurança
    const family = await getFamilyById(familyId);
    if (!family) {
        throw new Error("Família não encontrada");
    }

    if (family.ownerId !== createdBy) {
        throw new Error("Apenas o titular pode criar convites");
    }

    // Buscar billing data do usuário criador para calcular maxUses
    const user = await getUserById(createdBy);
    if (!user?.billing) {
        throw new Error("Dados de faturamento não encontrados");
    }

    // Calcular maxUses = slots disponíveis no plano
    const totalSlots = user.billing.seats?.total ?? 0;
    const usedSlots = user.billing.seats?.used ?? 0;
    const maxUses = Math.max(0, totalSlots - usedSlots);

    if (maxUses === 0) {
        throw new Error("Não há vagas disponíveis no plano");
    }

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const inviteId = crypto.randomUUID();
    const token = generateInviteToken();
    const code = await generateUniqueCode(familyId);

    const invite: FamilyInviteRecord = {
        id: inviteId,
        familyId,
        createdBy,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: "pending",
        token,
        code,
        maxUses,
        usedCount: 0,
        acceptedBy: [],
        inviteType: "link",
        familyName: family.name,
    };

    const invitePath = SUBCOLLECTIONS.FAMILY_INVITES(familyId);

    try {
        const inviteRef = doc(db, invitePath, inviteId);
        await setDoc(inviteRef, invite);
        return invite;
    } catch (error: any) {
        console.error('Erro ao salvar convite:', error);
        throw new Error(`Falha ao salvar convite: ${error.message}`);
    }
}

/**
 * Busca um convite pelo token (busca global em todas as famílias)
 */
export async function getInviteByToken(token: string): Promise<FamilyInviteRecord | null> {
    const invitesQuery = query(
        collectionGroup(db, "invites"),
        where("token", "==", token),
        where("status", "==", "pending")
    );

    const snapshot = await getDocs(invitesQuery);

    if (snapshot.empty) {
        return null;
    }

    return snapshot.docs[0].data() as FamilyInviteRecord;
}

/**
 * Busca um convite pelo código na família específica
 */
export async function getInviteByCode(familyId: string, code: string): Promise<FamilyInviteRecord | null> {
    const invitesRef = collection(db, SUBCOLLECTIONS.FAMILY_INVITES(familyId));
    const q = query(
        invitesRef,
        where("code", "==", code.toUpperCase()),
        where("status", "==", "pending")
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }

    return snapshot.docs[0].data() as FamilyInviteRecord;
}

/**
 * Valida se um convite pode ser usado
 */
function validateInvite(invite: FamilyInviteRecord): { valid: boolean; reason?: string } {
    if (invite.status !== "pending") {
        return { valid: false, reason: "Convite não está mais disponível" };
    }

    const now = new Date();
    const expiresAt = new Date(invite.expiresAt);

    if (now > expiresAt) {
        return { valid: false, reason: "Convite expirado" };
    }

    if (invite.usedCount >= invite.maxUses) {
        return { valid: false, reason: "Convite já foi usado o máximo de vezes" };
    }

    return { valid: true };
}

/**
 * Aceita um convite e adiciona o usuário à família
 * @param inviteId - ID do convite
 * @param familyId - ID da família
 * @param userId - ID do usuário que está aceitando
 */
export async function acceptInvite(
    inviteId: string,
    familyId: string,
    userId: string
): Promise<void> {
    // 1. Buscar convite
    const inviteRef = doc(db, SUBCOLLECTIONS.FAMILY_INVITES(familyId), inviteId);
    const inviteSnap = await getDoc(inviteRef);

    if (!inviteSnap.exists()) {
        throw new Error("Convite não encontrado");
    }

    const invite = inviteSnap.data() as FamilyInviteRecord;

    // 2. Validar convite
    const validation = validateInvite(invite);
    if (!validation.valid) {
        throw new Error(validation.reason || "Convite inválido");
    }

    // 3. Verificar se usuário já é membro
    const family = await getFamilyById(familyId);
    if (!family) {
        throw new Error("Família não encontrada");
    }

    const existingMember = family.members[userId];
    if (existingMember && existingMember.status === "active") {
        throw new Error("Você já é membro desta família");
    }

    // 4. Adicionar usuário à família como "viewer" (member)
    await addFamilyMember(familyId, userId, "viewer");

    // 5. Adicionar família ao user.families[]
    await addFamilyToUser(userId, familyId, invite.createdBy);

    // 6. Atualizar convite
    const newUsedCount = invite.usedCount + 1;
    const newAcceptedBy = [...invite.acceptedBy, userId];
    const newStatus = newUsedCount >= invite.maxUses ? "accepted" : "pending";

    await updateDoc(inviteRef, {
        usedCount: newUsedCount,
        acceptedBy: newAcceptedBy,
        status: newStatus,
    });
}

/**
 * Lista todos os convites de uma família
 */
export async function listFamilyInvites(familyId: string): Promise<FamilyInviteRecord[]> {
    const invitesRef = collection(db, SUBCOLLECTIONS.FAMILY_INVITES(familyId));
    const snapshot = await getDocs(invitesRef);

    return snapshot.docs.map(doc => doc.data() as FamilyInviteRecord);
}

/**
 * Revoga um convite (apenas owner pode fazer)
 */
export async function revokeInvite(
    inviteId: string,
    familyId: string,
    userId: string
): Promise<void> {
    // Validar permissão
    const family = await getFamilyById(familyId);
    if (!family) {
        throw new Error("Família não encontrada");
    }

    if (family.ownerId !== userId) {
        throw new Error("Apenas o titular pode revogar convites");
    }

    // Revogar convite
    const inviteRef = doc(db, SUBCOLLECTIONS.FAMILY_INVITES(familyId), inviteId);
    await updateDoc(inviteRef, {
        status: "revoked",
    });
}

/**
 * Subscreve aos convites de uma família em tempo real
 */
export function subscribeToFamilyInvites(
    familyId: string,
    onUpdate: (invites: FamilyInviteRecord[]) => void,
    onError?: (error: Error) => void
): Unsubscribe {
    const invitesRef = collection(db, SUBCOLLECTIONS.FAMILY_INVITES(familyId));

    return onSnapshot(
        invitesRef,
        (snapshot) => {
            const invites = snapshot.docs.map(doc => doc.data() as FamilyInviteRecord);
            onUpdate(invites);
        },
        (error) => {
            console.error("Erro ao buscar convites:", error);
            if (onError) onError(error as Error);
        }
    );
}

/**
 * Aceita convite pelo código (busca global em todas as famílias)
 */
export async function acceptInviteByCode(
    code: string,
    userId: string
): Promise<{ familyId: string; familyName: string }> {
    // Busca global usando collectionGroup
    const invitesQuery = query(
        collectionGroup(db, "invites"),
        where("code", "==", code.toUpperCase()),
        where("status", "==", "pending")
    );

    const snapshot = await getDocs(invitesQuery);

    if (snapshot.empty) {
        throw new Error("Código inválido ou expirado");
    }

    const invite = snapshot.docs[0].data() as FamilyInviteRecord;

    // Aceitar convite
    await acceptInvite(invite.id, invite.familyId, userId);

    return {
        familyId: invite.familyId,
        familyName: invite.familyName || "Família",
    };
}

/**
 * Aceita convite pelo código em uma família específica
 */
export async function acceptInviteByCodeInFamily(
    familyId: string,
    code: string,
    userId: string
): Promise<void> {
    const invite = await getInviteByCode(familyId, code);

    if (!invite) {
        throw new Error("Código inválido ou expirado");
    }

    await acceptInvite(invite.id, familyId, userId);
}
