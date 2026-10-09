import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  CoachError,
  askCoachStream,
  coachErrorMessage,
  getCoachStatus,
} from "../../api/coachApi.js";
import { loadCoachKey } from "../../lib/coachKeyPref.js";
import { HELP_CHIPS, buildSuggestedQuestions } from "../../lib/coachSuggestions.js";
import { loadWeightUnit } from "../../lib/weightUnitPref.js";
import { AiWait } from "./AiWait.jsx";
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

function ChatBubbleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 16.2 4.8 20l3.6-1.4A8.2 8.2 0 1 0 7 16.2Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="11" r="1" fill="currentColor" />
      <circle cx="12" cy="11" r="1" fill="currentColor" />
      <circle cx="15" cy="11" r="1" fill="currentColor" />
    </svg>
  );
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
}) {
  const headingId = useId();
  const pageLayout = layout === "page";
  const [open, setOpen] = useState(defaultOpen || pageLayout);
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
      if (!question || streaming) return;
      if (status?.weeklyCap && status.weeklyCap.remaining <= 0) return;
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
        const result = await askCoachStream({
          question,
          range: mode === "debrief" ? null : range,
          unit: loadWeightUnit(),
          focus: effectiveFocus,
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
          prev.map((m) =>
            m.id === pending.id
              ? { ...m, pending: false, stopReason: result.stopReason ?? null }
              : m
          )
        );
        if (status?.weeklyCap) {
          try {
            const next = await getCoachStatus({ byoKey });
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
      } catch (err) {
        if (err && err.name === "AbortError") return;
        if (err instanceof CoachError && err.code === "weekly_limit") {
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
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
        setStreaming(false);
      }
    },
    [streaming, thread, mode, range, effectiveFocus, byoKey, status]
  );

  useEffect(() => {
    if (!open || !autoAsk || autoAskedRef.current) return;
    if (!status || !status.available) return;
    if (status.weeklyCap && status.weeklyCap.remaining <= 0) return;
    autoAskedRef.current = true;
    void ask(autoAsk);
  }, [open, autoAsk, status, ask]);

  useEffect(() => {
    const el = threadRef.current;
    if (!el || thread.length === 0) return;
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
  const showComposer = Boolean(status) && !unavailable && !statusError;

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
        <div key={m.id} className="coach-msg coach-msg--user">
          {m.content}
        </div>
      ) : pageLayout ? (
        <div key={m.id} className="coach-page-reply">
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

        <div className="coach-page__scroll" ref={threadRef}>
          {statusError ? (
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
          ) : thread.length > 0 ? (
            <div className="coach-thread coach-page__thread" role="log" aria-live="polite">
              {renderThread()}
            </div>
          ) : (
            <div className="coach-page__intro">
              <div className="coach-page__mark" aria-hidden="true">
                <ChatBubbleIcon />
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
                        ?
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
          {remainingCopy ? <p className="coach-panel__cap muted small">{remainingCopy}</p> : null}
          {usedCopy ? <p className="coach-panel__cap muted small">{usedCopy}</p> : null}
        </div>

        {showComposer ? (
          <form className="coach-page__composer" onSubmit={onSubmit}>
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
              <button type="button" className="coach-page__send" aria-label="Stop" onClick={stop}>
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
