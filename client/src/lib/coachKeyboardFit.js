/**
 * Pure coach-keyboard geometry. No imports, no DOM.
 *
 * `pageTop` and the returned `keyboardTop` share one coordinate space: client
 * coordinates, as getBoundingClientRect reports them. Those are relative to
 * the LAYOUT viewport. When the browser pans the visual viewport to reveal a
 * field (Chrome without overlaysContent, iOS Safari), the visible area is
 * [vvOffsetTop, vvOffsetTop + vvHeight] in that space, so the keyboard's top
 * is `vvOffsetTop + vvHeight`. `pageHeight` is the border-box height that
 * puts the page's bottom edge `gap` px above it. While panned, the field
 * wins: the composer sits on the keyboard and the header may scroll away.
 *
 * `open` requires focus AND a keyboard. A pan must not clear it, so
 * `vvOffsetTop` never decides `open` (`innerHeight - vvOffsetTop - vvHeight`
 * falls to 0 when Chrome pans to the bottom). It only places the keyboard.
 *
 * When `virtualKeyboard` has a positive height, it wins. That is the true
 * keyboard top on Chrome once `overlaysContent` is set; `vvHeight` can
 * over-report by the bottom system inset and must not be used instead.
 */

const KEYBOARD_THRESHOLD_PX = 80;
const DEFAULT_GAP_PX = 2;

export function coachKeyboardFit(input) {
  const src = input || {};
  /* innerHeight stays on the contract so callers pass the full viewport
     reading; it never decides `open`. */
  const _innerHeight = Number(src.innerHeight);
  void _innerHeight;
  const vvOffsetTop = Number.isFinite(Number(src.vvOffsetTop)) ? Number(src.vvOffsetTop) : 0;

  const focused = Boolean(src.focused);
  const gap = Number.isFinite(src.gap) ? src.gap : DEFAULT_GAP_PX;
  const vvHeight = Number(src.vvHeight);
  const baselineHeight = Number(src.baselineHeight);
  const pageTop = Number(src.pageTop);
  const vk = src.virtualKeyboard;

  let geometrySource = "none";
  let keyboardTop = null;

  if (vk && Number.isFinite(Number(vk.top)) && Number.isFinite(Number(vk.height)) && Number(vk.height) > 0) {
    geometrySource = "virtualKeyboard";
    keyboardTop = Number(vk.top);
  } else if (
    Number.isFinite(baselineHeight) &&
    Number.isFinite(vvHeight) &&
    baselineHeight - vvHeight > KEYBOARD_THRESHOLD_PX
  ) {
    geometrySource = "baseline";
    keyboardTop = vvOffsetTop + vvHeight;
  }

  const open = focused && geometrySource !== "none";
  if (!open || !Number.isFinite(pageTop) || !Number.isFinite(keyboardTop)) {
    return { open: false, pageHeight: null, keyboardTop: null, source: "none" };
  }

  return {
    open: true,
    pageHeight: Math.round(keyboardTop - pageTop - gap),
    keyboardTop,
    source: geometrySource,
  };
}

/** One correction: move the page height so the composer bottom lands on keyboardTop - gap. */
export function coachKeyboardCorrection(input) {
  const src = input || {};
  const pageHeight = Number(src.pageHeight);
  const composerBottom = Number(src.composerBottom);
  const keyboardTop = Number(src.keyboardTop);
  const gap = Number.isFinite(src.gap) ? src.gap : DEFAULT_GAP_PX;
  if (!Number.isFinite(pageHeight) || !Number.isFinite(composerBottom) || !Number.isFinite(keyboardTop)) {
    return { pageHeight: Number.isFinite(pageHeight) ? pageHeight : null, corrected: false };
  }
  const delta = composerBottom - (keyboardTop - gap);
  if (Math.abs(delta) <= 2) {
    return { pageHeight, corrected: false };
  }
  return { pageHeight: Math.round(pageHeight - delta), corrected: true };
}
