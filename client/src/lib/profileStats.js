function parseCompletedAt(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function getMondayWeekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function weekStartKey(date) {
  const monday = getMondayWeekStart(date);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, "0");
  const day = String(monday.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function countCompleted(sessions) {
  if (!Array.isArray(sessions)) return 0;
  return sessions.filter((s) => parseCompletedAt(s?.completedAt)).length;
}

export function countThisWeek(sessions, now = new Date()) {
  if (!Array.isArray(sessions)) return 0;
  const nowDate = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(nowDate.getTime())) return 0;

  const weekStart = getMondayWeekStart(nowDate);

  return sessions.filter((s) => {
    const completed = parseCompletedAt(s?.completedAt);
    if (!completed) return false;
    return completed >= weekStart && completed <= nowDate;
  }).length;
}

export function weekStreak(sessions, now = new Date()) {
  if (!Array.isArray(sessions) || sessions.length === 0) return 0;

  const nowDate = now instanceof Date ? now : new Date(now);
  if (Number.isNaN(nowDate.getTime())) return 0;

  const weekKeys = new Set();
  for (const s of sessions) {
    const completed = parseCompletedAt(s?.completedAt);
    if (!completed) continue;
    weekKeys.add(weekStartKey(completed));
  }

  if (weekKeys.size === 0) return 0;

  let streak = 0;
  const cursor = getMondayWeekStart(nowDate);

  if (!weekKeys.has(weekStartKey(cursor))) {
    cursor.setDate(cursor.getDate() - 7);
  }

  while (weekKeys.has(weekStartKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }

  return streak;
}
