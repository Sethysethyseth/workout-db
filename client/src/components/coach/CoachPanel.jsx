import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  CoachError,
  askCoachStream,
  coachErrorMessage,
  getCoachConversation,
  getCoachStatus,
} from "../../api/coachApi.js";
import { useCoachSession } from "../../context/CoachSessionContext.jsx";
import { purgeLegacyCoachKey } from "../../lib/coachKeyPref.js";
import { HELP_CHIPS, buildSuggestedQuestions } from "../../lib/coachSuggestions.js";
import { loadWeightUnit } from "../../lib/weightUnitPref.js";
import { AiWait } from "./AiWait.jsx";
import { CoachLeaveNote } from "./CoachLeaveNote.jsx";
import { CoachMarkdown } from "./CoachMarkdown.jsx";
import { CoachMarkIcon } from "./CoachMarkIcon.jsx";

/**
 * The in-app coach (ai-layer.md Lane B). Starts as one quiet row so it never
 * crowds the numbers; opens in place into a thread. Every answer streams,
 * and every answer is narration over the engine's numbers - the footer says
 * so, and the server enforces it.
 *
 * mode "ask": free questions about the analytics window in `range`.
 * mode "debrief": one workout (`focus.sessionId`), auto-asks on open.
 */

const UNAVAILABLE_COPY = {
  no_consent: {
    title: "AI access is off",
    body: "Turn it on to ask the coach. Only your computed summary is shared, never individual sets.",
  },
  no_key: {
    title: "The coach isn't set up on this server yet",
    body: "You can use your own Anthropic key from Profile, AI access. It's encrypted and stored on our server, never shown again.",
  },
  not_entitled: {
    title: "The coach isn't included for your account yet",
    body: "You can still use your own Anthropic key from Profile, AI access.",
  },
  bad_key_format: {
    title: "Your saved key doesn't look right",
    body: "Anthropic keys start with sk-ant-. Check it under Profile, AI access.",
  },
};

function formatRangeLabel(range) {
  if (!range?.from || !range?.to) return null;
  const fmt = (s) => {
    const d = new Date(`${s}T12:00:00`);
    if (Number.isNaN(d.getTime())) return s;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };
  return `${fmt(range.from)} to ${fmt(range.to)}`;
}

let nextMessageId = 1;
function makeMessage(role, content, extra = {}) {
  nextMessageId += 1;
  return { id: nextMessageId, role, content, ...extra };
}

/** Quiet one-liner when the stream ended because the token cap was hit. */
export function coachTruncationNotice(stopReason) {
  return stopReason === "max_tokens" ? "This answer was cut short." : null;
}

function formatNextQuestionTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${weekday} at ${time}`;
}

function weeklyCapRemainingCopy(weeklyCap) {
  if (!weeklyCap || weeklyCap.remaining <= 0) return null;
  return `${weeklyCap.remaining} of ${weeklyCap.limit} questions left this week`;
}

function weeklyCapUsedCopy(weeklyCap) {
  if (!weeklyCap || weeklyCap.remaining > 0) return null;
  const when = formatNextQuestionTime(weeklyCap.nextAvailableAt);
  if (when) return `You've used this week's questions. Your next question frees up ${when}.`;
  return "You've used this week's questions.";
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NewConversationIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SuggestMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 16.2 4.8 20l3.6-1.4A8.2 8.2 0 1 0 7 16.2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const PAGE_FOLLOW_PX = 64;

function nearPageBottom(el) {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= PAGE_FOLLOW_PX;
}

function pinPageBottom(el) {
  el.scrollTop = el.scrollHeight;
}

function lastRoleNode(el, role) {
  const nodes = el.querySelectorAll(`[data-coach-role="${role}"]`);
  return nodes.length > 0 ? nodes[nodes.length - 1] : null;
}

function intersectsViewport(container, node) {
  if (!node) return true;
  const c = container.getBoundingClientRect();
  const n = node.getBoundingClientRect();
  return n.bottom > c.top + 1 && n.top < c.bottom - 1;
}

/** After a send: the new user line stays on screen, and the answer's start does too. */
function placeAfterSend(el) {
  pinPageBottom(el);
  const userNode = lastRoleNode(el, "user");
  const answerNode = lastRoleNode(el, "assistant");
  if (!userNode) return;
  if (!intersectsViewport(el, userNode)) {
    const c = el.getBoundingClientRect();
    const u = userNode.getBoundingClientRect();
    el.scrollTop += u.bottom - c.bottom;
  }
  if (!answerNode) return;
  const c = el.getBoundingClientRect();
  const a = answerNode.getBoundingClientRect();
  if (a.top <= c.bottom - 8) return;
  const need = a.top - (c.bottom - 16);
  const u = userNode.getBoundingClientRect();
  const spare = u.bottom - c.top - 16;
  if (spare > 0) el.scrollTop += Math.min(need, spare);
}

/** A new answer while already following: show its start, not the tail of a long first paint. */
function placeAnswerStart(el) {
  const answerNode = lastRoleNode(el, "assistant");
  if (!answerNode || answerNode.offsetHeight <= el.clientHeight) {
    pinPageBottom(el);
    return;
  }
  const c = el.getBoundingClientRect();
  const a = answerNode.getBoundingClientRect();
  el.scrollTop += a.top - c.top;
}

export function CoachPanel({
  mode = "ask",
  range = null,
  weeks = null,
  focus = null,
  suggestions = [],
  collapsedLabel = "Ask about these numbers",
  autoAsk = null,
  defaultOpen = false,
  layout = "panel",
  resumeConversationId = null,
  onConversationId = null,
}) {
  const headingId = useId();
  const pageLayout = layout === "page";
  const session = useCoachSession();
  const [open, setOpen] = useState(defaultOpen || pageLayout);
  const [localStatus, setLocalStatus] = useState(null);
  const [statusError, setStatusError] = useState(null);
  const [localThread, setLocalThread] = useState([]);
  const [input, setInput] = useState("");
  const [localStreaming, setLocalStreaming] = useState(false);
  const [localCoverage, setLocalCoverage] = useState(null);
  const [localHistoryLoading, setLocalHistoryLoading] = useState(false);
  const [localHistoryError, setLocalHistoryError] = useState(null);
  const localAbortRef = useRef(null);
  const localConversationIdRef = useRef(null);
  const localLoadedIdRef = useRef(null);
  const localLoadGenRef = useRef(0);
  const autoAskedRef = useRef(false);
  const threadRef = useRef(null);
  const inputRef = useRef(null);
  const pendingQuestionRef = useRef(null);
  const pageAliveRef = useRef(true);
  const followRef = useRef(true);
  const prevCountRef = useRef(0);
  const prevTailRef = useRef("");
  const coldEndPinRef = useRef(null);

  const thread = pageLayout ? session.thread : localThread;
  const setThread = pageLayout ? session.setThread : setLocalThread;
  const streaming = pageLayout ? session.streaming : localStreaming;
  const setStreaming = pageLayout ? session.setStreaming : setLocalStreaming;
  const status = pageLayout ? session.status : localStatus;
  const setStatus = pageLayout ? session.setStatus : setLocalStatus;
  const coverage = pageLayout ? session.coverage : localCoverage;
  const setCoverage = pageLayout ? session.setCoverage : setLocalCoverage;
  const historyLoading = pageLayout ? session.historyLoading : localHistoryLoading;
  const setHistoryLoading = pageLayout ? session.setHistoryLoading : setLocalHistoryLoading;
  const historyError = pageLayout ? session.historyError : localHistoryError;
  const setHistoryError = pageLayout ? session.setHistoryError : setLocalHistoryError;
  const abortRef = pageLayout ? session.abortRef : localAbortRef;
  const conversationIdRef = pageLayout ? session.conversationIdRef : localConversationIdRef;
  const loadedIdRef = pageLayout ? session.loadedIdRef : localLoadedIdRef;
  const loadGenRef = pageLayout ? session.loadGenRef : localLoadGenRef;

  const historyBusy =
    pageLayout &&
    (historyLoading ||
      (resumeConversationId != null &&
        loadedIdRef.current !== resumeConversationId &&
        !historyError &&
        thread.length === 0 &&
        !streaming));

  useEffect(() => {
    purgeLegacyCoachKey();
  }, []);

  useEffect(() => {
    if (!open || status) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getCoachStatus();
        if (!cancelled) setStatus(data);
      } catch (err) {
        if (!cancelled) setStatusError(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, status]);

  useEffect(() => {
    pageAliveRef.current = true;
    return () => {
      pageAliveRef.current = false;
    };
  }, []);

  /* Sheet layouts still stop the stream when they unmount. The page layout
     keeps the controller in CoachSessionProvider so leaving /coach does not. */
  useEffect(() => {
    if (pageLayout) return undefined;
    const ref = localAbortRef;
    return () => {
      ref.current?.abort();
    };
  }, [pageLayout]);

  useEffect(() => {
    if (!pageLayout) return undefined;
    if (resumeConversationId == null) {
      setHistoryLoading(false);
      return undefined;
    }
    if (loadedIdRef.current === resumeConversationId) {
      setHistoryLoading(false);
      return undefined;
    }
    if (abortRef.current) {
      session.askGenRef.current += 1;
      abortRef.current.abort();
      abortRef.current = null;
      setStreaming(false);
      session.noteAskFinished("clear");
    }
    const gen = loadGenRef.current;
    let cancelled = false;
    setHistoryLoading(true);
    setHistoryError(null);
    getCoachConversation(resumeConversationId)
      .then((data) => {
        if (cancelled || gen !== loadGenRef.current) return;
        loadedIdRef.current = data.id;
        session.commitConversationId(data.id);
        setThread(
          (Array.isArray(data.messages) ? data.messages : []).map((message) =>
            makeMessage(message.role === "coach" ? "assistant" : "user", message.content)
          )
        );
        setCoverage(null);
      })
      .catch((err) => {
        if (cancelled || gen !== loadGenRef.current) return;
        loadedIdRef.current = null;
        setThread([]);
        setHistoryError(err);
      })
      .finally(() => {
        if (!cancelled && gen === loadGenRef.current) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [resumeConversationId, pageLayout]);

  const effectiveFocus = useMemo(() => {
    if (!pageLayout) return focus;
    if (status?.consentGranted) return { type: "general" };
    return { type: "help" };
  }, [pageLayout, focus, status]);

  const coachLadder = useMemo(() => {
    const reading =
      effectiveFocus && effectiveFocus.type === "help"
        ? "Checking the guide..."
        : "Reading your training...";
    return [
      { atMs: 400, text: "Thinking..." },
      { atMs: 8000, text: reading },
      { atMs: 20000, text: "Still working. The first question takes the longest." },
      { atMs: 45000, text: "Almost there." },
    ];
  }, [effectiveFocus]);

  const pageChips = useMemo(() => {
    if (!pageLayout || !status) return [];
    if (status.consentGranted) {
      return [...buildSuggestedQuestions(null).slice(0, 2), ...HELP_CHIPS.slice(0, 2)];
    }
    return HELP_CHIPS.slice();
  }, [pageLayout, status]);

  const scopeLabel = useMemo(() => {
    if (mode === "debrief") return "Reading this workout against your last four weeks";
    if (focus && focus.type === "block") return "Reading this block against your recent training";
    const span = formatRangeLabel(range);
    if (weeks && span) return `Reading ${weeks} weeks, ${span}`;
    if (span) return `Reading ${span}`;
    return "Reading your recent training";
  }, [mode, range, weeks, focus]);

  const ask = useCallback(
    async (questionRaw) => {
      const question = String(questionRaw ?? "").trim();
      if (!question || streaming || historyBusy) return;
      if (status?.weeklyCap && status.weeklyCap.remaining <= 0) return;
      const history = thread
        .filter((m) => !m.error && !m.pending && m.content)
        .slice(-12)
        .map((m) => ({
          role: m.role === "coach" ? "assistant" : m.role,
          content: m.content,
        }));
      const userMsg = makeMessage("user", question);
      const pending = makeMessage("assistant", "", { pending: true });
      setThread((prev) => [...prev, userMsg, pending]);
      setInput("");
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;
      const gen = pageLayout ? (session.askGenRef.current += 1) : 0;
      if (pageLayout) session.noteAskStarted(question);
      let outcome = "clear";
      try {
        const result = await askCoachStream({
          question,
          range: mode === "debrief" ? null : range,
          unit: loadWeightUnit(),
          focus: effectiveFocus,
          history,
          conversationId: conversationIdRef.current,
          signal: controller.signal,
          onMeta: (meta) => {
            if (meta && meta.effortCoverage !== undefined) setCoverage(meta.effortCoverage);
            if (meta && meta.conversationId != null) {
              const id = Number(meta.conversationId);
              if (Number.isInteger(id) && id > 0) {
                loadedIdRef.current = id;
                if (pageLayout) session.commitConversationId(id);
                else conversationIdRef.current = id;
                if (pageAliveRef.current) onConversationId?.(id);
              }
            }
          },
          onDelta: (_piece, full) => {
            setThread((prev) =>
              prev.map((m) => (m.id === pending.id ? { ...m, content: full } : m))
            );
          },
        });
        setThread((prev) =>
          prev.map((m) =>
            m.id === pending.id
              ? { ...m, pending: false, stopReason: result.stopReason ?? null }
              : m
          )
        );
        if (status?.weeklyCap) {
          try {
            const next = await getCoachStatus();
            setStatus(next);
          } catch {
            setStatus((prev) => {
              if (!prev?.weeklyCap) return prev;
              const used = prev.weeklyCap.used + 1;
              const remaining = Math.max(0, prev.weeklyCap.limit - used);
              return {
                ...prev,
                weeklyCap: { ...prev.weeklyCap, used, remaining },
              };
            });
          }
        }
        outcome = "ok";
      } catch (err) {
        if (err && err.name === "AbortError") return;
        if (err instanceof CoachError && err.code === "weekly_limit") {
          outcome = "drop";
          setStatus((prev) => ({
            ...(prev || {}),
            weeklyCap: {
              limit: err.limit ?? prev?.weeklyCap?.limit ?? null,
              used: err.used ?? prev?.weeklyCap?.used ?? null,
              remaining: 0,
              nextAvailableAt: err.nextAvailableAt ?? prev?.weeklyCap?.nextAvailableAt ?? null,
            },
          }));
          setThread((prev) => prev.filter((m) => m.id !== pending.id && m.id !== userMsg.id));
          return;
        }
        const message =
          err instanceof CoachError ? err.message : coachErrorMessage("provider_error");
        setThread((prev) =>
          prev.map((m) => (m.id === pending.id ? { ...m, pending: false, error: message } : m))
        );
        outcome = "error";
      } finally {
        const stale = pageLayout && session.askGenRef.current !== gen;
        if (!stale) {
          if (abortRef.current === controller) abortRef.current = null;
          setStreaming(false);
          if (pageLayout && outcome === "ok") session.noteAskFinished("ok");
          else if (pageLayout && outcome === "error") session.noteAskFinished("error");
          else if (pageLayout && outcome === "drop") session.noteAskFinished("clear");
        }
      }
    },
    [streaming, historyBusy, thread, mode, range, effectiveFocus, status, onConversationId, pageLayout, session]
  );

  useEffect(() => {
    if (!open || !autoAsk || autoAskedRef.current) return;
    if (!status || !status.available) return;
    if (status.weeklyCap && status.weeklyCap.remaining <= 0) return;
    autoAskedRef.current = true;
    void ask(autoAsk);
  }, [open, autoAsk, status, ask]);

  useLayoutEffect(() => {
    const el = threadRef.current;
    const last = thread[thread.length - 1];
    const tailKey = last ? `${last.id}:${last.content ? 1 : 0}` : "";
    const firstWords =
      Boolean(last && last.role !== "user" && last.content) &&
      prevTailRef.current === `${last.id}:0`;
    prevTailRef.current = tailKey;

    if (!el || thread.length === 0) {
      prevCountRef.current = 0;
      followRef.current = true;
      prevTailRef.current = "";
      return;
    }
    if (!pageLayout) {
      el.scrollTop = el.scrollHeight;
      prevCountRef.current = thread.length;
      return;
    }
    const prev = prevCountRef.current;
    const appended = thread.length - prev;
    prevCountRef.current = thread.length;
    const added = appended > 0 ? thread.slice(thread.length - appended) : [];
    const sent = prev > 0 && added.some((m) => m.role === "user");
    const answerStarted = prev > 0 && !sent && added.some((m) => m.role !== "user");

    if (prev === 0) {
      pinPageBottom(el);
      followRef.current = nearPageBottom(el);
      return;
    }
    if (sent) {
      placeAfterSend(el);
      followRef.current = nearPageBottom(el);
      return;
    }
    if ((answerStarted || firstWords) && followRef.current) {
      placeAnswerStart(el);
      followRef.current = nearPageBottom(el);
      return;
    }
    if (followRef.current) pinPageBottom(el);
  }, [thread, pageLayout]);

  // Cold load of /coach?c=id: the layout pin runs before fonts settle, so the
  // last lines sit below the fold. Pin again on the next frame and after
  // fonts are ready. Later sends keep qolf2's follow and don't-yank rules.
  useEffect(() => {
    if (!pageLayout || historyLoading) return undefined;
    if (resumeConversationId == null) {
      coldEndPinRef.current = null;
      return undefined;
    }
    if (thread.length === 0) return undefined;
    if (loadedIdRef.current !== resumeConversationId) return undefined;
    if (coldEndPinRef.current === resumeConversationId) return undefined;
    coldEndPinRef.current = resumeConversationId;

    let cancelled = false;

    function pin() {
      if (cancelled) return;
      const node = threadRef.current;
      if (!node) return;
      pinPageBottom(node);
      followRef.current = nearPageBottom(node);
    }

    const frame = requestAnimationFrame(pin);
    let fontsFrame = 0;
    const fontsReady = typeof document !== "undefined" ? document.fonts?.ready : null;
    if (fontsReady && typeof fontsReady.then === "function") {
      fontsReady.then(() => {
        if (cancelled) return;
        fontsFrame = requestAnimationFrame(pin);
      });
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      if (fontsFrame) cancelAnimationFrame(fontsFrame);
    };
  }, [pageLayout, historyLoading, resumeConversationId, thread]);

  function onPageScroll() {
    const el = threadRef.current;
    if (!el) return;
    followRef.current = nearPageBottom(el);
  }

  function openWith(question) {
    setOpen(true);
    if (question) {
      // Status loads on open; the ask waits for it via the effect below.
      pendingQuestionRef.current = question;
    }
  }

  useEffect(() => {
    if (!open || !status?.available || !pendingQuestionRef.current) return;
    if (status.weeklyCap && status.weeklyCap.remaining <= 0) return;
    const q = pendingQuestionRef.current;
    pendingQuestionRef.current = null;
    void ask(q);
  }, [open, status, ask]);

  function onSubmit(e) {
    e.preventDefault();
    void ask(input);
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void ask(input);
    }
  }

  function onInputChange(e) {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function stop() {
    if (pageLayout) session.askGenRef.current += 1;
    abortRef.current?.abort();
    setThread((prev) => prev.map((m) => (m.pending ? { ...m, pending: false } : m)));
    setStreaming(false);
    if (pageLayout) session.noteAskFinished("clear");
  }

  function reset() {
    autoAskedRef.current = false;
    if (pageLayout) {
      session.clearSession();
      onConversationId?.(null);
      inputRef.current?.focus();
      return;
    }
    loadGenRef.current += 1;
    stop();
    setThread([]);
    setCoverage(null);
    setHistoryError(null);
    setHistoryLoading(false);
    conversationIdRef.current = null;
    loadedIdRef.current = null;
    onConversationId?.(null);
    inputRef.current?.focus();
  }

  if (!pageLayout && !open) {
    return (
      <div className={`coach-launch-wrap${mode === "debrief" ? " coach-launch-wrap--debrief" : ""}`}>
        <button type="button" className="coach-launch" onClick={() => openWith(null)}>
          <span className="coach-launch__crown" aria-hidden="true" />
          <span className="coach-launch__text">
            <span className="coach-launch__name">Coach</span>
            <span className="coach-launch__label">{collapsedLabel}</span>
          </span>
          <span className="coach-launch__chevron" aria-hidden="true" />
        </button>
        {suggestions.length > 0 ? (
          <div className="coach-chips coach-chips--launch" aria-label="Suggested questions">
            {suggestions.map((q) => (
              <button
                key={q}
                type="button"
                className="coach-chip"
                onClick={() => openWith(q)}
              >
                {q}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  const helpAvailable = Boolean(status?.help?.available);
  const trainingAvailable = Boolean(status?.available);
  const unavailableReason = !status
    ? null
    : pageLayout
      ? helpAvailable || trainingAvailable
        ? null
        : status.reason || "no_key"
      : !status.available
        ? status.reason || "no_key"
        : null;
  const unavailable = unavailableReason ? UNAVAILABLE_COPY[unavailableReason] || UNAVAILABLE_COPY.no_key : null;
  const weeklyCap = status?.weeklyCap ?? null;
  const capped = Boolean(weeklyCap && weeklyCap.remaining <= 0);
  const remainingCopy = weeklyCapRemainingCopy(weeklyCap);
  const usedCopy = weeklyCapUsedCopy(weeklyCap);
  const showComposer =
    Boolean(status) && !unavailable && !statusError && !historyBusy && !historyError;

  function renderWait() {
    if (pageLayout) {
      return (
        <div className="coach-page-wait">
          <span className="coach-page-wait__dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <AiWait variant="status" verb="Thinking..." ladder={coachLadder} />
        </div>
      );
    }
    return <AiWait variant="block" verb="Thinking..." ladder={coachLadder} />;
  }

  function renderThread() {
    return thread.map((m) =>
      m.role === "user" ? (
        <div key={m.id} className="coach-msg coach-msg--user" data-coach-role="user">
          {m.content}
        </div>
      ) : pageLayout ? (
        <div key={m.id} className="coach-page-reply" data-coach-role="assistant">
          <p className="coach-page-reply__who">
            <span className="coach-msg__crown" aria-hidden="true" />
            <span>Coach</span>
          </p>
          <div className="coach-page-reply__body">
            {m.content ? <CoachMarkdown text={m.content} /> : null}
            {m.pending && !m.content ? renderWait() : m.pending ? (
              <span className="coach-caret" aria-label="The coach is writing" />
            ) : null}
            {coachTruncationNotice(m.stopReason) ? (
              <p className="coach-msg__truncated">{coachTruncationNotice(m.stopReason)}</p>
            ) : null}
            {m.error ? <p className="coach-msg__error">{m.error}</p> : null}
          </div>
        </div>
      ) : (
        <div key={m.id} className="coach-msg coach-msg--coach">
          <span className="coach-msg__crown" aria-hidden="true" />
          <div className="coach-msg__body">
            {m.content ? <CoachMarkdown text={m.content} /> : null}
            {m.pending && !m.content ? renderWait() : m.pending ? (
              <span className="coach-caret" aria-label="The coach is writing" />
            ) : null}
            {coachTruncationNotice(m.stopReason) ? (
              <p className="coach-msg__truncated">{coachTruncationNotice(m.stopReason)}</p>
            ) : null}
            {m.error ? <p className="coach-msg__error">{m.error}</p> : null}
          </div>
        </div>
      )
    );
  }

  if (pageLayout) {
    return (
      <section className="coach-page__panel" aria-labelledby={headingId}>
        <header className="coach-page__head">
          <h1 id={headingId} className="coach-page__title">
            Coach
          </h1>
          <button type="button" className="coach-page__new" aria-label="New conversation" onClick={reset}>
            <NewConversationIcon />
          </button>
        </header>
        <CoachLeaveNote />

        <div className="coach-page__scroll" ref={threadRef} onScroll={onPageScroll}>
          {historyBusy ? (
            <div className="coach-panel__notice muted small coach-panel__notice--loading">
              <span className="barbell barbell--inline" aria-hidden="true">
                <span className="barbell__bar" />
                <span className="barbell__plate barbell__plate--l2" />
                <span className="barbell__plate barbell__plate--l1" />
                <span className="barbell__plate barbell__plate--r1" />
                <span className="barbell__plate barbell__plate--r2" />
              </span>
              Opening that conversation…
            </div>
          ) : historyError ? (
            <div className="coach-panel__notice">
              <p className="coach-panel__notice-title">That conversation isn&apos;t available</p>
              <p className="muted small" style={{ margin: 0 }}>
                It may have been deleted. Start a new one with the button above.
              </p>
            </div>
          ) : thread.length > 0 ? (
            <div className="coach-thread coach-page__thread" role="log" aria-live="polite">
              {renderThread()}
            </div>
          ) : statusError ? (
            <p className="coach-panel__notice muted small">{coachErrorMessage("network")}</p>
          ) : !status ? (
            <div className="coach-panel__notice muted small coach-panel__notice--loading">
              <span className="barbell barbell--inline" aria-hidden="true">
                <span className="barbell__bar" />
                <span className="barbell__plate barbell__plate--l2" />
                <span className="barbell__plate barbell__plate--l1" />
                <span className="barbell__plate barbell__plate--r1" />
                <span className="barbell__plate barbell__plate--r2" />
              </span>
              Checking the coach…
            </div>
          ) : unavailable ? (
            <div className="coach-panel__notice">
              <p className="coach-panel__notice-title">{unavailable.title}</p>
              <p className="muted small" style={{ margin: 0 }}>
                {unavailable.body} <Link to="/profile/ai">Open AI access</Link>
              </p>
            </div>
          ) : (
            <div className="coach-page__intro">
              <div className="coach-page__mark" aria-hidden="true">
                <CoachMarkIcon />
              </div>
              <p className="coach-page__lead">
                Ask about your training, or how to do something in LogChamp.
              </p>
              {!capped && pageChips.length > 0 ? (
                <div className="coach-page-suggest" aria-label="Suggested questions">
                  {pageChips.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className="coach-page-suggest__row"
                      onClick={() => void ask(q)}
                    >
                      <span className="coach-page-suggest__mark" aria-hidden="true">
                        <SuggestMark />
                      </span>
                      <span>{q}</span>
                    </button>
                  ))}
                </div>
              ) : null}
              {!status.consentGranted ? (
                <p className="coach-page__access muted">
                  <Link to="/profile/ai">Turn on AI access</Link> to ask about your own numbers.
                </p>
              ) : null}
            </div>
          )}
          {thread.length > 0 && unavailable ? (
            <p className="coach-panel__notice muted small">
              {unavailable.body} <Link to="/profile/ai">Open AI access</Link>
            </p>
          ) : null}
        </div>

        {showComposer ? (
          <form className="coach-page__composer" onSubmit={onSubmit}>
            {remainingCopy ? <p className="coach-page__cap muted small">{remainingCopy}</p> : null}
            {usedCopy ? <p className="coach-page__cap muted small">{usedCopy}</p> : null}
            <div className="coach-page__composer-row">
              <textarea
                ref={inputRef}
                className="coach-page__input"
                rows={1}
                value={input}
                placeholder="Ask the coach"
                aria-label="Ask the coach"
                onChange={onInputChange}
                onKeyDown={onKeyDown}
                disabled={streaming || capped}
              />
              {streaming ? (
                <button
                  type="button"
                  className="coach-page__send coach-page__send--stop"
                  aria-label="Stop"
                  onClick={stop}
                >
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  className="coach-page__send"
                  aria-label="Send"
                  disabled={capped || !input.trim()}
                >
                  <SendIcon />
                </button>
              )}
            </div>
          </form>
        ) : null}
      </section>
    );
  }

  return (
    <section className="card card--notched coach-panel" aria-labelledby={headingId}>
      <header className="coach-panel__head">
        <div className="coach-panel__title">
          <span className="coach-panel__crown" aria-hidden="true" />
          <h2 id={headingId} className="coach-panel__name">
            Coach
          </h2>
          <span className="coach-panel__badge">beta</span>
        </div>
        <p className="coach-panel__scope muted small">{scopeLabel}</p>
        <div className="coach-panel__actions">
          {thread.length > 0 ? (
            <button type="button" className="coach-panel__action" onClick={reset}>
              New chat
            </button>
          ) : null}
          <button
            type="button"
            className="coach-panel__action coach-panel__close"
            aria-label="Close coach"
            onClick={() => {
              stop();
              setOpen(false);
            }}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
      </header>

      {statusError ? (
        <p className="coach-panel__notice muted small">
          {coachErrorMessage("network")}
        </p>
      ) : !status ? (
        <div className="coach-panel__notice muted small coach-panel__notice--loading">
          <span className="barbell barbell--inline" aria-hidden="true">
            <span className="barbell__bar" />
            <span className="barbell__plate barbell__plate--l2" />
            <span className="barbell__plate barbell__plate--l1" />
            <span className="barbell__plate barbell__plate--r1" />
            <span className="barbell__plate barbell__plate--r2" />
          </span>
          Checking the coach…
        </div>
      ) : unavailable ? (
        <div className="coach-panel__notice">
          <p className="coach-panel__notice-title">{unavailable.title}</p>
          <p className="muted small" style={{ margin: 0 }}>
            {unavailable.body}{" "}
            <Link to="/profile/ai">Open AI access</Link>
          </p>
        </div>
      ) : (
        <>
          {thread.length > 0 ? (
            <div className="coach-thread" role="log" aria-live="polite" ref={threadRef}>
              {thread.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="coach-msg coach-msg--user">
                    {m.content}
                  </div>
                ) : (
                  <div key={m.id} className="coach-msg coach-msg--coach">
                    <span className="coach-msg__crown" aria-hidden="true" />
                    <div className="coach-msg__body">
                      {m.content ? <CoachMarkdown text={m.content} /> : null}
                      {m.pending && !m.content ? (
                        <AiWait variant="block" verb="Thinking..." ladder={coachLadder} />
                      ) : m.pending ? (
                        <span className="coach-caret" aria-label="The coach is writing" />
                      ) : null}
                      {coachTruncationNotice(m.stopReason) ? (
                        <p className="coach-msg__truncated">{coachTruncationNotice(m.stopReason)}</p>
                      ) : null}
                      {m.error ? <p className="coach-msg__error">{m.error}</p> : null}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : suggestions.length > 0 && !capped ? (
            <div className="coach-chips" aria-label="Suggested questions">
              {suggestions.map((q) => (
                <button key={q} type="button" className="coach-chip" onClick={() => void ask(q)}>
                  {q}
                </button>
              ))}
            </div>
          ) : null}

          {remainingCopy ? (
            <p className="coach-panel__cap muted small">{remainingCopy}</p>
          ) : null}
          {usedCopy ? <p className="coach-panel__cap muted small">{usedCopy}</p> : null}

          <form className="coach-composer" onSubmit={onSubmit}>
            <textarea
              ref={inputRef}
              className="coach-composer__input"
              rows={1}
              value={input}
              placeholder={mode === "debrief" ? "Ask a follow-up…" : "Ask about these numbers…"}
              aria-label="Ask the coach"
              onChange={onInputChange}
              onKeyDown={onKeyDown}
              disabled={streaming || capped}
            />
            {streaming ? (
              <button type="button" className="btn btn-secondary coach-composer__send" onClick={stop}>
                Stop
              </button>
            ) : (
              <button type="submit" className="btn coach-composer__send" disabled={capped || !input.trim()}>
                Ask
              </button>
            )}
          </form>

          <p className="coach-panel__foot muted small">
            Numbers come from LogChamp's engine; the coach only explains them.
            {coverage != null ? ` Effort logged on ${Math.round(coverage * 100)}% of sets.` : ""}
            {status?.source === "mock" ? " Mock coach: no model key on this server." : ""}
            {status?.source === "byo" ? " Using your own key." : ""}
          </p>
        </>
      )}
    </section>
  );
}
