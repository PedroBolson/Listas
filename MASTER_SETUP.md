# Como Criar seu Usuário Master

## Opção 1: Via Script Node.js (Recomendado)

### Pré-requisitos
1. Ter o Node.js instalado
2. Ter uma conta Firebase com as credenciais de serviço

### Passos:

1. **Configure as variáveis de ambiente** no arquivo `.env` ou `.env.local`:

```env
# Firebase Admin SDK
FIREBASE_PROJECT_ID=seu-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSua chave privada aqui...\n-----END PRIVATE KEY-----\n"

# Master User
MASTER_EMAIL=seu-email@example.com
MASTER_PASSWORD=SuaSenhaSegura123!
MASTER_DISPLAY_NAME="Pedro Master"
```

2. **Execute o script**:

```bash
cd /Users/pedrobolson/Projects/Listas
node scripts/bootstrap-master.mjs
```

3. **Faça login** no app com o email e senha configurados

---

## Opção 2: Via Console Firebase (Mais Rápido)

### Passos:

1. **Crie sua conta normalmente** pelo app (sign up)

2. **Abra o Firebase Console**:
   - Acesse https://console.firebase.google.com
   - Selecione seu projeto "Listas"
   - Vá em "Firestore Database"

3. **Encontre seu documento de usuário**:
   - Coleção: `users`
   - Encontre o documento com seu email

4. **Edite o documento manualmente** e adicione/modifique os campos:

```json
{
  "email": "seu-email@example.com",
  "displayName": "Pedro Master",
  "role": "master",
  "status": "active",
  "props": {
    "isMaster": true,
    "primaryFamilyId": null
  },
  "billing": {
    "planId": "master",
    "status": "active",
    "subscribedAt": "2025-10-31T00:00:00.000Z"
  }
}
```

5. **Recarregue a página** do app

6. **Acesse o Master Console**:
   - URL: `http://localhost:5173/master`
   - Ou clique no menu lateral em "Master Console"

---

## Opção 3: Via CLI do Firebase

### Passos:

1. **Instale o Firebase CLI** (se ainda não tiver):
```bash
npm install -g firebase-tools
```

2. **Faça login**:
```bash
firebase login
```

3. **Execute comandos Firestore diretamente** via terminal ou crie um script personalizado.

---

## Funcionalidades Master Disponíveis

### No Master Console (/master):

1. **Dashboard de Estatísticas**:
   - Total de usuários
   - Titulares ativos
   - Total de famílias
   - Total de listas

2. **Gerenciamento de Planos**:
   - ✏️ Editar nome e descrição de cada plano
   - 💰 Alterar preços (monthlyPrice, yearlyPrice)
   - 🔢 Modificar limites (membros, listas, itens)
   - ∞ Definir valores ilimitados (deixar vazio ou Infinity)

3. **Gerenciamento de Usuários**:
   - 🔍 Buscar usuários por email ou nome
   - ✏️ Editar qualquer usuário:
     - Mudar role (member → titular → master)
     - Alterar status (active, suspended, cancelled)
     - Modificar plano do usuário
     - Atualizar status de pagamento

4. **Acesso Total**:
   - Ver todas as listas de todas as famílias
   - Editar qualquer dado no sistema
   - Sem restrições de limites

---

## Testando as Funcionalidades Master

### 1. Editar um Plano:
1. Acesse `/master`
2. Role até a seção "Planos"
3. Clique no ícone ✏️ de qualquer plano
4. Modifique os valores
5. Salve e veja as mudanças refletirem imediatamente

### 2. Editar um Usuário:
1. Acesse `/master`
2. Role até "Usuários"
3. Use a busca para encontrar um usuário
4. Clique em ✏️ no usuário
5. Altere role, status, plano
6. Salve

### 3. Promover Outro Usuário a Master:
1. Encontre o usuário na lista
2. Edite e mude role para "master"
3. O usuário terá acesso total ao sistema

---

## Troubleshooting

### Erro: "Acesso Negado"
- Verifique se o campo `props.isMaster` está como `true`
- Confirme que `role` está como `"master"`
- Recarregue a página completamente (Cmd+Shift+R)

### Erro ao Salvar Planos/Usuários
- Verifique as permissões do Firestore
- Certifique-se de que está usando o plano Blaze do Firebase
- Veja o console do navegador para erros específicos

### Limites não funcionam como esperado
- Para ilimitado, use `Infinity` ou deixe o campo vazio
- Para números finitos, use valores numéricos normais
- Após salvar, atualize a página para ver as mudanças

---

## Segurança

⚠️ **IMPORTANTE**:
- Mantenha suas credenciais Master seguras
- Não exponha o script ou variáveis de ambiente em repositórios públicos
- Considere adicionar autenticação 2FA para usuários Master
- Em produção, adicione logs de auditoria para ações Master
- Restrinja acesso ao console Firebase apenas para admins confiáveis

---

## Próximos Passos

Agora que você tem acesso Master, você pode:

1. ✅ Testar o fluxo completo do app
2. ✅ Ajustar preços e limites dos planos
3. ✅ Gerenciar usuários de teste
4. ✅ Configurar os planos finais para produção
5. ✅ Implementar as traduções (PT/EN)
6. ✅ Adicionar regras de segurança do Firestore
7. ✅ Implementar sistema de convites

**Divirta-se testando o sistema! 🚀**
