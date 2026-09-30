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

/** POST /block-runs { blockTemplateId } -> { run } */
export function startBlockRun(blockTemplateId) {
  return http("/block-runs", {
    method: "POST",
    body: { blockTemplateId },
  });
}

/**
 * GET /block-runs/active
 * -> { run: null } | { run, block, progress }
 */
export function getActiveBlockRun() {
  return http("/block-runs/active");
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
