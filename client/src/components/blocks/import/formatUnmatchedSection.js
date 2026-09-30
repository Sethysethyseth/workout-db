/** Line under the unmatched heading (always with the heading). */
export const UNMATCHED_KEEP_LINE =
  "Kept exactly as typed unless you match them.";

/**
 * Consequence of leaving names unmatched — Analytics will ignore them until matched.
 * Shown only when there is at least one unmatched name.
 */
export const UNMATCHED_ANALYTICS_NOTE =
  "Unmatched exercises still import and log normally, but they won't count toward Analytics (muscle volume, strength trends, Execution) until you match them to your library.";

/**
 * Unmatched-section heading with count. Empty when there are none.
 * @param {number} count
 * @returns {string}
 */
export function formatUnmatchedHeading(count) {
  const n = Number(count) || 0;
  if (n <= 0) return "";
  return `Not in your library (${n})`;
}
