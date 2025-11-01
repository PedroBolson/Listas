import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, collection } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { auth, db } from "../../lib/firebase";
import {
  COLLECTIONS,
  DomainUser,
  type DomainUserProps,
  USER_ROLE,
} from "../../domain/models";
import { AuthContext, type SignUpPayload } from "./AuthContext";

interface AuthProviderProps {
  children: ReactNode;
}

async function bootstrapDomainUser(user: User, overrides?: Partial<DomainUserProps>) {
  const ref = doc(db, COLLECTIONS.USERS, user.uid);
  const snapshot = await getDoc(ref);
  const now = new Date().toISOString();

  const existing = snapshot.exists() ? (snapshot.data() as DomainUserProps) : undefined;

  // 🔥 SE JÁ EXISTE, apenas retorna sem sobrescrever!
  if (existing) {
    return existing;
  }

  // Monta o objeto base SEM campos undefined
  const userData: any = {
    id: user.uid,
    email: overrides?.email ?? user.email ?? "",
    displayName: overrides?.displayName ?? user.displayName ?? "",
    photoURL: overrides?.photoURL ?? user.photoURL ?? null,
    locale: overrides?.locale ?? "pt",
    role: overrides?.role ?? USER_ROLE.TITULAR,
    status: overrides?.status ?? "active",
    families: overrides?.families ?? [],
    createdAt: now,
    updatedAt: now,
    lastSignInAt: now,
  };

  // Adiciona campos opcionais SOMENTE se existirem
  if (overrides?.titularId) {
    userData.titularId = overrides.titularId;
  }
  if (overrides?.primaryFamilyId) {
    userData.primaryFamilyId = overrides.primaryFamilyId;
  }
  if (overrides?.billing) {
    userData.billing = overrides.billing;
  }

  await setDoc(ref, userData);
  return userData as DomainUserProps;
}

function toDomainUser(props: DomainUserProps | undefined) {
  if (!props) return null;
  const domain = new DomainUser({
    ...props,
    updatedAt: props.updatedAt ?? props.createdAt,
  });
  if (typeof window !== "undefined") {
    window.__DEBUG_DOMAIN__ = {
      ...(window.__DEBUG_DOMAIN__ ?? {}),
      user: domain.props,
    };
  }
  return domain;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [domainUser, setDomainUser] = useState<DomainUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningUp, setIsSigningUp] = useState(false);

  const loadDomainProfile = useCallback(
    async (user: User | null) => {
      if (!user) {
        setDomainUser(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const profile = await bootstrapDomainUser(user);
        setDomainUser(toDomainUser(profile));
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Se estamos no meio de um signup, não carrega o profile ainda
      // O signUp vai fazer isso manualmente
      if (isSigningUp) {
        return;
      }
      setFirebaseUser(user);
      void loadDomainProfile(user);
    });

    return () => unsubscribe();
  }, [loadDomainProfile, isSigningUp]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        setFirebaseUser(result.user);
        await loadDomainProfile(result.user);
      } catch (error) {
        setLoading(false);
        throw error;
      }
    },
    [loadDomainProfile],
  );

  const signUp = useCallback(
    async ({ email, password, displayName, locale }: SignUpPayload) => {
      try {
        // IMPORTANTE: Marcar que estamos criando conta para o onAuthStateChanged não interferir
        setIsSigningUp(true);
        setLoading(true);

        const credentials = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(credentials.user, { displayName });
        }

        const now = new Date().toISOString();
        const familyRef = doc(collection(db, COLLECTIONS.FAMILIES));
        const familyId = familyRef.id;

        const familiesArray = [{
          familyId: familyId,
          lists: [],
          joinedAt: now,
        }];

        // PASSO 1: Criar o documento do usuário PRIMEIRO (para isTitular() funcionar nas rules)
        const userRef = doc(db, COLLECTIONS.USERS, credentials.user.uid);
        const userData: DomainUserProps = {
          id: credentials.user.uid,
          email,
          displayName: displayName ?? "",
          photoURL: null,
          locale: locale ?? "pt",
          role: USER_ROLE.TITULAR,
          status: "active",
          primaryFamilyId: familyId,
          families: familiesArray,
          billing: {
            planId: "free",
            status: "active",
            seats: {
              total: 3,
              used: 1,
            },
            invites: {
              total: 3,
              used: 0,
            },
          },
          createdAt: now,
          updatedAt: now,
          lastSignInAt: now,
        };

        // PASSO 1: Criar usuário PRIMEIRO
        await setDoc(userRef, userData);

        // PASSO 2: Criar família (isTitular() vai passar nas rules)
        await setDoc(familyRef, {
          id: familyId,
          name: `${displayName}'s Family`,
          ownerId: credentials.user.uid,
          createdAt: now,
          updatedAt: now,
          members: {
            [credentials.user.uid]: {
              name: displayName,
              email: email,
              role: "titular",
              status: "active",
              joinedAt: now,
            },
          },
        });

        // Atualiza o estado
        setFirebaseUser(credentials.user);
        setDomainUser(toDomainUser(userData));
        setLoading(false);
        setIsSigningUp(false);
      } catch (error) {
        setIsSigningUp(false);
        setLoading(false);
        throw error;
      }
    },
    [],
  );

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    setDomainUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!firebaseUser) return;
    await loadDomainProfile(firebaseUser);
  }, [firebaseUser, loadDomainProfile]);

  const value = useMemo(
    () => ({
      firebaseUser,
      domainUser,
      loading,
      signIn,
      signUp,
      resetPassword,
      signOut,
      refreshProfile,
    }),
    [firebaseUser, domainUser, loading, signIn, signUp, resetPassword, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
