import { useEffect, useRef, useState } from "react";
import {
  REST_TIMER_EVENT,
  clearRestRun,
  formatRest,
  nudgeRestRun,
  readRestRun,
  remainingMs,
} from "../../lib/restTimer.js";
import "../../styles/rest-timer.css";

const DONE_HOLD_MS = 3000;
const NUDGE_MS = 15000;

function vibrateOnce() {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(80);
    }
  } catch {
    /* unsupported */
  }
}

/**
 * Slim rest bar. Time comes from the stored timestamp, never a tick counter.
 * Hidden entirely when the pref is off or there is no live run.
 */
export function RestTimerBar({ sessionId, enabled }) {
  const [run, setRun] = useState(null);
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const lineRef = useRef(null);
  const vibratedRef = useRef(false);
  const sessionSeenRef = useRef(null);

  useEffect(() => {
    if (!enabled || sessionId == null) {
      setRun(null);
      return undefined;
    }
    function sync() {
      setRun(readRestRun(sessionId));
    }
    sync();
    window.addEventListener(REST_TIMER_EVENT, sync);
    return () => window.removeEventListener(REST_TIMER_EVENT, sync);
  }, [enabled, sessionId]);

  useEffect(() => {
    if (!enabled || !run) return undefined;
    const firstLook = sessionSeenRef.current !== sessionId;
    sessionSeenRef.current = sessionId;
    vibratedRef.current = false;
    let raf = 0;
    let timer = 0;
    let stopped = false;
    let sawTimeLeft = remainingMs(run.startedAtMs, run.durationMs, Date.now()) > 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function paintLine(frac) {
      if (!lineRef.current) return;
      lineRef.current.style.transform = `scaleX(${frac})`;
    }

    function tick() {
      if (stopped) return;
      const now = Date.now();
      const left = remainingMs(run.startedAtMs, run.durationMs, now);
      const endAt = run.startedAtMs + run.durationMs;
      const frac = run.durationMs > 0 ? Math.min(1, Math.max(0, left / run.durationMs)) : 0;
      paintLine(frac);

      if (now >= endAt + DONE_HOLD_MS) {
        clearRestRun(sessionId);
        return;
      }

      const doneNow = left <= 0;
      if (!doneNow) sawTimeLeft = true;
      if (doneNow && sawTimeLeft && !vibratedRef.current) {
        vibratedRef.current = true;
        vibrateOnce();
      }
      const nextText = doneNow ? "Rest done" : formatRest(left);
      setText((prev) => (prev === nextText ? prev : nextText));
      setDone((prev) => (prev === doneNow ? prev : doneNow));

      if (reduce) {
        const wait = left > 1000 ? left % 1000 || 1000 : Math.max(50, left || 200);
        timer = window.setTimeout(tick, wait);
      } else {
        raf = window.requestAnimationFrame(tick);
      }
    }

    const now0 = Date.now();
    const endAt0 = run.startedAtMs + run.durationMs;
    if (now0 >= endAt0 + DONE_HOLD_MS) {
      clearRestRun(sessionId);
      return undefined;
    }
    const left0 = remainingMs(run.startedAtMs, run.durationMs, now0);
    if (left0 <= 0 && !firstLook) {
      vibratedRef.current = true;
      vibrateOnce();
    }
    setText(left0 <= 0 ? "Rest done" : formatRest(left0));
    setDone(left0 <= 0);
    tick();

    return () => {
      stopped = true;
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [enabled, run, sessionId]);

  if (!enabled || !run || !text) return null;

  const name = run.exerciseName;

  return (
    <div
      className={`rest-timer${done ? " rest-timer--done" : ""}`}
      role="timer"
      aria-label={done ? "Rest done" : `Rest ${text}`}
    >
      <div className="rest-timer__track" aria-hidden="true">
        <div ref={lineRef} className="rest-timer__line" />
      </div>
      <div className="rest-timer__readout">
        <span className="rest-timer__time">{text}</span>
        {done ? null : <span className="rest-timer__kicker">Rest</span>}
        {name ? <span className="rest-timer__name">{name}</span> : null}
      </div>
      <div className="rest-timer__actions">
        <button
          type="button"
          className="rest-timer__btn"
          onClick={() => nudgeRestRun(sessionId, -NUDGE_MS)}
        >
          -15s
        </button>
        <button
          type="button"
          className="rest-timer__btn"
          onClick={() => nudgeRestRun(sessionId, NUDGE_MS)}
        >
          +15s
        </button>
        <button
          type="button"
          className="rest-timer__btn"
          onClick={() => clearRestRun(sessionId)}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
