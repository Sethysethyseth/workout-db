/**
 * Local-day analytics ranges as ISO datetimes.
 * Start = local midnight N calendar days back (including today);
 * end = local end of the reference day (23:59:59.999).
 * Inject `now` for deterministic tests.
 *
 * @param {number} dayCount - local calendar days including the end day (must be >= 1)
 * @param {Date} [now] - reference instant (defaults to wall clock)
 * @returns {{ from: string, to: string }}
 */
export function localDayRange(dayCount, now = new Date()) {
  const n = Number(dayCount);
  const days = Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
  const ref = now instanceof Date ? now : new Date(now);

  const end = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59, 999);
  const start = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  return { from: start.toISOString(), to: end.toISOString() };
}
