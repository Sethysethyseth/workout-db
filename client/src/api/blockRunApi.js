import { http } from "./http.js";
import { SESSIONS_CHANGED_EVENT } from "./sessionApi.js";

function notifySessionsChanged(detail) {
  try {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new CustomEvent(SESSIONS_CHANGED_EVENT, { detail }));
  } catch {
    // never let a notification failure break the mutation itself
  }
}

/**
 * POST /block-runs { blockTemplateId, resumeRunId? } -> { run }
 * Sends resumeRunId only when given.
 */
export function startBlockRun(blockTemplateId, { resumeRunId } = {}) {
  const body = { blockTemplateId };
  if (resumeRunId != null) body.resumeRunId = resumeRunId;
  return http("/block-runs", {
    method: "POST",
    body,
  });
}

/**
 * GET /block-runs/active
 * -> { run: null } | { run, block, progress }
 */
export function getActiveBlockRun() {
  return http("/block-runs/active");
}

/**
 * GET /block-runs/left-off
 * -> { runs: [{ runId, blockTemplateId, endedAt, nextDay, dayName, doneDays, totalDays }] }
 */
export function getLeftOffRuns() {
  return http("/block-runs/left-off");
}

/** POST /block-runs/:id/end -> { run } */
export function endBlockRun(id) {
  return http(`/block-runs/${id}/end`, { method: "POST" });
}

/**
 * POST /sessions/start-from-block
 * { blockRunId, weekOrder, workoutOrder } -> { session, resumed }
 */
export async function startFromBlock({ blockRunId, weekOrder, workoutOrder }) {
  const data = await http("/sessions/start-from-block", {
    method: "POST",
    body: { blockRunId, weekOrder, workoutOrder },
  });
  if (data?.session?.id != null && !data.resumed) {
    notifySessionsChanged({ type: "reopened", sessionId: data.session.id });
  }
  return data;
}
