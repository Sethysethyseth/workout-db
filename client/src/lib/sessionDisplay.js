import { defaultWorkoutSessionName } from "./defaultWorkoutSessionName.js";
import { getAdHocSessionTitle } from "./adHocSessionTitle.js";
import { isBlankSessionExerciseName } from "./sessionExerciseName.js";

/**
 * Parse stored block-day name `"<block> · W<n> · <day>"`.
 * @returns {{ blockName: string, weekLabel: string, dayName: string } | null}
 */
function parseBlockDayStoredName(stored) {
  const name = stored != null ? String(stored).trim() : "";
  if (!name) return null;
  const parts = name.split(/\s*·\s*/).map((p) => p.trim()).filter(Boolean);
  if (parts.length < 3) return null;
  const weekIdx = parts.findIndex((p) => /^W\d+$/i.test(p));
  if (weekIdx < 0 || weekIdx >= parts.length - 1) return null;
  return {
    blockName: parts.slice(0, weekIdx).join(" · "),
    weekLabel: parts[weekIdx].toUpperCase(),
    dayName: parts.slice(weekIdx + 1).join(" · "),
  };
}

function blockWeekOrderOf(session) {
  if (session?.blockWeekOrder != null) return Number(session.blockWeekOrder);
  if (session?.blockContext?.weekOrder != null) return Number(session.blockContext.weekOrder);
  return null;
}

/**
 * Primary title for a block-day session: "W3 · Upper A".
 * Null when the session is not a block day.
 */
export function blockDayPrimaryTitle(session) {
  const weekOrder = blockWeekOrderOf(session);
  if (weekOrder == null || Number.isNaN(weekOrder)) return null;

  const ctxDay = session?.blockContext?.dayName;
  if (ctxDay != null && String(ctxDay).trim()) {
    return `W${weekOrder} · ${String(ctxDay).trim()}`;
  }

  const stored = session?.name != null ? String(session.name).trim() : "";
  const parsed = parseBlockDayStoredName(stored);
  if (parsed?.dayName) {
    return `W${weekOrder} · ${parsed.dayName}`;
  }

  if (session?.blockWorkoutOrder != null) {
    return `W${weekOrder} · Day ${session.blockWorkoutOrder}`;
  }
  return `W${weekOrder}`;
}

/** Block name for subtitle surfaces; null when not a block-day session. */
export function sessionDisplayBlockName(session) {
  if (blockWeekOrderOf(session) == null) return null;
  const ctxName = session?.blockContext?.blockName;
  if (ctxName != null && String(ctxName).trim()) return String(ctxName).trim();
  const stored = session?.name != null ? String(session.name).trim() : "";
  const parsed = parseBlockDayStoredName(stored);
  if (parsed?.blockName) return parsed.blockName;
  return null;
}

/** User-facing title for a session row (template-based, block-day, or ad hoc). */
export function sessionDisplayTitle(session) {
  const blockPrimary = blockDayPrimaryTitle(session);
  if (blockPrimary) return blockPrimary;

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
