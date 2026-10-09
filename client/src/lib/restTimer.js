/** Pure rest-timer math plus the sessionStorage run. No React. */

export const REST_TIMER_EVENT = "workoutdb-rest-timer-run";

/**
 * Block-day plan rest when it is a positive number; otherwise the pref.
 * @param {{ planRestSec?: unknown, prefSeconds: number }} args
 */
export function restDurationFor({ planRestSec, prefSeconds }) {
  const plan = Number(planRestSec);
  if (Number.isFinite(plan) && plan > 0) return plan;
  return prefSeconds;
}

/** Milliseconds left, never negative. */
export function remainingMs(startedAtMs, durationMs, nowMs) {
  const left = Number(startedAtMs) + Number(durationMs) - Number(nowMs);
  if (!Number.isFinite(left) || left <= 0) return 0;
  return left;
}

/**
 * "m:ss". Rounds UP to the next whole second while any time remains.
 * 0 -> "0:00", 61000 -> "1:01", 119500 -> "2:00".
 */
export function formatRest(ms) {
  const n = Number(ms);
  if (!Number.isFinite(n) || n <= 0) return "0:00";
  const sec = Math.ceil(n / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function storageKeyFor(sessionId) {
  return `workoutdb-rest-timer-run:${sessionId}`;
}

function emit(sessionId) {
  try {
    window.dispatchEvent(
      new CustomEvent(REST_TIMER_EVENT, { detail: { sessionId } })
    );
  } catch {
    /* no window */
  }
}

/** @returns {{ startedAtMs: number, durationMs: number, exerciseName: string } | null} */
export function readRestRun(sessionId) {
  try {
    const raw = sessionStorage.getItem(storageKeyFor(sessionId));
    if (!raw) return null;
    const o = JSON.parse(raw);
    if (!o || typeof o !== "object") return null;
    const startedAtMs = Number(o.startedAtMs);
    const durationMs = Number(o.durationMs);
    if (!Number.isFinite(startedAtMs) || !Number.isFinite(durationMs)) return null;
    return {
      startedAtMs,
      durationMs,
      exerciseName: typeof o.exerciseName === "string" ? o.exerciseName : "",
    };
  } catch {
    return null;
  }
}

function writeRestRun(sessionId, run) {
  try {
    if (!run) sessionStorage.removeItem(storageKeyFor(sessionId));
    else sessionStorage.setItem(storageKeyFor(sessionId), JSON.stringify(run));
  } catch {
    /* quota / private mode */
  }
  emit(sessionId);
}

/**
 * Restart the run from now. Duration is seconds (plan or pref).
 * @returns {{ startedAtMs: number, durationMs: number, exerciseName: string } | null}
 */
export function startRestRun(sessionId, { durationSec, exerciseName, nowMs = Date.now() }) {
  const sec = Number(durationSec);
  if (!Number.isFinite(sec) || sec <= 0) return null;
  const run = {
    startedAtMs: nowMs,
    durationMs: sec * 1000,
    exerciseName: typeof exerciseName === "string" ? exerciseName : "",
  };
  writeRestRun(sessionId, run);
  return run;
}

/**
 * Add deltaMs to whatever is left (wall clock). Does not count ticks.
 * @returns {{ startedAtMs: number, durationMs: number, exerciseName: string } | null}
 */
export function nudgeRestRun(sessionId, deltaMs, nowMs = Date.now()) {
  const run = readRestRun(sessionId);
  if (!run) return null;
  const left = remainingMs(run.startedAtMs, run.durationMs, nowMs);
  const nextLeft = Math.max(0, left + deltaMs);
  const next = {
    startedAtMs: run.startedAtMs,
    durationMs: Math.max(0, nowMs - run.startedAtMs + nextLeft),
    exerciseName: run.exerciseName,
  };
  writeRestRun(sessionId, next);
  return next;
}

export function clearRestRun(sessionId) {
  writeRestRun(sessionId, null);
}
