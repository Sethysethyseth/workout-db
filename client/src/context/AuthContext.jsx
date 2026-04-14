/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as authApi from "../api/authApi.js";
import { ApiError } from "../api/http.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  /** Bumped when a newer auth operation should win over in-flight /auth/me. */
  const authEpochRef = useRef(0);

  const refreshSession = useCallback(async () => {
    const epoch = ++authEpochRef.current;
    try {
      const data = await authApi.me();
      if (authEpochRef.current !== epoch) return data.user;
      setCurrentUser(data.user);
      return data.user;
    } catch (err) {
      if (authEpochRef.current !== epoch) {
        return null;
      }
      if (err instanceof ApiError && err.status === 401) {
        setCurrentUser(null);
        return null;
      }
      setCurrentUser(null);
      return null;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    let lastVisibleRefresh = 0;
    function onBecameVisible() {
      if (typeof document === "undefined" || document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - lastVisibleRefresh < 2500) return;
      lastVisibleRefresh = now;
      void refreshSession();
    }
    document.addEventListener("visibilitychange", onBecameVisible);
    window.addEventListener("pageshow", onBecameVisible);
    return () => {
      document.removeEventListener("visibilitychange", onBecameVisible);
      window.removeEventListener("pageshow", onBecameVisible);
    };
  }, [refreshSession]);

  useEffect(() => {
    function onUnauthorized() {
      setCurrentUser(null);
      setAuthLoading(false);
    }
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const data = await authApi.login({ email, password });
    authEpochRef.current += 1;
    setCurrentUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async ({ email, password }) => {
    const data = await authApi.register({ email, password });
    authEpochRef.current += 1;
    setCurrentUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    authEpochRef.current += 1;
    await authApi.logout();
    setCurrentUser(null);
  }, []);

  const value = useMemo(
    () => ({ currentUser, authLoading, login, register, logout, refreshSession }),
    [currentUser, authLoading, login, register, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

