/**
 * Pan-aware visible band in client coordinates (getBoundingClientRect space).
 * The visible band is `vv.offsetTop` .. `vv.offsetTop + vv.height`. When
 * `virtualKeyboard` reports a positive height, its top wins: on the edge
 * model `vv.height` over-reports and would place the band behind the keys.
 * `coachKeyboardFit` is the coordinate rule; `innerHeight` never decides
 * `open` by itself, but a missing no-keyboard baseline is synthesized from
 * it when the visual viewport has already shrunk.
 */

import { coachKeyboardFit } from "./coachKeyboardFit.js";

const KEYBOARD_THRESHOLD_PX = 80;

/**
 * Edge (overlaysContent off) over-reports vv.height by the bottom inset, so
 * a clamp to vv.offsetTop + vv.height sits behind the real keys. When
 * virtualKeyboard did not supply the top, pull the cap up by that inset.
 * Chrome and iOS already match the real keyboard, so the extra gap only
 * shortens the list; it still ends at or above the keys.
 */
export const VIEWPORT_OVERREPORT_SLACK_PX = 28;

export function keyboardCap(band, reading) {
  if (!band || !band.keyboardOpen) return band ? band.bottom : 0;
  if (reading && reading.virtualKeyboard) return band.bottom;
  return band.bottom - VIEWPORT_OVERREPORT_SLACK_PX;
}

export function readViewportReading(focused) {
  const vv = typeof window !== "undefined" ? window.visualViewport : null;
  const innerHeight = window.innerHeight;
  const vvHeight = vv ? vv.height : innerHeight;
  const vvOffsetTop = vv ? vv.offsetTop : 0;
  let virtualKeyboard = null;
  const vk = typeof navigator !== "undefined" ? navigator.virtualKeyboard : null;
  const rect = vk && vk.boundingRect;
  if (rect && Number(rect.height) > 0 && Number.isFinite(Number(rect.top))) {
    virtualKeyboard = {
      top: Number(rect.top),
      height: Number(rect.height),
      left: Number(rect.left),
      width: Number(rect.width),
    };
  }
  return {
    focused: Boolean(focused),
    innerHeight,
    innerWidth: window.innerWidth,
    vvHeight,
    vvOffsetTop,
    virtualKeyboard,
  };
}

/** Keep the tallest reading that was not itself a keyboard. */
export function nextKeyboardBaseline(prev, reading) {
  const width = reading.innerWidth;
  const vvHeight = reading.vvHeight;
  const keyboardLikely =
    Boolean(reading.virtualKeyboard) ||
    (Number.isFinite(reading.innerHeight) && reading.innerHeight - vvHeight > KEYBOARD_THRESHOLD_PX);
  if (!prev || prev.width !== width) {
    return {
      baseline: keyboardLikely ? reading.innerHeight : vvHeight,
      width,
    };
  }
  if (!keyboardLikely) {
    return { baseline: Math.max(prev.baseline, vvHeight), width };
  }
  return prev;
}

export function visibleBandFromReading(reading, baselineHeight) {
  const top = Number.isFinite(reading.vvOffsetTop) ? reading.vvOffsetTop : 0;
  const vvBottom = top + (Number.isFinite(reading.vvHeight) ? reading.vvHeight : 0);
  const synthesized =
    !reading.virtualKeyboard &&
    Number.isFinite(reading.innerHeight) &&
    reading.innerHeight - reading.vvHeight > KEYBOARD_THRESHOLD_PX
      ? reading.innerHeight
      : null;
  const baseline = Number.isFinite(baselineHeight) ? baselineHeight : synthesized ?? reading.vvHeight;
  const fit = coachKeyboardFit({
    focused: Boolean(reading.focused),
    innerHeight: reading.innerHeight,
    vvHeight: reading.vvHeight,
    vvOffsetTop: top,
    baselineHeight: baseline,
    virtualKeyboard: reading.virtualKeyboard,
    pageTop: 0,
    gap: 0,
  });
  const keyboardTop = fit.open && Number.isFinite(fit.keyboardTop) ? fit.keyboardTop : null;
  const bottom = keyboardTop != null ? Math.min(vvBottom, keyboardTop) : vvBottom;
  return {
    top,
    bottom,
    keyboardOpen: keyboardTop != null,
    keyboardTop,
  };
}
