"use client";

import type { UserDTO } from "@/dtos/user-dto";
import { useGet } from "@/hooks/use-api";
import { createContext, useContext, useEffect, useState } from "react";

export type AuthContextType = {
  user: UserDTO | null;
  loading: boolean;

  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;

  setUser: (user: UserDTO | null) => void;

  tempUserId: string | null;
  setTempUserId: (id: string | null) => void;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [tempUserId, setTempUserId] = useState<string | null>(null);

  const { refetch: refetchUser } = useGet<{ user: UserDTO }>("/api/users/me", {
    enabled: false,
  });

  async function fetchUser() {
    setLoading(true);

    try {
      const result = await refetchUser();

      if (result?.data?.user) {
        setUser(result.data.user);
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    } finally {
      window.location.href = "/login";
      setUser(null);
      setTempUserId(null);
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        logout,
        fetchUser,
        setUser,
        tempUserId,
        setTempUserId,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
