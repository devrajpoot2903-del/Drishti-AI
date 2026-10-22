"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { UserSession, getStoredToken, setStoredToken, getStoredUser, setStoredUser, clearSession } from "./auth";
import { loginApi, fetchCurrentUserApi } from "./api";

interface AuthContextType {
  user: UserSession | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  switchAccount: (role: "SCRUTINY_OFFICER" | "INSTITUTION" | "ADMIN") => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: async () => {},
  switchAccount: async () => {},
  logout: () => {},
  isLoading: true
});

export const DEMO_ACCOUNTS = {
  SCRUTINY_OFFICER: { email: "demo-officer@aicte.gov.in", password: "DemoOfficer#AICTE2026!" },
  INSTITUTION: { email: "demo-institution@engg.edu", password: "DemoInst#AICTE2026!" },
  ADMIN: { email: "demo-admin@aicte.gov.in", password: "DemoAdmin#AICTE2026!" }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initAuth() {
      const existingToken = getStoredToken();
      const existingUser = getStoredUser();

      if (existingToken && existingUser) {
        try {
          // Verify with backend that stored session is active and valid
          const meRes = await fetchCurrentUserApi();
          if (meRes?.user) {
            setToken(existingToken);
            setUser(meRes.user);
            setStoredUser(meRes.user);
            setIsLoading(false);
            return;
          }
        } catch {
          console.warn("Stored session token is invalid or expired. Clearing session.");
          clearSession();
        }
      }

      // Do NOT automatically authenticate users as Scrutiny Officer
      setUser(null);
      setToken(null);
      setIsLoading(false);
    }

    initAuth();

    const handleSessionExpired = () => {
      console.warn("Session expired. Clearing session. User must log in again.");
      clearSession();
      setUser(null);
      setToken(null);
    };

    window.addEventListener("auth-session-expired", handleSessionExpired);
    return () => window.removeEventListener("auth-session-expired", handleSessionExpired);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await loginApi(email, password);
      setStoredToken(res.token);
      setStoredUser(res.user);
      setToken(res.token);
      setUser(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const switchAccount = async (role: "SCRUTINY_OFFICER" | "INSTITUTION" | "ADMIN") => {
    const creds = DEMO_ACCOUNTS[role];
    if (creds) {
      await login(creds.email, creds.password);
    }
  };

  const logout = () => {
    clearSession();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, switchAccount, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
