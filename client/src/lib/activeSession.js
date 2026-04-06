/**
 * In-progress sessions for the current user (from GET /sessions/mine).
 * Picks the most recently started incomplete session so the UI can treat
 * “one active workout” as the latest one.
 */
export function pickLatestActiveSession(sessions) {
  const list = Array.isArray(sessions) ? sessions.filter((s) => s && !s.completedAt) : [];
  if (list.length === 0) return null;
  list.sort((a, b) => {
    const ta = new Date(a.startedAt || a.performedAt || 0).getTime();
    const tb = new Date(b.startedAt || b.performedAt || 0).getTime();
    return tb - ta;
  });
  return list[0];
}
