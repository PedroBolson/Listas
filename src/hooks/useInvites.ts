import { useState, useEffect } from "react";
import type { FamilyInviteRecord } from "../domain/models";
import {
    subscribeToFamilyInvites,
    createInvite,
    revokeInvite,
    acceptInvite,
    acceptInviteByCode,
    getInviteByToken,
} from "../services/inviteService";

export function useFamilyInvites(familyId: string | null) {
    const [invites, setInvites] = useState<FamilyInviteRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!familyId) {
            setInvites([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToFamilyInvites(
            familyId,
            (updatedInvites) => {
                setInvites(updatedInvites);
                setLoading(false);
            },
            (error) => {
                console.error("Erro ao buscar convites:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [familyId]);

    return { invites, loading };
}

export function useInviteActions(familyId: string | null, userId: string | null) {
    const [creating, setCreating] = useState(false);
    const [revoking, setRevoking] = useState(false);
    const [accepting, setAccepting] = useState(false);

    const handleCreateInvite = async (expiresInDays: number = 7) => {
        if (!familyId || !userId) {
            throw new Error("Família ou usuário não identificado");
        }

        setCreating(true);
        try {
            const invite = await createInvite(familyId, userId, expiresInDays);
            return invite;
        } finally {
            setCreating(false);
        }
    };

    const handleRevokeInvite = async (inviteId: string) => {
        if (!familyId || !userId) {
            throw new Error("Família ou usuário não identificado");
        }

        setRevoking(true);
        try {
            await revokeInvite(inviteId, familyId, userId);
        } finally {
            setRevoking(false);
        }
    };

    const handleAcceptInvite = async (inviteId: string, targetFamilyId: string) => {
        if (!userId) {
            throw new Error("Usuário não identificado");
        }

        setAccepting(true);
        try {
            await acceptInvite(inviteId, targetFamilyId, userId);
        } finally {
            setAccepting(false);
        }
    };

    const handleAcceptByCode = async (code: string) => {
        if (!userId) {
            throw new Error("Usuário não identificado");
        }

        setAccepting(true);
        try {
            const result = await acceptInviteByCode(code, userId);
            return result;
        } finally {
            setAccepting(false);
        }
    };

    const handleAcceptByToken = async (token: string, overrideUserId?: string) => {
        const targetUserId = overrideUserId || userId;
        if (!targetUserId) {
            throw new Error("Usuário não identificado");
        }

        setAccepting(true);
        try {
            const invite = await getInviteByToken(token);
            if (!invite) {
                throw new Error("Convite não encontrado");
            }
            await acceptInvite(invite.id, invite.familyId, targetUserId);
            return invite;
        } finally {
            setAccepting(false);
        }
    };

    return {
        creating,
        revoking,
        accepting,
        createInvite: handleCreateInvite,
        revokeInvite: handleRevokeInvite,
        acceptInvite: handleAcceptInvite,
        acceptByCode: handleAcceptByCode,
        acceptByToken: handleAcceptByToken,
    };
}
