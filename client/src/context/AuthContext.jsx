/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/authApi.js";
import { ApiError } from "../api/http.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const data = await authApi.me();
      setCurrentUser(data.user);
      return data.user;
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setCurrentUser(null);
        return null;
      }
      throw err;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession().catch(() => {
      setAuthLoading(false);
      setCurrentUser(null);
    });
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
    setCurrentUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async ({ email, password }) => {
    const data = await authApi.register({ email, password });
    setCurrentUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
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

