/** User-facing title for a session row (template-based or ad hoc). */
export function sessionDisplayTitle(session) {
  const name = session?.workoutTemplate?.name?.trim();
  if (name) return name;
  return "Quick workout";
}

/** Best timestamp for “when this session mattered” (completed > performed > started). */
export function sessionActivityTimestamp(session) {
  if (!session) return null;
  return session.completedAt || session.performedAt || session.startedAt;
}

export function compareSessionsByRecentActivity(a, b) {
  const ta = new Date(sessionActivityTimestamp(a) || 0).getTime();
  const tb = new Date(sessionActivityTimestamp(b) || 0).getTime();
  return tb - ta;
}
