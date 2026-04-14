import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as sessionApi from "../api/sessionApi.js";
import { useAuth } from "./AuthContext.jsx";
import { pickLatestActiveSession } from "../lib/activeSession.js";

const ActiveSessionContext = createContext(null);

export function ActiveSessionProvider({ children }) {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastRefreshAtRef = useRef(0);

  const refresh = useCallback(async () => {
    if (!currentUser) {
      setSessions([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const mine = await sessionApi.getMySessions();
      const list = Array.isArray(mine.sessions) ? mine.sessions : [];
      setSessions(list);
      lastRefreshAtRef.current = Date.now();
    } catch (err) {
      setSessions([]);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!currentUser) return;
    const id = window.setInterval(() => {
      void refresh();
    }, 20000);
    return () => window.clearInterval(id);
  }, [currentUser, refresh]);

  const activeSession = useMemo(() => pickLatestActiveSession(sessions), [sessions]);

  const value = useMemo(
    () => ({
      sessions,
      activeSession,
      loading,
      error,
      refresh,
      lastRefreshAt: lastRefreshAtRef.current,
    }),
    [sessions, activeSession, loading, error, refresh]
  );

  return <ActiveSessionContext.Provider value={value}>{children}</ActiveSessionContext.Provider>;
}

export function useActiveSession() {
  const ctx = useContext(ActiveSessionContext);
  if (!ctx) throw new Error("useActiveSession must be used within an ActiveSessionProvider");
  return ctx;
}

