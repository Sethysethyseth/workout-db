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

  // Apply completions/deletions locally the moment the API call succeeds
  // (ids compared as strings - route params are strings, server ids are
  // ints), then re-fetch to reconcile. Without this the dashboard keeps
  // offering "resume" on a finished workout until the next 20s poll.
  useEffect(() => {
    function onSessionsChanged(event) {
      const { type, sessionId } = event?.detail || {};
      if (sessionId != null) {
        const idKey = String(sessionId);
        if (type === "completed") {
          setSessions((prev) =>
            prev.map((s) =>
              s && String(s.id) === idKey && !s.completedAt
                ? { ...s, completedAt: new Date().toISOString() }
                : s
            )
          );
        } else if (type === "deleted") {
          setSessions((prev) => prev.filter((s) => s && String(s.id) !== idKey));
        } else if (type === "reopened") {
          setSessions((prev) =>
            prev.map((s) =>
              s && String(s.id) === idKey && s.completedAt ? { ...s, completedAt: null } : s
            )
          );
        }
      }
      void refresh();
    }
    window.addEventListener(sessionApi.SESSIONS_CHANGED_EVENT, onSessionsChanged);
    return () => window.removeEventListener(sessionApi.SESSIONS_CHANGED_EVENT, onSessionsChanged);
  }, [refresh]);

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

