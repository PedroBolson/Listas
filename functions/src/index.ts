/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions/v2";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";

// Inicializa o Firebase Admin SDK
admin.initializeApp();

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

interface CreateInviteUserData {
    email: string;
    password: string;
    displayName?: string;
    inviteToken: string;
}

/**
 * Cloud Function v2 para criar usuários MEMBER via convite
 * Resolve o problema de race condition com AuthProvider
 */
export const createInviteUser = onCall<CreateInviteUserData>(
    { cors: true },
    async (request: { data: CreateInviteUserData }) => {
        const { email, password, displayName, inviteToken } = request.data;

        // Validação básica
        if (!email || !password || !inviteToken) {
            throw new HttpsError(
                "invalid-argument",
                "Email, password e inviteToken são obrigatórios"
            );
        }

        logger.info("🔥 [FUNCTION] Criando usuário MEMBER via convite", {
            email,
            inviteToken,
        });

        const db = admin.firestore();

        try {
            // 1. Valida que o convite existe e está pendente
            logger.info("🔍 [FUNCTION] Validando convite...");
            const invitesSnapshot = await db
                .collectionGroup("invites")
                .where("token", "==", inviteToken)
                .where("status", "==", "pending")
                .limit(1)
                .get();

            if (invitesSnapshot.empty) {
                throw new HttpsError(
                    "not-found",
                    "Convite não encontrado ou já foi utilizado"
                );
            }

            const inviteDoc = invitesSnapshot.docs[0];
            const inviteData = inviteDoc.data();
            const familyId = inviteData.familyId;

            logger.info("✅ [FUNCTION] Convite válido", { familyId });

            // 2. Cria o usuário no Firebase Auth
            logger.info("🔥 [FUNCTION] Criando usuário no Auth...");
            const userRecord = await admin.auth().createUser({
                email,
                password,
                displayName: displayName || "",
            });

            logger.info("✅ [FUNCTION] Usuário Auth criado", { uid: userRecord.uid });

            // 3. Cria o documento MEMBER no Firestore COM PRIVILÉGIOS ADMIN
            // e aceita o convite (adiciona à família) para evitar passos cliente
            const now = new Date().toISOString();
            const userData: any = {
                id: userRecord.uid,
                role: "member",
                families: [
                    {
                        familyId,
                        lists: [],
                        invitedBy: inviteData.createdBy,
                        joinedAt: now,
                    },
                ],
                createdAt: now,
                updatedAt: now,
                email: email,
                displayName: displayName || "",
                locale: inviteData.locale || "pt",
                photoURL: null,
                status: "active",
            };

            logger.info("💾 [FUNCTION] Salvando documento MEMBER e atualizando família...");

            // Salva o user doc
            await db.doc(`users/${userRecord.uid}`).set(userData);

            // Atualiza a família adicionando o membro (inclui displayName/email no perfil)
            const familyRef = db.doc(`families/${familyId}`);
            const memberProfile = {
                userId: userRecord.uid,
                role: "viewer",
                status: "active",
                joinedAt: now,
                displayName: displayName || "",
                email: email,
            };

            await familyRef.update({
                [`members.${userRecord.uid}`]: memberProfile,
                updatedAt: now,
            });

            // 4. Atualiza o convite (usedCount, acceptedBy, status)
            const inviteRef = inviteDoc.ref;
            const newUsedCount = (inviteData.usedCount || 0) + 1;
            const newAcceptedBy = [...(inviteData.acceptedBy || []), userRecord.uid];
            const newStatus = newUsedCount >= (inviteData.maxUses || 1) ? "accepted" : "pending";

            await inviteRef.update({
                usedCount: newUsedCount,
                acceptedBy: newAcceptedBy,
                status: newStatus,
            });

            logger.info("✅ [FUNCTION] Usuário criado e convite aceito com sucesso", {
                uid: userRecord.uid,
                familyId,
            });

            // 5. Retorna o UID para o cliente fazer login
            return {
                success: true,
                uid: userRecord.uid,
                message: "Usuário MEMBER criado e adicionado à família com sucesso",
            };
        } catch (error: unknown) {
            logger.error("❌ [FUNCTION] Erro ao criar usuário MEMBER:", error);

            // Se criou o usuário Auth mas falhou no Firestore, tenta deletar
            // para evitar usuários órfãos
            if (error instanceof Error && "uid" in error) {
                try {
                    await admin.auth().deleteUser((error as { uid: string }).uid);
                    logger.info("🗑️ [FUNCTION] Usuário Auth deletado após erro");
                } catch (deleteError) {
                    logger.error("❌ [FUNCTION] Erro ao deletar usuário:", deleteError);
                }
            }

            if (error instanceof HttpsError) {
                throw error;
            }

            throw new HttpsError(
                "internal",
                error instanceof Error ? error.message : "Erro desconhecido"
            );
        }
    }
);

interface UpgradeToTitularData {
    planId?: string; // Opcional: plano escolhido (free, basic, premium)
}

/**
 * Cloud Function v2 para converter um membro em titular
 * Cria uma nova família e atualiza o role do usuário
 */
export const upgradeToTitular = onCall<UpgradeToTitularData>(
    { cors: true },
    async (request) => {
        try {
            // 1. Verifica autenticação
            if (!request.auth) {
                throw new HttpsError(
                    "unauthenticated",
                    "Usuário não autenticado"
                );
            }

            const userId = request.auth.uid;
            const { planId = "free" } = request.data || {};

            logger.info("🚀 [FUNCTION] Iniciando upgrade to titular", {
                userId,
                planId,
            });

            const db = admin.firestore();
            const now = admin.firestore.Timestamp.now();

            // 2. Busca o usuário atual
            const userRef = db.collection("users").doc(userId);
            const userDoc = await userRef.get();

            if (!userDoc.exists) {
                throw new HttpsError(
                    "not-found",
                    "Usuário não encontrado"
                );
            }

            const userData = userDoc.data();

            // 3. Verifica se já é titular
            if (userData?.role === "titular" || userData?.role === "master") {
                throw new HttpsError(
                    "already-exists",
                    "Usuário já é titular ou master"
                );
            }

            // 4. Cria uma nova família para o usuário
            const familyRef = db.collection("families").doc();
            const familyId = familyRef.id;

            const newFamily = {
                id: familyId,
                name: `Família de ${userData?.displayName || "Usuário"}`,
                ownerId: userId,
                createdAt: now,
                updatedAt: now,
                members: {
                    [userId]: {
                        userId,
                        role: "titular",
                        status: "active",
                        permissions: ["read", "write", "delete", "invite"],
                        joinedAt: now,
                        allowedLists: [],
                    },
                },
            };

            await familyRef.set(newFamily);

            logger.info("✅ [FUNCTION] Nova família criada", { familyId });

            // 5. Busca os limites do plano no Firestore
            logger.info("🔍 [DEBUG] Buscando plano", { planId });

            const planDoc = await db.collection("plans")
                .where("tier", "==", planId)
                .limit(1)
                .get();

            logger.info("📋 [DEBUG] Resultado busca plano", {
                empty: planDoc.empty,
                size: planDoc.size
            });

            let seats = { total: 3, used: 1 }; // Fallback para free

            if (!planDoc.empty) {
                const planData = planDoc.docs[0].data();
                const familyMembersLimit = planData.limits?.familyMembers || 3;
                seats = { total: familyMembersLimit, used: 1 };
                logger.info("✅ [DEBUG] Seats calculado do plano", {
                    docId: planDoc.docs[0].id,
                    familyMembersLimit,
                    seats
                });
            } else {
                logger.warn("⚠️ [DEBUG] Usando fallback seats", { seats });
            }

            logger.info("💾 [DEBUG] Seats final que será salvo", { seats });

            // 6. Atualiza o usuário para titular
            const updatedUser = {
                role: "titular",
                primaryFamilyId: familyId,
                updatedAt: now,
                billing: {
                    planId,
                    status: "active",
                    subscribedAt: now,
                    seats,
                },
            };

            await userRef.update(updatedUser);

            logger.info("✅ [FUNCTION] Usuário atualizado para titular", {
                userId,
                familyId,
            });

            // 7. Retorna sucesso
            return {
                success: true,
                familyId,
                message: "Usuário convertido para titular com sucesso",
            };
        } catch (error: unknown) {
            logger.error("❌ [FUNCTION] Erro ao converter para titular:", error);

            if (error instanceof HttpsError) {
                throw error;
            }

            throw new HttpsError(
                "internal",
                error instanceof Error ? error.message : "Erro desconhecido"
            );
        }
    }
);

/**
 * Cloud Function v2 para buscar todas as famílias do usuário
 * Retorna apenas os IDs e nomes das famílias onde o usuário é membro ativo
 */
export const getUserFamilies = onCall(
    { cors: true },
    async (request) => {
        try {
            // 1. Verifica autenticação
            if (!request.auth) {
                throw new HttpsError(
                    "unauthenticated",
                    "Usuário não autenticado"
                );
            }

            const userId = request.auth.uid;

            logger.info("🔍 [FUNCTION] Buscando famílias do usuário", { userId });

            const db = admin.firestore();

            // 2. Busca todas as famílias onde o usuário é membro ativo
            const familiesSnapshot = await db.collection("families").get();

            const userFamilies: Array<{
                familyId: string;
                familyName: string;
                role: string;
            }> = [];

            familiesSnapshot.forEach((doc) => {
                const familyData = doc.data();
                const memberProfile = familyData.members?.[userId];

                // Se o usuário é membro ativo desta família
                if (memberProfile && memberProfile.status === "active") {
                    userFamilies.push({
                        familyId: doc.id,
                        familyName: familyData.name,
                        role: memberProfile.role,
                    });
                }
            });

            logger.info("✅ [FUNCTION] Famílias encontradas", {
                userId,
                count: userFamilies.length,
            });

            // 3. Retorna as famílias
            return {
                success: true,
                families: userFamilies,
            };
        } catch (error: unknown) {
            logger.error("❌ [FUNCTION] Erro ao buscar famílias do usuário:", error);

            if (error instanceof HttpsError) {
                throw error;
            }

            throw new HttpsError(
                "internal",
                error instanceof Error ? error.message : "Erro desconhecido"
            );
        }
    }
);
