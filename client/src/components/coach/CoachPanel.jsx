import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  CoachError,
  askCoachStream,
  coachErrorMessage,
  getCoachStatus,
} from "../../api/coachApi.js";
import { loadCoachKey } from "../../lib/coachKeyPref.js";
import { loadWeightUnit } from "../../lib/weightUnitPref.js";
import { CoachMarkdown } from "./CoachMarkdown.jsx";

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
    body: "You can use your own Anthropic key from Profile, AI access. It stays in this browser tab.",
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

export function CoachPanel({
  mode = "ask",
  range = null,
  weeks = null,
  focus = null,
  suggestions = [],
  collapsedLabel = "Ask about these numbers",
  autoAsk = null,
  defaultOpen = false,
}) {
  const headingId = useId();
  const [open, setOpen] = useState(defaultOpen);
  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState(null);
  const [thread, setThread] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [coverage, setCoverage] = useState(null);
  const abortRef = useRef(null);
  const autoAskedRef = useRef(false);
  const threadRef = useRef(null);
  const inputRef = useRef(null);
  const pendingQuestionRef = useRef(null);

  const byoKey = loadCoachKey();

  useEffect(() => {
    if (!open || status) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getCoachStatus({ byoKey });
        if (!cancelled) setStatus(data);
      } catch (err) {
        if (!cancelled) setStatusError(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, status, byoKey]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const scopeLabel = useMemo(() => {
    if (mode === "debrief") return "Reading this workout against your last four weeks";
    const span = formatRangeLabel(range);
    if (weeks && span) return `Reading ${weeks} weeks, ${span}`;
    if (span) return `Reading ${span}`;
    return "Reading your recent training";
  }, [mode, range, weeks]);

  const ask = useCallback(
    async (questionRaw) => {
      const question = String(questionRaw ?? "").trim();
      if (!question || streaming) return;
      const history = thread
        .filter((m) => !m.error && m.content)
        .map((m) => ({ role: m.role, content: m.content }));
      const userMsg = makeMessage("user", question);
      const pending = makeMessage("assistant", "", { pending: true });
      setThread((prev) => [...prev, userMsg, pending]);
      setInput("");
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;
      try {
        await askCoachStream({
          question,
          range: mode === "debrief" ? null : range,
          unit: loadWeightUnit(),
          focus,
          history,
          byoKey,
          signal: controller.signal,
          onMeta: (meta) => {
            if (meta && meta.effortCoverage !== undefined) setCoverage(meta.effortCoverage);
          },
          onDelta: (_piece, full) => {
            setThread((prev) =>
              prev.map((m) => (m.id === pending.id ? { ...m, content: full } : m))
            );
          },
        });
        setThread((prev) =>
          prev.map((m) => (m.id === pending.id ? { ...m, pending: false } : m))
        );
      } catch (err) {
        if (err && err.name === "AbortError") return;
        const message =
          err instanceof CoachError ? err.message : coachErrorMessage("provider_error");
        setThread((prev) =>
          prev.map((m) => (m.id === pending.id ? { ...m, pending: false, error: message } : m))
        );
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setStreaming(false);
      }
    },
    [streaming, thread, mode, range, focus, byoKey]
  );

  useEffect(() => {
    if (!open || !autoAsk || autoAskedRef.current) return;
    if (!status || !status.available) return;
    autoAskedRef.current = true;
    void ask(autoAsk);
  }, [open, autoAsk, status, ask]);

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [thread]);

  function openWith(question) {
    setOpen(true);
    if (question) {
      // Status loads on open; the ask waits for it via the effect below.
      pendingQuestionRef.current = question;
    }
  }

  useEffect(() => {
    if (!open || !status?.available || !pendingQuestionRef.current) return;
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
    abortRef.current?.abort();
    setThread((prev) => prev.map((m) => (m.pending ? { ...m, pending: false } : m)));
    setStreaming(false);
  }

  function reset() {
    stop();
    setThread([]);
    setCoverage(null);
    autoAskedRef.current = false;
    inputRef.current?.focus();
  }

  if (!open) {
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

  const unavailableReason = status && !status.available ? status.reason || "no_key" : null;
  const unavailable = unavailableReason ? UNAVAILABLE_COPY[unavailableReason] || UNAVAILABLE_COPY.no_key : null;

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
                      {m.pending ? (
                        <span className="coach-caret" aria-label="The coach is writing" />
                      ) : null}
                      {m.error ? <p className="coach-msg__error">{m.error}</p> : null}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : suggestions.length > 0 ? (
            <div className="coach-chips" aria-label="Suggested questions">
              {suggestions.map((q) => (
                <button key={q} type="button" className="coach-chip" onClick={() => void ask(q)}>
                  {q}
                </button>
              ))}
            </div>
          ) : null}

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
              disabled={streaming}
            />
            {streaming ? (
              <button type="button" className="btn btn-secondary coach-composer__send" onClick={stop}>
                Stop
              </button>
            ) : (
              <button type="submit" className="btn coach-composer__send" disabled={!input.trim()}>
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
