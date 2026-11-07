import { createContext } from "react";
import type { User } from "../types";

export interface SignupInput {
  name: string;
  email: string;
  organizationName: string;
  password: string;
}

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: SignupInput) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
