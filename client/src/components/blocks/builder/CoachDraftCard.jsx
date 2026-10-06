import { useEffect, useRef, useState } from "react";
import { ApiError } from "../../../api/http.js";
import {
  AI_CALL_TIMEOUT_MS,
  AI_TIMEOUT_MESSAGE,
  coachBlockDraft,
  coachErrorMessage,
  getCoachStatus,
} from "../../../api/coachApi.js";
import { loadCoachKey } from "../../../lib/coachKeyPref.js";
import { AiWait, AiWaitButtonLabel } from "../../coach/AiWait.jsx";

function formatNextQuestionTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${weekday} at ${time}`;
}

function weeklyCapUsedCopy(weeklyCap) {
  if (!weeklyCap || weeklyCap.remaining > 0) return null;
  const when = formatNextQuestionTime(weeklyCap.nextAvailableAt);
  if (when) return `You've used this week's questions. Your next question frees up ${when}.`;
  return "You've used this week's questions.";
}

const DRAFT_VERB = "Drafting your block...";

/**
 * Optional coach entry on a NEW empty block. Hidden when /coach/status
 * says unavailable. On success, calls onDrafted({ block, stats, source }).
 */
export function CoachDraftCard({ unit = "lb", onDrafted }) {
  const [status, setStatus] = useState(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const byoKey = loadCoachKey();
  const aliveRef = useRef(true);
  const abortRef = useRef(null);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getCoachStatus({ byoKey });
        if (!cancelled) setStatus(data);
      } catch {
        if (!cancelled) setStatus(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [byoKey]);

  if (!status?.available) return null;

  const capped = Boolean(status.weeklyCap && status.weeklyCap.remaining <= 0);
  const cappedCopy = weeklyCapUsedCopy(status.weeklyCap);

  async function onDraft() {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    if (capped) {
      setError(cappedCopy);
      return;
    }
    setError(null);
    setBusy(true);
    const controller = new AbortController();
    abortRef.current = controller;
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, AI_CALL_TIMEOUT_MS);
    try {
      const data = await coachBlockDraft({
        mode: "generate",
        text: trimmed,
        unit,
        byoKey,
        signal: controller.signal,
      });
      if (!aliveRef.current) return;
      onDrafted?.(data);
    } catch (err) {
      if (!aliveRef.current) return;
      if (err && err.name === "AbortError") {
        if (timedOut) setError(AI_TIMEOUT_MESSAGE);
        return;
      }
      if (err instanceof ApiError) {
        const body = err.body || {};
        const code = body.reason || body.error || "provider_error";
        if (code === "weekly_limit") {
          setStatus((prev) => ({
            ...(prev || {}),
            weeklyCap: {
              limit: body.limit ?? prev?.weeklyCap?.limit ?? null,
              used: body.used ?? prev?.weeklyCap?.used ?? null,
              remaining: 0,
              nextAvailableAt: body.nextAvailableAt ?? prev?.weeklyCap?.nextAvailableAt ?? null,
            },
          }));
          setError(
            weeklyCapUsedCopy({ remaining: 0, nextAvailableAt: body.nextAvailableAt })
          );
        } else {
          setError(coachErrorMessage(code, err.message));
        }
      } else {
        setError(coachErrorMessage("network"));
      }
    } finally {
      clearTimeout(timer);
      if (abortRef.current === controller) abortRef.current = null;
      if (aliveRef.current) setBusy(false);
    }
  }

  return (
    <div className="bk-import-panel" style={{ marginTop: 16 }}>
      <label className="bk-import-label" htmlFor="bk-coach-draft">
        Describe the block you want
      </label>
      <textarea
        id="bk-coach-draft"
        className="bk-import-textarea bk-builder-coach-draft"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder="e.g. 4-week upper/lower hypertrophy block, intermediate loads"
        disabled={busy}
      />
      {capped ? (
        <p className="bk-import-hint" role="status">
          {cappedCopy}
        </p>
      ) : (
        <>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!text.trim() || busy}
            aria-busy={busy || undefined}
            onClick={() => void onDraft()}
          >
            <AiWaitButtonLabel
              busy={busy}
              idle="Draft with the coach"
              verb={DRAFT_VERB}
            />
          </button>
          {busy ? <AiWait variant="status" verb={DRAFT_VERB} /> : null}
        </>
      )}
      {error ? (
        <p className="bk-import-inline-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
