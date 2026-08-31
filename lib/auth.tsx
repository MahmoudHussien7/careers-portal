"use client";

/**
 * Auth Provider and useAuth hook
 * Manages user state and authentication flow
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { tokenStore } from "./token";
import {
  login as dalLogin,
  logout as dalLogout,
  getMe as dalGetMe,
} from "./dal";
import { User } from "../types/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }

      const token = tokenStore.get();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await dalGetMe();
        setUser(response.data.user);
      } catch (error) {
        tokenStore.clearAll();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await dalLogin({ email, password });
    const { user: userData, accessToken, refreshToken } = response.data;

    tokenStore.set(accessToken);
    tokenStore.setRefreshToken(refreshToken);
    tokenStore.setUserId(userData.id);
    setUser(userData);
  };

  const logout = async () => {
    const rt = tokenStore.getRefreshToken();
    await dalLogout(rt);
    tokenStore.clearAll();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
