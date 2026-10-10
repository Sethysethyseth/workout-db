/**
 * When a core-logged set may start rest (MXF2). Pure: no DOM, no timer.
 * A leave is focus moving outside the set's row, or the keyboard closing
 * while the set is filled. Moving among weight, reps and effort stays
 * inside the row and waits. Once rest has started, a re-edit does not
 * start another.
 *
 * @param {object} p
 * @param {boolean} p.coreLogged
 * @param {boolean} p.alreadyStarted
 * @param {boolean} p.focusInsideRow
 * @param {boolean} p.keyboardOpen
 * @param {boolean} p.keyboardWasOpen
 * @returns {"start" | "wait" | "skip"}
 */
export function restLeaveDecision({
  coreLogged,
  alreadyStarted,
  focusInsideRow,
  keyboardOpen,
  keyboardWasOpen,
}) {
  if (alreadyStarted) return "skip";
  if (!coreLogged) return "wait";
  if (!focusInsideRow) return "start";
  if (keyboardWasOpen && !keyboardOpen) return "start";
  return "wait";
}

/**
 * Focus anywhere inside a set holds rest back, except the block logger's
 * log-as-planned tap (`.bk-set-num`): that tap IS finishing the set, so it
 * counts as a leave whether or not the browser focuses buttons on tap
 * (Android does, iOS does not).
 *
 * @param {unknown} el
 * @returns {boolean}
 */
export function isRestLogTap(el) {
  const closest = /** @type {{ closest?: (s: string) => unknown }} */ (el || {}).closest;
  return typeof closest === "function" && Boolean(closest.call(el, ".bk-set-num"));
}

/** Same shrink the logger uses to tell a soft keyboard from the URL-bar. */
export const KEYBOARD_SHRINK_PX = 150;

/**
 * @param {object} p
 * @param {number} p.innerHeight
 * @param {number | null} p.visualViewportHeight
 * @param {boolean} p.focused
 * @returns {boolean}
 */
export function keyboardLooksOpen({
  innerHeight,
  visualViewportHeight,
  focused,
  threshold = KEYBOARD_SHRINK_PX,
}) {
  if (visualViewportHeight == null) return Boolean(focused);
  return innerHeight - visualViewportHeight > threshold;
}
