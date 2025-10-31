import { createContext } from "react";
import type { User } from "firebase/auth";
import { DomainUser, type Locale } from "../../domain/models";

export interface SignUpPayload {
  email: string;
  password: string;
  displayName: string;
  locale?: Locale;
}

export interface AuthContextValue {
  firebaseUser: User | null;
  domainUser: DomainUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (payload: SignUpPayload) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  domainUser: null,
  loading: true,
  signIn: async () => undefined,
  signUp: async () => undefined,
  resetPassword: async () => undefined,
  signOut: async () => undefined,
  refreshProfile: async () => undefined,
});
