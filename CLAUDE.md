# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server at http://localhost:5173 (HMR enabled)
npm run build        # Type-check + Vite production build → dist/
npm run lint         # ESLint across all files
npm run preview      # Serve the production build locally
npm run test:rules   # Run Firestore security rules tests via Firebase emulators
npm run bootstrap:master  # Provision the first master user (requires env vars — see README)
```

To run a single test file:
```bash
npx vitest run tests/firestore.rules.test.ts
```

Firestore rules tests require the Firebase emulator to be running. The `test:rules` script handles this automatically via `firebase emulators:exec`.

## Architecture

### Layered structure

**Domain** (`src/domain/models.ts`) — the single source of truth for all types and business logic. Two main domain classes:
- `DomainUser` — wraps user props; exposes authorization methods (`isMaster`, `isTitular`, `canManageFamily`, `canManageList`, etc.) and computes `managedFamilyId` from localStorage.
- `SubscriptionPlan` — wraps plan props; exposes limit checks (`canCreateList`, `canAddItem`, `seatsRemaining`).

**Services** (`src/services/`) — plain async functions for Firestore CRUD. Real-time subscriptions return an `Unsubscribe` function from `onSnapshot`. Never import services directly in components; use hooks.

**Hooks** (`src/hooks/`) — React hooks that wrap services with `useState`/`useEffect` for real-time data (`useFamilyLists`, `useList`, `useListItems`, `useFamily`, `useInvites`). `usePermissions` combines `DomainUser` + `SubscriptionPlan` for UI-level access control.

**Providers** (`src/providers/`) — global context wrapped in order inside `AppProviders`:
```
I18nextProvider → ThemeProvider → AuthProvider → PlanProvider
```
`AuthProvider` manages Firebase Auth state and syncs/creates the Firestore user document on login.

**Features** (`src/features/`) — page-level components organized by domain (auth, billing, dashboard, family, invites, lists, master, onboarding, upgrade).

**Routes** (`src/routes/AppRouter.tsx`) — `createBrowserRouter` with a single nested layout (`AppLayout → AuthGate → AppShell`). `AnimatePresence` wraps `<Outlet>` for page transitions. Public routes: `/invite/:token`, `/onboarding/plan`.

### Firestore data model

All Firestore collection/subcollection paths are defined in `COLLECTIONS` and `SUBCOLLECTIONS` constants in `src/domain/models.ts`.

```
users/{uid}
families/{familyId}
  /lists/{listId}
    /items/{itemId}
  /invites/{inviteId}
plans/{planId}
settings/{settingId}
audit_logs/{logId}
```

`FamilyRecord.members` is a **map** keyed by `userId` (not an array). Lists are always scoped to a `familyId`.

### Role system

Three roles: `master > titular > member`. `DomainUser.isTitular` returns `true` for both `titular` and `master` roles. Members can read lists they are collaborators on but cannot create lists or invite others.

### Sign-up flow order

When a new user signs up, the `AuthProvider` must write the `users/{uid}` document **before** the `families/{familyId}` document. The Firestore `isTitular()` rule reads the user document, so this order is required for the create-family rule to pass.

### Active family selection

`DomainUser.managedFamilyId` reads `localStorage` under the key `listshub.selectedFamilyId` to determine which family is currently active. `FamilySelector` component writes to this key.

### Debugging

`window.__DEBUG_DOMAIN__.user` is populated in the browser console with the current `DomainUserProps` on every auth state change.

## Key conventions

- **i18n**: All user-facing strings go through `t(...)` from `react-i18next`. Translation files: `src/locales/pt/common.json` and `src/locales/en/common.json`. Plan names use `plans.catalog.*` keys.
- **Tailwind 4**: Design tokens (colors, shadows, gradients) defined as CSS variables in `src/index.css`. Custom utility classes: `bg-surface`, `text-muted`, `bg-brand-gradient`, `glass-panel`.
- **Animations**: Framer Motion for page transitions (`PageTransition`) and micro-interactions. Wrap new pages in `<PageTransition>`.
- **cn utility**: `src/utils/cn.ts` — use for conditional className merging.
- **No undefined in Firestore writes**: Filter out `undefined` values before writing documents, as Firestore rejects them.

## Environment variables

Copy `.env` and populate all `VITE_FIREBASE_*` keys. Missing keys are warned in the console but don't crash the app.
