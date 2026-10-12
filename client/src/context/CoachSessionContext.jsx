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
const PENDING_KEY = "workoutdb-coach-pending";
const PENDING_TTL_MS = 10 * 60 * 1000;

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

function readPending() {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.startedAt !== "number") {
      sessionStorage.removeItem(PENDING_KEY);
      return null;
    }
    if (Date.now() - parsed.startedAt > PENDING_TTL_MS) {
      sessionStorage.removeItem(PENDING_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writePending(row) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(row));
  } catch {
    /* ignore */
  }
}

/* A reload or app close aborts the in-flight ask, and its error path would
   clear the marker before the next page could read it. While the page is
   going away, keep it: the server is still finishing that answer. */
let pageLeaving = false;
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    pageLeaving = true;
  });
  window.addEventListener("beforeunload", () => {
    pageLeaving = true;
    /* If the unload is cancelled (another page's leave prompt), the page
       lives on and this timer puts things back. */
    window.setTimeout(() => {
      pageLeaving = false;
    }, 1500);
  });
  window.addEventListener("pageshow", () => {
    pageLeaving = false;
  });
}

function removePending() {
  if (pageLeaving) return;
  try {
    sessionStorage.removeItem(PENDING_KEY);
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
  const [pendingNote, setPendingNote] = useState(readPending);
  const abortRef = useRef(null);
  const streamIdRef = useRef(null);
  const answerStartIdRef = useRef(null);
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

  const markPending = useCallback((info) => {
    const conversationId =
      info && info.conversationId != null && Number(info.conversationId) > 0
        ? Number(info.conversationId)
        : null;
    const messageCount =
      info && Number.isInteger(info.messageCount) && info.messageCount >= 0 ? info.messageCount : 0;
    const question =
      info && typeof info.question === "string" ? info.question.replace(/\s+/g, " ").trim().slice(0, 120) : "";
    const row = { startedAt: Date.now(), conversationId, messageCount, question };
    writePending(row);
    setPendingNote(row);
  }, []);

  const clearPending = useCallback(() => {
    removePending();
    setPendingNote(null);
  }, []);

  const armAnswerStart = useCallback((id) => {
    const n = Number(id);
    answerStartIdRef.current = Number.isInteger(n) && n > 0 ? n : null;
  }, []);

  const consumeAnswerStart = useCallback((id) => {
    const armed = answerStartIdRef.current;
    if (armed == null) return false;
    const n = Number(id);
    if (!Number.isInteger(n) || n !== armed) return false;
    answerStartIdRef.current = null;
    return true;
  }, []);

  const noteAskFinished = useCallback((kind) => {
    if (kind === "ok") {
      const id = conversationIdRef.current;
      if (id != null) answerStartIdRef.current = id;
    }
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

  const noteAskDetached = useCallback(() => {
    setBar(IDLE_BAR);
  }, []);

  const clearSession = useCallback(
    ({ keepStatus = true } = {}) => {
      askGenRef.current += 1;
      loadGenRef.current += 1;
      abortRef.current?.abort();
      abortRef.current = null;
      streamIdRef.current = null;
      setThread([]);
      setStreaming(false);
      setCoverage(null);
      setHistoryError(null);
      setHistoryLoading(false);
      loadedIdRef.current = null;
      commitConversationId(null);
      setBar(IDLE_BAR);
      if (!keepStatus) {
        setStatus(null);
        removePending();
        setPendingNote(null);
      }
    },
    [commitConversationId]
  );

  useEffect(() => {
    function syncPending() {
      setPendingNote(readPending());
    }
    document.addEventListener("visibilitychange", syncPending);
    const timer = window.setInterval(syncPending, 15000);
    return () => {
      document.removeEventListener("visibilitychange", syncPending);
      window.clearInterval(timer);
    };
  }, []);

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
      streamIdRef,
      pendingNote,
      conversationIdRef,
      loadedIdRef,
      loadGenRef,
      askGenRef,
      bar,
      commitConversationId,
      noteAskStarted,
      noteAskFinished,
      noteAskDetached,
      markPending,
      clearPending,
      armAnswerStart,
      consumeAnswerStart,
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
      pendingNote,
      commitConversationId,
      noteAskStarted,
      noteAskFinished,
      noteAskDetached,
      markPending,
      clearPending,
      armAnswerStart,
      consumeAnswerStart,
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
