import type { DomainUserProps, FamilyMemberProfile, UserRole } from "../domain/models";

function roleFromFamilyRole(role: FamilyMemberProfile["role"]): UserRole {
    return role === "owner" || role === "titular" ? "titular" : "member";
}

function statusFromFamilyStatus(status: FamilyMemberProfile["status"]): DomainUserProps["status"] {
    return status === "active" ? "active" : "suspended";
}

export function getMemberDisplayName(member: FamilyMemberProfile | undefined, fallback = "Usuário") {
    return member?.displayName || member?.name || member?.email || fallback;
}

export function getMemberEmail(member: FamilyMemberProfile | undefined) {
    return member?.email || "";
}

export function memberProfileToDomainUser(
    userId: string,
    member: FamilyMemberProfile | undefined,
): DomainUserProps {
    const now = new Date().toISOString();

    return {
        id: userId,
        email: getMemberEmail(member),
        displayName: getMemberDisplayName(member),
        photoURL: member?.photoURL ?? null,
        locale: "pt",
        role: member ? roleFromFamilyRole(member.role) : "member",
        status: member ? statusFromFamilyStatus(member.status) : "active",
        families: [],
        createdAt: member?.joinedAt ?? now,
        updatedAt: member?.removedAt ?? member?.joinedAt ?? now,
    };
}
