const prefix = "workoutdb.adHocTitle.";

export function getAdHocSessionTitle(sessionId) {
  if (sessionId == null) return null;
  try {
    const v = localStorage.getItem(prefix + String(sessionId));
    const t = v != null ? String(v).trim() : "";
    return t.length > 0 ? t : null;
  } catch {
    return null;
  }
}

export function setAdHocSessionTitle(sessionId, title) {
  if (sessionId == null) return;
  const key = prefix + String(sessionId);
  const t = String(title ?? "").trim();
  try {
    if (!t) localStorage.removeItem(key);
    else localStorage.setItem(key, t);
  } catch {
    /* ignore quota / private mode */
  }
}
