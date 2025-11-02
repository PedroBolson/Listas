export type Locale = "pt" | "en";

export const USER_ROLE = {
  MASTER: "master",
  TITULAR: "titular",
  MEMBER: "member",
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];

export type AccountStatus = "active" | "grace_period" | "suspended" | "cancelled";

export interface FamilyLink {
  familyId: string;
  lists: string[];
  invitedBy?: string;
  joinedAt: string;
  removedAt?: string;
}

export interface BillingSnapshot {
  planId: string;
  status: AccountStatus;
  renewsAt?: string;
  cancelAt?: string;
  seats: {
    total: number;
    used: number;
  };
  invites: {
    total: number;
    used: number;
  };
  limits?: Partial<PlanLimits>;
  listsCreated?: number;
  itemsTracked?: number;
}

export interface PlanLimits {
  families: number;
  familyMembers: number;
  listsPerFamily: number;
  itemsPerList: number;
  collaboratorsPerList: number;
}

export interface SubscriptionPlanProps {
  id: string;
  tier: "free" | "plus" | "premium" | "master";
  name?: string; // Opcional - usar translationKey + i18n
  description?: string; // Opcional - usar translationKey + i18n
  translationKey: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: "BRL" | "USD";
  limits: PlanLimits;
  perks: string[];
  isUnlimited?: boolean;
}

export class SubscriptionPlan {
  readonly props: SubscriptionPlanProps;

  constructor(props: SubscriptionPlanProps) {
    this.props = {
      ...props,
      limits: { ...props.limits },
    };
  }

  get id() {
    return this.props.id;
  }

  get tier() {
    return this.props.tier;
  }

  get name() {
    return this.props.name;
  }

  get description() {
    return this.props.description;
  }

  get perks() {
    return [...this.props.perks];
  }

  get translationKey() {
    return this.props.translationKey;
  }

  get isUnlimited() {
    return Boolean(this.props.isUnlimited);
  }

  get limits() {
    return this.props.limits;
  }

  get monthlyPrice() {
    return this.props.monthlyPrice;
  }

  get yearlyPrice() {
    return this.props.yearlyPrice;
  }

  get currency() {
    return this.props.currency;
  }

  seatsRemaining(snapshot?: BillingSnapshot) {
    if (!snapshot) return this.limits.familyMembers;
    if (!Number.isFinite(snapshot.invites.total)) return Number.POSITIVE_INFINITY;
    return snapshot.invites.total - snapshot.invites.used;
  }

  canCreateList(snapshot?: BillingSnapshot) {
    if (this.isUnlimited) return true;
    if (!snapshot) return false;
    const limit = snapshot.limits?.listsPerFamily ?? this.limits.listsPerFamily;
    if (!Number.isFinite(limit)) return true;
    return (snapshot.listsCreated ?? 0) < limit;
  }

  canAddItem(snapshot?: BillingSnapshot) {
    if (this.isUnlimited) return true;
    if (!snapshot) return false;
    const limit = snapshot.limits?.itemsPerList ?? this.limits.itemsPerList;
    if (!Number.isFinite(limit)) return true;
    return (snapshot.itemsTracked ?? 0) < limit;
  }
}

export type ListVisibility = "private" | "shared" | "public";
export type ListType = "shopping" | "tasks";

export interface ListItemRecord {
  id: string;
  name: string;
  notes?: string;
  quantity?: number;
  checked: boolean;
  createdBy: string;
  createdAt: string;
  checkedAt?: string;
  checkedBy?: string;
}

export interface PermissionRule {
  userId: string;
  canCreateItems: boolean;
  canToggleItems: boolean;
  canDeleteItems: boolean;
}

export interface ListRecord {
  id: string;
  familyId: string;
  ownerId: string;
  name: string;
  description?: string;
  type?: ListType;
  visibility: ListVisibility;
  tags: string[];
  permissions: PermissionRule[];
  collaborators: string[];
  createdAt: string;
  updatedAt: string;
}

export type FamilyMembersMap = Record<string, FamilyMemberProfile>;

export interface FamilyRecord {
  id: string;
  name: string;
  ownerId: string;
  members: FamilyMembersMap;
  blockedMembers: string[];
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
}

export interface FamilyMemberProfile {
  userId: string;
  role: "owner" | "titular" | "collaborator" | "viewer"; // "titular" é valor legado, deve ser migrado para "owner"
  status: "active" | "removed" | "pending";
  joinedAt: string;
  removedAt?: string;
  allowedLists?: string[]; // IDs das listas que o Member pode visualizar (owner vê todas)
}

export interface DomainUserProps {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string | null;
  locale: Locale;
  role: UserRole;
  status: AccountStatus;
  titularId?: string;
  primaryFamilyId?: string;
  families: FamilyLink[];
  billing?: BillingSnapshot;
  createdAt: string;
  updatedAt: string;
  lastSignInAt?: string;
}

export class DomainUser {
  readonly props: DomainUserProps;

  constructor(props: DomainUserProps) {
    this.props = {
      ...props,
      families: props.families.map((family) => ({ ...family })),
    };
  }

  get id() {
    return this.props.id;
  }

  get role() {
    return this.props.role;
  }

  get status() {
    return this.props.status;
  }

  get billing() {
    return this.props.billing;
  }

  get families() {
    return [...this.props.families];
  }

  get activeFamilies() {
    const familiesFromArray = this.props.families.filter((family) => !family.removedAt);

    // Se tem primaryFamilyId (titular), adiciona ao array se não estiver lá
    if (this.props.primaryFamilyId) {
      const hasInArray = familiesFromArray.some(f => f.familyId === this.props.primaryFamilyId);
      if (!hasInArray) {
        // Adiciona a família primária no início
        return [
          {
            familyId: this.props.primaryFamilyId,
            lists: [],
            joinedAt: new Date().toISOString()
          },
          ...familiesFromArray
        ];
      }
    }

    return familiesFromArray;
  }

  get isActive() {
    return this.props.status === "active";
  }

  get displayName() {
    return this.props.displayName;
  }

  get email() {
    return this.props.email;
  }

  get photoURL() {
    return this.props.photoURL;
  }

  get isMaster() {
    return this.props.role === USER_ROLE.MASTER;
  }

  get isTitular() {
    // Master tem todos os privilégios de titular + mais
    return this.props.role === USER_ROLE.TITULAR || this.props.role === USER_ROLE.MASTER;
  }

  get isFamilyMemberOnly() {
    return this.props.role === USER_ROLE.MEMBER;
  }

  get managedFamilyId() {
    // Master também pode ter uma família ativa para trabalhar
    if (this.props.primaryFamilyId) return this.props.primaryFamilyId;

    const activeFamily = this.props.families.find((family) => !family.removedAt);
    return activeFamily?.familyId;
  }

  belongsToFamily(familyId: string) {
    return this.props.families.some((family) => family.familyId === familyId && !family.removedAt);
  }

  /**
   * Verifica se pode gerenciar família
   * ATENÇÃO: Este método retorna apenas estimativa baseada em primaryFamilyId
   * Para verificação precisa, use canManageFamilyFromRecord com o FamilyRecord
   */
  canManageFamily(familyId: string) {
    if (this.isMaster) return true;
    if (!this.isActive) return false;

    // Verificação básica por primaryFamilyId
    return this.props.primaryFamilyId === familyId;
  }

  /**
   * Verifica se pode gerenciar família usando o documento real da família
   * USAR ESTE MÉTODO para verificação precisa!
   */
  canManageFamilyFromRecord(family: FamilyRecord | null) {
    if (!family) return false;
    if (this.isMaster) return true;
    if (!this.isActive) return false;

    // Verifica se é o dono da família
    if (family.ownerId === this.id) {
      return true;
    }

    // Verifica o role específico no members da família
    const memberInfo = family.members[this.id];
    if (!memberInfo) {
      return false;
    }

    const isOwnerRole = memberInfo.role === "owner" || memberInfo.role === "titular";
    const isActive = memberInfo.status === "active";

    return isOwnerRole && isActive;
  } canManageList(list: ListRecord) {
    if (this.isMaster) return true;
    if (list.ownerId === this.id) return true;
    if (!this.isActive) return false;
    return list.permissions.some((permission) => permission.userId === this.id && permission.canDeleteItems);
  }

  permissionsForList(listId: string) {
    const matches = this.props.families.filter((family) => family.lists.includes(listId));
    return matches;
  }
}

export const COLLECTIONS = {
  USERS: "users",
  FAMILIES: "families",
  LISTS: "lists",
  INVITES: "invites",
  AUDIT: "auditLogs",
} as const;

export type InviteStatus = "pending" | "accepted" | "expired" | "revoked";
export type InviteType = "link" | "code";

export interface FamilyInviteRecord {
  id: string;
  familyId: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  status: InviteStatus;

  // Token e código
  token: string; // UUID único para o link
  code: string; // Código de 6 dígitos (case-insensitive)

  // Controle de uso
  maxUses: number; // 1 = uso único, 999 = ilimitado
  usedCount: number;

  // Quem aceitou
  acceptedBy: string[]; // Array de userIds

  // Metadados
  inviteType: InviteType;
  familyName?: string; // Cache do nome da família
}

export const SUBCOLLECTIONS = {
  FAMILY_LISTS: (familyId: string) => `families/${familyId}/lists`,
  FAMILY_INVITES: (familyId: string) => `families/${familyId}/invites`,
  LIST_ITEMS: (familyId: string, listId: string) => `families/${familyId}/lists/${listId}/items`,
} as const;

declare global {
  interface Window {
    __DEBUG_DOMAIN__?: {
      user?: DomainUserProps;
    };
  }
}
