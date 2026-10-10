/**
 * Analytics responses for this browser session, one per range, plus whether
 * the full entrance has already played. A return visit paints the cached
 * summary at once (stale-while-revalidate) and fades; the first view and a
 * range change play the full entrance. Dies on a full reload.
 */

const byWeeks = new Map();
let entrancePlayed = false;
let quiet = false;

export function peekAnalytics(weeks) {
  return byWeeks.has(weeks) ? byWeeks.get(weeks) : null;
}

export function putAnalytics(weeks, summary) {
  byWeeks.set(weeks, summary);
}

export function hasPlayedEntrance() {
  return entrancePlayed;
}

export function markEntrancePlayed() {
  entrancePlayed = true;
}

/** Read by CountUp during render. AnalyticsPage sets it before its children. */
export function analyticsQuiet() {
  return quiet;
}

export function setAnalyticsQuiet(next) {
  quiet = Boolean(next);
}
