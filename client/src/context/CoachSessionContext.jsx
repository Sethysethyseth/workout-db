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
import { useAuth } from "./AuthContext.jsx";

const ACTIVE_KEY = "workoutdb-coach-active-id";

const CoachSessionContext = createContext(null);

function readStoredConversationId() {
  try {
    const raw = sessionStorage.getItem(ACTIVE_KEY);
    if (raw && /^\d+$/.test(raw)) {
      const id = Number(raw);
      if (Number.isInteger(id) && id > 0) return id;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeStoredConversationId(id) {
  try {
    if (id == null) sessionStorage.removeItem(ACTIVE_KEY);
    else sessionStorage.setItem(ACTIVE_KEY, String(id));
  } catch {
    /* ignore */
  }
}

function clipQuestion(question) {
  const text = String(question ?? "").replace(/\s+/g, " ").trim();
  if (text.length <= 72) return text;
  return `${text.slice(0, 69)}...`;
}

const IDLE_BAR = { phase: null, snippet: "", beat: 0, dismissed: false };

function onCoachPath() {
  try {
    return window.location.pathname === "/coach";
  } catch {
    return false;
  }
}

export function CoachSessionProvider({ children }) {
  const { currentUser } = useAuth();
  const initialId = readStoredConversationId();
  const [thread, setThread] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [status, setStatus] = useState(null);
  const [coverage, setCoverage] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [conversationId, setConversationId] = useState(initialId);
  const [bar, setBar] = useState(IDLE_BAR);
  const abortRef = useRef(null);
  const conversationIdRef = useRef(initialId);
  const loadedIdRef = useRef(null);
  const loadGenRef = useRef(0);
  const askGenRef = useRef(0);
  const userId = currentUser?.id ?? null;
  const prevUserIdRef = useRef(undefined);

  const commitConversationId = useCallback((id) => {
    const next = id == null ? null : Number(id);
    const stored = Number.isInteger(next) && next > 0 ? next : null;
    conversationIdRef.current = stored;
    setConversationId(stored);
    writeStoredConversationId(stored);
  }, []);

  const noteAskStarted = useCallback((snippet) => {
    setBar({
      phase: "working",
      snippet: clipQuestion(snippet),
      beat: 0,
      dismissed: false,
    });
  }, []);

  const noteAskFinished = useCallback((kind) => {
    if (kind !== "ok" && kind !== "error") {
      setBar(IDLE_BAR);
      return;
    }
    if (onCoachPath()) {
      setBar(IDLE_BAR);
      return;
    }
    setBar((prev) => ({
      phase: kind === "error" ? "error" : "finished",
      snippet: prev.snippet,
      dismissed: false,
      beat: prev.beat + 1,
    }));
  }, []);

  const dismissBar = useCallback(() => {
    setBar((prev) => {
      if (prev.phase !== "finished" && prev.phase !== "error") return prev;
      return { ...prev, dismissed: true };
    });
  }, []);

  const clearSession = useCallback(
    ({ keepStatus = true } = {}) => {
      askGenRef.current += 1;
      loadGenRef.current += 1;
      abortRef.current?.abort();
      abortRef.current = null;
      setThread([]);
      setStreaming(false);
      setCoverage(null);
      setHistoryError(null);
      setHistoryLoading(false);
      loadedIdRef.current = null;
      commitConversationId(null);
      setBar(IDLE_BAR);
      if (!keepStatus) setStatus(null);
    },
    [commitConversationId]
  );

  useEffect(() => {
    const prev = prevUserIdRef.current;
    prevUserIdRef.current = userId;
    if (prev == null || userId != null) return;
    // Auth starts null, then the user arrives. Only a real logout (id -> null) drops the stream.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- abort and clear are one logout step
    clearSession({ keepStatus: false });
  }, [userId, clearSession]);

  const value = useMemo(
    () => ({
      thread,
      setThread,
      streaming,
      setStreaming,
      status,
      setStatus,
      coverage,
      setCoverage,
      historyLoading,
      setHistoryLoading,
      historyError,
      setHistoryError,
      conversationId,
      abortRef,
      conversationIdRef,
      loadedIdRef,
      loadGenRef,
      askGenRef,
      bar,
      commitConversationId,
      noteAskStarted,
      noteAskFinished,
      dismissBar,
      clearSession,
    }),
    [
      thread,
      streaming,
      status,
      coverage,
      historyLoading,
      historyError,
      conversationId,
      bar,
      commitConversationId,
      noteAskStarted,
      noteAskFinished,
      dismissBar,
      clearSession,
    ]
  );

  return <CoachSessionContext.Provider value={value}>{children}</CoachSessionContext.Provider>;
}

export function useCoachSession() {
  const ctx = useContext(CoachSessionContext);
  if (!ctx) throw new Error("useCoachSession must be used within CoachSessionProvider");
  return ctx;
}
