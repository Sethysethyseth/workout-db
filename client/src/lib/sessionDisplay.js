import { defaultWorkoutSessionName } from "./defaultWorkoutSessionName.js";
import { getAdHocSessionTitle } from "./adHocSessionTitle.js";
import { isBlankSessionExerciseName } from "./sessionExerciseName.js";

/** User-facing title for a session row (template-based or ad hoc). */
export function sessionDisplayTitle(session) {
  const templateName = session?.workoutTemplate?.name?.trim();
  if (templateName) return templateName;
  const stored = session?.name != null ? String(session.name).trim() : "";
  if (stored) return stored;
  const legacy = session?.id != null ? getAdHocSessionTitle(session.id) : null;
  if (legacy) return legacy;
  const when = session?.startedAt || session?.performedAt || session?.completedAt;
  return defaultWorkoutSessionName(when);
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

/** When session list/detail payloads include `exercises`, surface a short “current” name. */
export function sessionQuickExerciseLabel(session) {
  const ex = session?.exercises;
  if (!Array.isArray(ex) || ex.length === 0) return null;
  const sorted = [...ex].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const raw = sorted[i]?.exerciseName;
    const name = String(raw ?? "").trim();
    if (name && !isBlankSessionExerciseName(raw)) return name;
  }
  return null;
}
