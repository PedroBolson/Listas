<div align="center">

# 🧾 Listas Infinity

Organização profissional para famílias, titulares e masters com autenticação Firebase, Vite + React 19, Tailwind 4, animações fluidas via Framer Motion e suporte completo a PT/EN.

</div>

## ✨ Visão Geral
- Interface pensada para planos comerciais (titular, convidados e master).
- Firebase Auth com e-mail/senha + espelhamento de usuários no Firestore preparado para billing e gestão de convites.
- Internacionalização com i18next (`pt-BR` e `en-US`) e troca de idioma em tempo real.
- Layout responsivo, modo dark persistente e design tokens modernos com Tailwind 4.
- Framer Motion em páginas, cards, botões e feedbacks para micro-interações consistentes.
- Catálogo de planos em POO (`SubscriptionPlan`) garantindo limites, perks e controles reutilizáveis.

## 🧱 Stack Principal
- ⚛️ **React 19** + TypeScript + Vite 7
- 🎨 **Tailwind CSS 4** com design tokens (cores, sombras e gradientes) e modo dark persistente
- 🔐 **Firebase** (Auth e Firestore) com bootstrap seguro para titulares e usuário master
- 🛤️ **React Router DOM 6** para fluxo multi-páginas
- 🌍 **i18next + react-i18next** com detector de idioma e localStorage
- 🕺 **Framer Motion** para transições e micro-animações
- 🗂️ **Lucide React** para iconografia consistente

## 🚀 Primeiros Passos
```bash
npm install
npm run dev
```

Abra `http://localhost:5173` para ver o app em modo desenvolvimento.

### Variáveis de ambiente (`.env`)
```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

> ❗️Sem esses valores o app alerta no console e as chamadas Firebase ficam inativas.

### Criar o primeiro usuário master
Para operar o backend com visão completa do negócio execute o script abaixo com as credenciais de uma conta de serviço do Firebase:

```bash
FIREBASE_PROJECT_ID="..." \
FIREBASE_CLIENT_EMAIL="service-account@project.iam.gserviceaccount.com" \
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n" \
MASTER_EMAIL="founder@listas.app" \
MASTER_PASSWORD="SenhaSegura123" \
MASTER_DISPLAY_NAME="Master Admin" \
npm run bootstrap:master
```

O script cria (ou promove) o usuário e garante o registro `users/{uid}` com papel `master`. Após esse bootstrap, utilize o login de e-mail e senha diretamente no app.

## 🗄️ Modelo de Dados (Firestore)

| Coleção | Campos principais | Observações |
|---------|-------------------|-------------|
| `users/{uid}` | `role`, `status`, `locale`, `titularId`, `families[]`, `billing`, timestamps | Documento é criado/atualizado automaticamente no primeiro login. |
| `families/{familyId}` | `ownerId`, `members[]`, `blockedMembers[]`, `metadata` | Cada titular possui ao menos uma família primária. |
| `families/{familyId}/lists/{listId}` | `visibility`, `permissions[]`, `collaborators[]`, timestamps | Somente titular pode excluir itens; convidados seguem permissões personalizadas. |
| `families/{familyId}/invites/{inviteId}` | `email`, `role`, `lists[]`, `status`, `expiresAt` | Suporta fluxo de convite com expiração. |
| `auditLogs/{logId}` | `actorId`, `action`, `target`, `context`, `createdAt` | Recomendado para trilhas de master e compliance. |

### Controles de acesso
- `master`: visão total do negócio, concede planos vitalícios, desvincula famílias, cria contas.
- `titular`: proprietário da família, gerencia convites, listas, billing e permissões.
- `member`: convidado com acesso restrito às listas compartilhadas pelo titular.
- Status `suspended` aciona `UpgradePrompt` oferecendo upgrade ou regularização.

## 🔐 Fluxo de autenticação
- Tela de acesso com formulário de **e-mail e senha** (login ou criação de conta titular).
- Envio de link de redefinição diretamente da UI.
- Ao se cadastrar como titular é criado o documento `users/{uid}` com papel `titular` e dados básicos; o master deve ser provisionado via script acima.

## 🎯 Limites de Plano
`SubscriptionPlan` encapsula regras de negócios, limites e vantagens:
- `seatsRemaining()`, `canCreateList()` e `canAddItem()` abstraem cálculos com limites ilimitados (`Infinity`) e estados de billing.
- Catálogo em `PLAN_CATALOG` com traduções (`plans.catalog.*`) para nome, descrição e perks.

## 🔏 Regras do Firestore
- Segurança centralizada em `firestore.rules` com helpers para `master`, `titular` e membros ativos.
- Usuários autenticados só atualizam o próprio documento (sem alterar papel/status); masters gerenciam toda a base.
- Famílias e listas exigem ser titular proprietário ou master; colaboradores só leem se estiverem na lista.
- Itens podem ser manipulados por masters ou titular dono da família, garantindo integridade dos planos.

## 🎨 Design System
- Tokens de cor definidos em `src/index.css` (`--color-bg`, `--color-surface`, `--shadow-soft`, etc.).
- Utilitários Tailwind customizados (`bg-surface`, `text-muted`, `bg-brand-gradient`, `glass-panel`).
- Toggle de tema (`ThemeProvider`) persiste preferência em localStorage (`listas.theme`).
- Componentes reutilizáveis (`Button`, `Card`, `Avatar`, `StatusPill`, `ProgressBar`) com animações sutis.

## 🌐 Internacionalização
- Arquivos `src/locales/pt/common.json` e `src/locales/en/common.json` mantêm todos os textos.
- `LanguageSwitcher` alterna idioma dinamicamente usando `i18next-browser-languagedetector`.
- Layout, cards, planos, status e mensagens de acesso usam `t(...)` garantindo 100% de cobertura textual.

## 📂 Estrutura Essencial
```
src/
├─ components/
│  ├─ layout/ (AppShell, Sidebar, TopBar, ThemeToggle, LanguageSwitcher, MobileNav)
│  ├─ ui/ (Button, Card, Avatar, ProgressBar, Spinner)
│  └─ feedback/ (StatusPill)
├─ domain/ (models, planCatalog)
├─ features/
│  ├─ auth/ (AuthProvider, AuthGate, useAuth)
│  ├─ billing/ (BillingPage)
│  ├─ dashboard/ (DashboardPage)
│  ├─ family/ (FamilyPage)
│  ├─ lists/ (ListsPage + ListCard)
│  ├─ master/ (MasterConsolePage)
│  └─ onboarding/ (UpgradePrompt)
├─ lib/ (firebase.ts, i18n.ts)
├─ providers/ (AppProviders, ThemeProvider)
└─ routes/ (AppRouter)
```

## 🛠️ Scripts
- `npm run dev` – desenvolvimento com HMR.
- `npm run build` – build de produção (compila TypeScript + Vite).
- `npm run preview` – serve build produzido.
- `npm run lint` – checagem baseada no ESLint padrão do template.

## ✅ Checklist de Funcionalidades
- [x] Autenticação Firebase com bootstrap de perfil no Firestore.
- [x] Layout responsivo com navegação desktop/mobile.
- [x] Catálogo de planos, limites e estado de billing.
- [x] Painel principal com métricas, atividades e cards animados.
- [x] Gestão de listas, convidados e permissões individuais.
- [x] Console Master com visão executiva e ações administrativas.
- [x] Modo Dark/Light persistente + i18n PT/EN + lucide icons em todo o app.

---

💡 **Próximos passos sugeridos**
1. Conectar Firestore real (CRUD de listas, convites e billing).
2. Adicionar camadas de formulário com validação (Zod/React Hook Form).
3. Criar páginas de billing real e integração com gateway (Stripe/Pagar.me).
4. Implementar testes unitários/E2E (Vitest + Playwright) para fluxos críticos.
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
