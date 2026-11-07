import { useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import type { User } from "../types";
import {
  AuthContext,
  type AuthContextValue,
  type SignupInput,
} from "./context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ user: User }>("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        const data = await api<{ user: User }>("/auth/login", {
          method: "POST",
          body: { email, password },
        });
        setUser(data.user);
      },
      signup: async (input: SignupInput) => {
        const data = await api<{ user: User }>("/auth/signup", {
          method: "POST",
          body: input,
        });
        setUser(data.user);
      },
      logout: async () => {
        try {
          await api("/auth/logout", { method: "POST" });
        } finally {
          setUser(null);
        }
      },
      changePassword: async (currentPassword, newPassword) => {
        const data = await api<{ user: User }>("/auth/change-password", {
          method: "POST",
          body: { currentPassword, newPassword },
        });
        setUser(data.user);
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
