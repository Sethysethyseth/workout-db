/**
 * Last History list, held in memory for the life of the page. Back from a
 * session can paint the row on the first frame so the shrink starts with
 * the route fade, instead of waiting on a refetch. Dies on a full reload.
 */

let sessions = null;

export function peekHistorySessions() {
  return sessions;
}

export function putHistorySessions(list) {
  sessions = Array.isArray(list) ? list : [];
}
