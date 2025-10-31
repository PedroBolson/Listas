# 🗄️ Arquitetura do Banco de Dados Firestore

## 📚 Collections Principais

### 1. `users` (Coleção raiz)
Armazena informações de cada usuário do sistema.

```typescript
{
  id: string;                    // UID do Firebase Auth
  email: string;
  displayName: string;
  photoURL: string | null;
  locale: "pt" | "en";
  role: "master" | "titular" | "member";
  status: "active" | "grace_period" | "suspended" | "cancelled";
  
  // Famílias do usuário (array de referências)
  families: [{
    familyId: string;             // ID da família
    lists: string[];              // IDs das listas que tem acesso nessa família
    invitedBy?: string;           // UID de quem convidou
    joinedAt: string;             // ISO timestamp
    removedAt?: string;           // ISO timestamp (se foi removido)
  }];
  
  // Para TITULARs - família principal onde é o dono
  primaryFamilyId?: string;
  
  // Para MEMBERs - referência ao titular que o convidou
  titularId?: string;
  
  // Informações de cobrança (apenas para TITULARs)
  billing?: {
    planId: string;               // Referência ao plano atual
    status: "active" | "grace_period" | "suspended" | "cancelled";
    renewsAt?: string;            // Próxima cobrança
    cancelAt?: string;            // Data de cancelamento
    seats: {
      total: number;              // Membros permitidos pelo plano
      used: number;               // Membros atualmente na família
    };
    invites: {
      total: number;              // Convites permitidos
      used: number;               // Convites enviados/pendentes
    };
    limits?: {                    // Limites customizados (overrides)
      familyMembers?: number;
      listsPerFamily?: number;
      itemsPerList?: number;
    };
    listsCreated?: number;        // Contador de listas criadas
    itemsTracked?: number;        // Contador de itens rastreados
  };
  
  createdAt: string;              // ISO timestamp
  updatedAt: string;              // ISO timestamp
  lastSignInAt: string;           // ISO timestamp
}
```

**Regras importantes:**
- `role: "titular"` → Pode criar famílias, tem billing, paga pelo plano
- `role: "member"` → É convidado, não paga, está em 1+ famílias
- `role: "master"` → Admin total, acesso a tudo, sem limites
- `families[]` → Lista de famílias que o usuário participa (como titular ou membro)
- `primaryFamilyId` → Para TITULARs, a família principal (primeira criada)

---

### 2. `families` (Coleção raiz)
Representa uma unidade familiar que agrupa usuários e listas.

```typescript
{
  id: string;                     // ID gerado pelo Firestore
  name: string;                   // "Família Silva", "Trabalho", etc
  ownerId: string;                // UID do titular dono
  
  // Membros da família
  members: {
    [userId: string]: {
      name: string;
      email: string;
      role: "titular" | "member"; // Dentro dessa família
      status: "active" | "pending" | "removed";
      joinedAt: string;
      invitedBy?: string;         // UID de quem convidou
      removedAt?: string;
    }
  };
  
  createdAt: string;
  updatedAt: string;
}
```

**Subcoleção: `families/{familyId}/lists`**
Listas pertencentes a essa família.

```typescript
{
  id: string;
  name: string;
  description?: string;
  ownerId: string;                // UID do criador
  
  // Quem pode ver/editar essa lista
  collaborators: string[];        // UIDs dos membros com acesso
  
  visibility: "family" | "collaborators";
  
  createdAt: string;
  updatedAt: string;
}
```

**Subcoleção: `families/{familyId}/lists/{listId}/items`**
Itens de uma lista específica.

```typescript
{
  id: string;
  name: string;
  quantity?: number;
  unit?: string;                  // "kg", "unidade", "litro", etc
  category?: string;
  notes?: string;
  
  status: "pending" | "completed";
  completedAt?: string;
  completedBy?: string;           // UID de quem marcou como completo
  
  addedBy: string;                // UID de quem adicionou
  
  createdAt: string;
  updatedAt: string;
}
```

**Subcoleção: `families/{familyId}/invites`**
Convites pendentes para essa família.

```typescript
{
  id: string;
  email: string;                  // Email do convidado
  invitedBy: string;              // UID do titular
  token: string;                  // Token único do convite
  status: "pending" | "accepted" | "expired" | "cancelled";
  expiresAt: string;
  
  createdAt: string;
  acceptedAt?: string;
}
```

---

### 3. `plans` (Coleção raiz)
Planos de assinatura disponíveis.

```typescript
{
  id: "free" | "plus" | "premium" | "master";
  tier: "free" | "plus" | "premium" | "master";
  name: string;
  description: string;
  translationKey: string;
  
  monthlyPrice: number;           // Em reais
  yearlyPrice: number;            // Em reais (com desconto)
  currency: "BRL" | "USD";
  
  limits: {
    families: number;             // Quantas famílias o titular pode criar
    familyMembers: number;        // Membros por família
    listsPerFamily: number;       // Listas por família
    itemsPerList: number;         // Itens por lista
    collaboratorsPerList: number; // Colaboradores por lista
  };
  
  perks: string[];                // Lista de benefícios
  isUnlimited: boolean;           // Se tem recursos infinitos
  
  createdAt: string;
  updatedAt: string;
}
```

**Planos padrão:**
- **Free**: 1 família, 3 membros, 3 listas, 20 itens/lista
- **Plus**: 1 família, 8 membros, 15 listas, 100 itens/lista - R$ 14,90/mês
- **Premium**: 3 famílias, ∞ membros, ∞ listas, ∞ itens - R$ 29,90/mês
- **Master**: ∞ tudo, acesso admin, grátis

---

### 4. `settings` (Coleção raiz)
Configurações globais do sistema (apenas Master pode editar).

```typescript
{
  id: "global";
  
  defaultPlan: string;            // ID do plano padrão ("free")
  maintenanceMode: boolean;
  signupEnabled: boolean;
  inviteOnly: boolean;            // Se apenas convites são permitidos
  
  features: {
    collaboration: boolean;
    familySharing: boolean;
    notifications: boolean;
  };
  
  limits: {
    maxFamiliesPerUser: number;   // Limite global
    maxInvitesPerFamily: number;
  };
  
  updatedAt: string;
}
```

---

### 5. `audit_logs` (Coleção raiz) - Opcional/Futuro
Logs de auditoria para ações importantes.

```typescript
{
  id: string;
  userId: string;                 // Quem fez a ação
  action: string;                 // "create_family", "edit_plan", etc
  resource: string;               // "family", "user", "plan"
  resourceId: string;             // ID do recurso afetado
  
  before?: object;                // Estado anterior
  after?: object;                 // Estado após
  
  ipAddress?: string;
  userAgent?: string;
  
  createdAt: string;
}
```

---

## 🔄 Fluxos Principais

### Fluxo 1: Criar Conta Nova (Sign Up)
1. Usuário preenche formulário
2. Cria conta no Firebase Auth
3. Cria documento em `users` com:
   - `role: "titular"`
   - `billing.planId: "free"`
   - `families: []` (vazio inicialmente)
4. **CRIA uma família automaticamente** em `families`
5. Atualiza `users.primaryFamilyId` e `users.families[]`
6. Adiciona o usuário em `families.members`

### Fluxo 2: Criar Lista
1. Usuário clica em "Criar Lista"
2. Verifica se tem `primaryFamilyId` (precisa ter família)
3. Verifica limites do plano (número de listas)
4. Cria documento em `families/{familyId}/lists`
5. Atualiza contador em `users.billing.listsCreated`

### Fluxo 3: Convidar Membro
1. Titular clica em "Convidar" na FamilyPage
2. Verifica limites do plano (seats disponíveis)
3. Cria documento em `families/{familyId}/invites`
4. Envia email com link: `/invite/{token}`
5. Quando aceito:
   - Cria conta (se não existir)
   - Adiciona em `families.members`
   - Atualiza `users.families[]` do membro
   - Atualiza `users.billing.seats.used` do titular

### Fluxo 4: Upgrade de Plano
1. Titular clica em "Upgrade" na BillingPage
2. Processa pagamento (integração futura)
3. Atualiza `users.billing.planId`
4. Atualiza limites em `users.billing.limits`
5. Libera features novas

---

## 📊 Queries Comuns

```typescript
// Buscar usuário por email
const userQuery = query(
  collection(db, "users"),
  where("email", "==", email)
);

// Buscar famílias de um usuário
const familiesQuery = query(
  collection(db, "families"),
  where(`members.${userId}`, "!=", null)
);

// Buscar listas de uma família
const listsQuery = collection(db, `families/${familyId}/lists`);

// Buscar itens de uma lista
const itemsQuery = collection(db, `families/${familyId}/lists/${listId}/items`);

// Buscar todos os planos
const plansQuery = collection(db, "plans");

// Buscar convites pendentes
const invitesQuery = query(
  collection(db, `families/${familyId}/invites`),
  where("status", "==", "pending")
);
```

---

## 🔒 Security Rules (Resumo)

```javascript
// users - pode ler próprio perfil, Master pode tudo
allow read: if isSelf(userId) || isMaster();
allow update: if isSelf(userId) || isMaster();

// families - membros podem ler, owner pode editar
allow read: if isFamilyMember(familyId) || isMaster();
allow update: if isFamilyOwner(familyId) || isMaster();

// lists - membros e colaboradores podem ler
allow read: if isFamilyMember(familyId) || isCollaborator(listId);
allow create, update: if isFamilyOwner(familyId);

// plans - todos podem ler, apenas Master edita
allow read: if signedIn();
allow write: if isMaster();
```

---

## 🚀 Como Executar o Seed

```bash
# 1. Configure as variáveis de ambiente (.env ou .env.local)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...

# 2. Execute o script
node scripts/seed-firestore.mjs

# 3. Aguarde a confirmação
# ✅ Os 4 planos serão criados
# ✅ Configurações globais serão criadas
```

---

## 📝 Próximos Passos

1. ✅ Execute `seed-firestore.mjs` para criar os planos
2. ✅ Crie uma conta nova (vai pegar Free automaticamente)
3. ✅ Promova sua conta a Master
4. ✅ Teste criar listas e convidar membros
5. ⬜ Implemente sistema de convites
6. ⬜ Adicione validações de limites
7. ⬜ Integração com gateway de pagamento
