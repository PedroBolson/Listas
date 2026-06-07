import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment,
    type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

const PROJECT_ID = "listshub";
const FAMILY_ID = "family-a";
const OTHER_FAMILY_ID = "family-b";

const ownerUid = "owner-uid";
const memberUid = "member-uid";
const collaboratorUid = "collaborator-uid";
const outsiderUid = "outsider-uid";
const masterUid = "master-uid";

let testEnv: RulesTestEnvironment;

function authDb(uid: string, email = `${uid}@example.com`) {
    return testEnv.authenticatedContext(uid, { email }).firestore();
}

function anonDb() {
    return testEnv.unauthenticatedContext().firestore();
}

function userRef(db: ReturnType<typeof authDb> | ReturnType<typeof anonDb>, uid: string) {
    return doc(db, "users", uid);
}

function listRef(db: ReturnType<typeof authDb> | ReturnType<typeof anonDb>, listId: string, familyId = FAMILY_ID) {
    return doc(db, "families", familyId, "lists", listId);
}

function itemRef(
    db: ReturnType<typeof authDb> | ReturnType<typeof anonDb>,
    listId: string,
    itemId: string,
    familyId = FAMILY_ID,
) {
    return doc(db, "families", familyId, "lists", listId, "items", itemId);
}

function listsCollection(db: ReturnType<typeof authDb> | ReturnType<typeof anonDb>, familyId = FAMILY_ID) {
    return collection(db, "families", familyId, "lists");
}

function baseBilling() {
    return {
        planId: "free",
        status: "active",
        seats: { total: 3, used: 1 },
        invites: { total: 3, used: 0 },
    };
}

function baseUser(uid: string, role: "master" | "titular" | "member", familyId = FAMILY_ID) {
    return {
        id: uid,
        email: `${uid}@example.com`,
        displayName: uid,
        photoURL: null,
        locale: "pt",
        role,
        status: "active",
        primaryFamilyId: familyId,
        families: [{ familyId, lists: [], joinedAt: "2026-01-01T00:00:00.000Z" }],
        billing: baseBilling(),
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
    };
}

function memberProfile(uid: string, role: "owner" | "viewer" = "viewer") {
    return {
        userId: uid,
        role,
        status: "active",
        joinedAt: "2026-01-01T00:00:00.000Z",
        displayName: uid,
        email: `${uid}@example.com`,
        photoURL: null,
    };
}

function baseList(
    id: string,
    overrides: Partial<{
        ownerId: string;
        familyId: string;
        visibility: "private" | "family" | "public";
        collaborators: string[];
    }> = {},
) {
    const familyId = overrides.familyId ?? FAMILY_ID;
    return {
        id,
        familyId,
        ownerId: overrides.ownerId ?? ownerUid,
        name: id,
        description: "",
        type: "shopping",
        visibility: overrides.visibility ?? "private",
        tags: [],
        permissions: [],
        collaborators: overrides.collaborators ?? [],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
    };
}

function baseItem(id: string, createdBy = ownerUid) {
    return {
        id,
        name: id,
        checked: false,
        createdBy,
        createdAt: "2026-01-01T00:00:00.000Z",
    };
}

async function seedData() {
    await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();

        await Promise.all([
            setDoc(doc(db, "users", ownerUid), baseUser(ownerUid, "titular")),
            setDoc(doc(db, "users", memberUid), baseUser(memberUid, "member")),
            setDoc(doc(db, "users", collaboratorUid), baseUser(collaboratorUid, "member")),
            setDoc(doc(db, "users", outsiderUid), baseUser(outsiderUid, "titular", OTHER_FAMILY_ID)),
            setDoc(doc(db, "users", masterUid), baseUser(masterUid, "master")),
            setDoc(doc(db, "families", FAMILY_ID), {
                id: FAMILY_ID,
                name: "Family A",
                ownerId: ownerUid,
                members: {
                    [ownerUid]: memberProfile(ownerUid, "owner"),
                    [memberUid]: memberProfile(memberUid),
                    [collaboratorUid]: memberProfile(collaboratorUid),
                },
                blockedMembers: [],
                createdAt: "2026-01-01T00:00:00.000Z",
                updatedAt: "2026-01-01T00:00:00.000Z",
            }),
            setDoc(doc(db, "families", OTHER_FAMILY_ID), {
                id: OTHER_FAMILY_ID,
                name: "Family B",
                ownerId: outsiderUid,
                members: {
                    [outsiderUid]: memberProfile(outsiderUid, "owner"),
                },
                blockedMembers: [],
                createdAt: "2026-01-01T00:00:00.000Z",
                updatedAt: "2026-01-01T00:00:00.000Z",
            }),
        ]);

        await Promise.all([
            setDoc(doc(db, "families", FAMILY_ID, "lists", "owner-private"), baseList("owner-private")),
            setDoc(
                doc(db, "families", FAMILY_ID, "lists", "family-visible"),
                baseList("family-visible", { visibility: "family" }),
            ),
            setDoc(
                doc(db, "families", FAMILY_ID, "lists", "public-visible"),
                baseList("public-visible", { visibility: "public" }),
            ),
            setDoc(
                doc(db, "families", FAMILY_ID, "lists", "collaborator-private"),
                baseList("collaborator-private", { collaborators: [collaboratorUid] }),
            ),
            setDoc(
                doc(db, "families", FAMILY_ID, "lists", "member-owned"),
                baseList("member-owned", { ownerId: memberUid }),
            ),
            setDoc(
                doc(db, "families", OTHER_FAMILY_ID, "lists", "other-family-list"),
                baseList("other-family-list", { familyId: OTHER_FAMILY_ID, ownerId: outsiderUid, visibility: "public" }),
            ),
        ]);

        await Promise.all([
            setDoc(doc(db, "families", FAMILY_ID, "lists", "owner-private", "items", "owner-item"), baseItem("owner-item")),
            setDoc(
                doc(db, "families", FAMILY_ID, "lists", "collaborator-private", "items", "collab-list-item"),
                baseItem("collab-list-item"),
            ),
        ]);
    });
}

beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
        projectId: PROJECT_ID,
        firestore: {
            rules: readFileSync(resolve("firestore.rules"), "utf8"),
        },
    });
});

beforeEach(async () => {
    await testEnv.clearFirestore();
    await seedData();
});

afterAll(async () => {
    await testEnv.cleanup();
});

describe("firestore.rules - users", () => {
    it("1. usuário não autenticado não lê users/{uid}", async () => {
        await assertFails(getDoc(userRef(anonDb(), ownerUid)));
    });

    it("2. usuário autenticado lê o próprio users/{uid}", async () => {
        await assertSucceeds(getDoc(userRef(authDb(memberUid), memberUid)));
    });

    it("3. usuário autenticado não lê users/{outroUid}", async () => {
        await assertFails(getDoc(userRef(authDb(memberUid), ownerUid)));
    });

    it("4. master lê users/{outroUid}", async () => {
        await assertSucceeds(getDoc(userRef(authDb(masterUid), ownerUid)));
    });

    it("5. usuário atualiza campos seguros do próprio perfil", async () => {
        await assertSucceeds(
            updateDoc(userRef(authDb(memberUid), memberUid), {
                displayName: "Novo Nome",
                photoURL: "https://example.com/avatar.png",
                preferences: { theme: "dark" },
                updatedAt: "2026-01-02T00:00:00.000Z",
            }),
        );
    });

    it("6. usuário não altera billing", async () => {
        await assertFails(
            updateDoc(userRef(authDb(memberUid), memberUid), {
                billing: { ...baseBilling(), planId: "premium" },
            }),
        );
    });

    it("7. usuário não altera role", async () => {
        await assertFails(updateDoc(userRef(authDb(memberUid), memberUid), { role: "master" }));
    });

    it("8. usuário não altera status", async () => {
        await assertFails(updateDoc(userRef(authDb(memberUid), memberUid), { status: "suspended" }));
    });

    it("9. usuário não altera families", async () => {
        await assertFails(
            updateDoc(userRef(authDb(memberUid), memberUid), {
                families: [{ familyId: OTHER_FAMILY_ID, lists: [], joinedAt: "2026-01-02T00:00:00.000Z" }],
            }),
        );
    });

    it("10. usuário não altera primaryFamilyId", async () => {
        await assertFails(updateDoc(userRef(authDb(memberUid), memberUid), { primaryFamilyId: OTHER_FAMILY_ID }));
    });

    it("11. usuário não altera createdAt", async () => {
        await assertFails(updateDoc(userRef(authDb(memberUid), memberUid), { createdAt: "2026-01-02T00:00:00.000Z" }));
    });

    it("12. usuário não consegue se criar como master", async () => {
        const uid = "new-master";
        await assertFails(
            setDoc(userRef(authDb(uid), uid), {
                ...baseUser(uid, "master"),
                email: `${uid}@example.com`,
            }),
        );
    });
});

describe("firestore.rules - lists", () => {
    it("13. owner cria lista com familyId correto", async () => {
        const db = authDb(ownerUid);
        await assertSucceeds(
            setDoc(listRef(db, "owner-created"), baseList("owner-created")),
        );
    });

    it("14. owner lê/edita/deleta própria lista", async () => {
        const db = authDb(ownerUid);
        await assertSucceeds(getDoc(listRef(db, "owner-private")));
        await assertSucceeds(updateDoc(listRef(db, "owner-private"), { name: "Atualizada" }));
        await assertSucceeds(deleteDoc(listRef(db, "owner-private")));
    });

    it("15. family owner/master lê todas as listas da família", async () => {
        await assertSucceeds(getDocs(listsCollection(authDb(ownerUid))));
        await assertSucceeds(getDocs(listsCollection(authDb(masterUid))));
    });

    it('16. membro comum lê lista visibility == "family"', async () => {
        await assertSucceeds(getDoc(listRef(authDb(memberUid), "family-visible")));
    });

    it('17. membro comum lê lista visibility == "public"', async () => {
        await assertSucceeds(getDoc(listRef(authDb(memberUid), "public-visible")));
    });

    it('18. membro comum não lê lista visibility == "private" sem estar em collaborators', async () => {
        await assertFails(getDoc(listRef(authDb(memberUid), "owner-private")));
    });

    it("19. collaborator lê lista private", async () => {
        await assertSucceeds(getDoc(listRef(authDb(collaboratorUid), "collaborator-private")));
    });

    it("20. collaborator edita lista se canEditList permitir isso hoje", async () => {
        await assertSucceeds(updateDoc(listRef(authDb(collaboratorUid), "collaborator-private"), { name: "Editada" }));
    });

    it("21. usuário de outra família não lê lista", async () => {
        await assertFails(getDoc(listRef(authDb(outsiderUid), "public-visible")));
    });

    it("22. usuário não cria lista com familyId diferente do path", async () => {
        await assertFails(
            setDoc(
                listRef(authDb(ownerUid), "wrong-family"),
                baseList("wrong-family", { familyId: OTHER_FAMILY_ID }),
            ),
        );
    });
});

describe("firestore.rules - items", () => {
    it("23. owner lê itens da lista", async () => {
        await assertSucceeds(getDoc(itemRef(authDb(ownerUid), "owner-private", "owner-item")));
    });

    it("24. collaborator lê itens da lista", async () => {
        await assertSucceeds(getDoc(itemRef(authDb(collaboratorUid), "collaborator-private", "collab-list-item")));
    });

    it("25. membro sem acesso à lista não lê itens", async () => {
        await assertFails(getDoc(itemRef(authDb(memberUid), "owner-private", "owner-item")));
    });

    it("26. usuário com permissão cria item com createdBy == uid", async () => {
        await assertSucceeds(
            setDoc(
                itemRef(authDb(collaboratorUid), "collaborator-private", "created-by-collab"),
                baseItem("created-by-collab", collaboratorUid),
            ),
        );
    });

    it("27. usuário não cria item com createdBy de outra pessoa", async () => {
        await assertFails(
            setDoc(
                itemRef(authDb(collaboratorUid), "collaborator-private", "created-by-owner"),
                baseItem("created-by-owner", ownerUid),
            ),
        );
    });

    it("28. usuário não altera createdBy no update", async () => {
        await assertFails(
            updateDoc(itemRef(authDb(collaboratorUid), "collaborator-private", "collab-list-item"), {
                checked: true,
                createdBy: collaboratorUid,
            }),
        );
    });

    it("29. usuário sem permissão não edita item", async () => {
        await assertFails(updateDoc(itemRef(authDb(memberUid), "owner-private", "owner-item"), { checked: true }));
    });

    it("30. usuário sem permissão não deleta item", async () => {
        await assertFails(deleteDoc(itemRef(authDb(memberUid), "owner-private", "owner-item")));
    });
});

describe("firestore.rules - frontend-compatible list queries", () => {
    it("31. query ownerId == uid funciona para membro comum", async () => {
        const result = await assertSucceeds(
            getDocs(query(listsCollection(authDb(memberUid)), where("ownerId", "==", memberUid))),
        );
        expect(result.docs.map((snapshot) => snapshot.id)).toContain("member-owned");
    });

    it('32. query visibility == "family" funciona para membro comum', async () => {
        const result = await assertSucceeds(
            getDocs(query(listsCollection(authDb(memberUid)), where("visibility", "==", "family"))),
        );
        expect(result.docs.map((snapshot) => snapshot.id)).toContain("family-visible");
    });

    it('33. query visibility == "public" funciona para membro comum', async () => {
        const result = await assertSucceeds(
            getDocs(query(listsCollection(authDb(memberUid)), where("visibility", "==", "public"))),
        );
        expect(result.docs.map((snapshot) => snapshot.id)).toContain("public-visible");
    });

    it("34. query collaborators array-contains uid funciona para membro comum", async () => {
        const result = await assertSucceeds(
            getDocs(query(listsCollection(authDb(collaboratorUid)), where("collaborators", "array-contains", collaboratorUid))),
        );
        expect(result.docs.map((snapshot) => snapshot.id)).toContain("collaborator-private");
    });

    it("35. query ampla de todas as listas falha para membro comum quando há lista privada sem acesso", async () => {
        await assertFails(getDocs(listsCollection(authDb(memberUid))));
    });
});
