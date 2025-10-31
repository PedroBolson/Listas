# 🚀 Setup do Banco de Dados - Passo a Passo

## Método 1: Via Firebase Console (MAIS RÁPIDO) ⚡

### 1️⃣ Criar os Planos

1. Abra o [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto
3. Vá em **Firestore Database**
4. Clique em **Start collection**
5. Nome da coleção: `plans`

Agora crie 4 documentos:

#### Documento 1: `free`
```
Document ID: free

Fields:
- id: "free" (string)
- tier: "free" (string)
- name: "Plano Gratuito" (string)
- description: "Perfeito para começar" (string)
- translationKey: "plans.free" (string)
- monthlyPrice: 0 (number)
- yearlyPrice: 0 (number)
- currency: "BRL" (string)
- isUnlimited: false (boolean)
- limits: {
    families: 1 (number)
    familyMembers: 3 (number)
    listsPerFamily: 3 (number)
    itemsPerList: 50 (number)
    collaboratorsPerList: 2 (number)
  }
- perks: ["basic_features", "single_family"] (array)
- createdAt: (use Firestore server timestamp)
- updatedAt: (use Firestore server timestamp)
```

#### Documento 2: `plus`
```
Document ID: plus

Fields:
- id: "plus" (string)
- tier: "plus" (string)
- name: "Plano Plus" (string)
- description: "Para famílias maiores" (string)
- translationKey: "plans.plus" (string)
- monthlyPrice: 14.90 (number)
- yearlyPrice: 149.00 (number)
- currency: "BRL" (string)
- isUnlimited: false (boolean)
- limits: {
    families: 1 (number)
    familyMembers: 5 (number)
    listsPerFamily: 10 (number)
    itemsPerList: 100 (number)
    collaboratorsPerList: 5 (number)
  }
- perks: ["all_basic", "more_members", "more_lists"] (array)
- createdAt: (use Firestore server timestamp)
- updatedAt: (use Firestore server timestamp)
```

#### Documento 3: `premium`
```
Document ID: premium

Fields:
- id: "premium" (string)
- tier: "premium" (string)
- name: "Plano Premium" (string)
- description: "Recursos ilimitados" (string)
- translationKey: "plans.premium" (string)
- monthlyPrice: 29.90 (number)
- yearlyPrice: 299.00 (number)
- currency: "BRL" (string)
- isUnlimited: true (boolean)
- limits: {
    families: 15 (number)
    familyMembers: 50 (number)
    listsPerFamily: 200 (number)
    itemsPerList: 500 (number)
    collaboratorsPerList: 20 (number)
  }
- perks: ["unlimited_lists", "unlimited_items", "priority_support"] (array)
- createdAt: (use Firestore server timestamp)
- updatedAt: (use Firestore server timestamp)
```

#### Documento 4: `master`
```
Document ID: master

Fields:
- id: "master" (string)
- tier: "master" (string)
- name: "Plano Master" (string)
- description: "Acesso administrativo completo" (string)
- translationKey: "plans.master" (string)
- monthlyPrice: 0 (number)
- yearlyPrice: 0 (number)
- currency: "BRL" (string)
- isUnlimited: true (boolean)
- limits: {
    families: 999999 (number)
    familyMembers: 999999 (number)
    listsPerFamily: 999999 (number)
    itemsPerList: 999999 (number)
    collaboratorsPerList: 999999 (number)
  }
- perks: ["admin_access", "full_control", "unlimited_everything"] (array)
- createdAt: (use Firestore server timestamp)
- updatedAt: (use Firestore server timestamp)
```

---

### 2️⃣ Criar Configurações Globais

1. Na Firestore Database, clique em **Start collection**
2. Nome da coleção: `settings`

#### Documento: `global`
```
Document ID: global

Fields:
- id: "global" (string)
- defaultPlan: "free" (string)
- maintenanceMode: false (boolean)
- signupEnabled: true (boolean)
- inviteOnly: false (boolean)
- features: {
    collaboration: true (boolean)
    familySharing: true (boolean)
    notifications: false (boolean)
  }
- limits: {
    maxFamiliesPerUser: 15 (number)
    maxInvitesPerFamily: 50 (number)
  }
- updatedAt: (use Firestore server timestamp)
```

---

## Método 2: Via Firebase CLI (ALTERNATIVO)

Se preferir usar linha de comando:

```bash
# 1. Instale o Firebase CLI
npm install -g firebase-tools

# 2. Faça login
firebase login

# 3. Selecione seu projeto
firebase use --add

# 4. Importe os dados (crie um arquivo JSON com os planos)
firebase firestore:import plans.json
```

---

## ✅ Verificação

Após criar os planos, verifique no Firebase Console:

1. Vá em **Firestore Database**
2. Você deve ver 2 coleções:
   - `plans` (com 4 documentos: free, plus, premium, master)
   - `settings` (com 1 documento: global)

---

## 🎯 Próximo Passo: Criar Conta Master

Agora que o banco está configurado, você pode criar sua conta:

### Opção A: Via Firebase Console

1. Crie uma conta normal pelo app (vai criar como `titular` com plano `free`)
2. Pegue seu UID no Firebase Auth
3. Vá em **Firestore Database** → `users` → [seu UID]
4. Edite o documento:
   - `role: "master"` (string)
   - Adicione campo `props: { isMaster: true }` (map)
   - `billing.planId: "master"` (string)
5. Faça logout e login novamente

### Opção B: Via Script (requer Admin SDK configurado)

```javascript
// scripts/promote-to-master.mjs
import admin from 'firebase-admin';

// Configure o Admin SDK
admin.initializeApp({
  credential: admin.credential.cert('./serviceAccountKey.json')
});

const db = admin.firestore();

// Substitua pelo seu email
const email = 'seu-email@gmail.com';

async function promoteToMaster() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email).get();
  
  if (snapshot.empty) {
    console.log('❌ Usuário não encontrado');
    return;
  }
  
  const userDoc = snapshot.docs[0];
  await userDoc.ref.update({
    role: 'master',
    'props.isMaster': true,
    'billing.planId': 'master'
  });
  
  console.log('✅ Promovido a Master com sucesso!');
}

promoteToMaster();
```

---

## 🐛 Troubleshooting

### Erro: "Permission denied"
- Verifique se está autenticado no Firebase
- Verifique suas Firestore Rules (devem permitir criação de planos)

### Erro: "Project not found"
- Configure o projeto correto: `firebase use --add`
- Verifique o `.firebaserc`

### Planos não aparecem no app
- Limpe o cache do navegador
- Verifique o console do navegador por erros
- Confirme que os IDs dos documentos estão corretos (`free`, `plus`, `premium`, `master`)

---

## 📝 Checklist Final

- [ ] Coleção `plans` criada com 4 documentos
- [ ] Coleção `settings` criada com documento `global`
- [ ] Conta de usuário criada
- [ ] Conta promovida a Master
- [ ] Login feito com sucesso
- [ ] Dashboard abre sem erros
- [ ] Master Console está acessível

Se tudo estiver ✅, seu banco está pronto! 🎉
