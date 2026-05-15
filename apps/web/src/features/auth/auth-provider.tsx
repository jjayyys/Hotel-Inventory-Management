"use client";

import {
  createContext,
  startTransition,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AuthSession } from "@/types/auth";
import {
  clearSession,
  getStoredSession,
  saveSession,
} from "@/services/auth-storage";

type AuthContextValue = {
  session: AuthSession | null;
  isReady: boolean;
  setSession: (session: AuthSession) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setSessionState(getStoredSession());
      setIsReady(true);
    });
  }, []);

  const setSession = (nextSession: AuthSession) => {
    saveSession(nextSession);
    setSessionState(nextSession);
  };

  const logout = () => {
    clearSession();
    setSessionState(null);
  };

  return (
    <AuthContext.Provider value={{ session, isReady, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
