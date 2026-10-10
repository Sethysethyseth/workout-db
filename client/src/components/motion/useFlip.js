import { useLayoutEffect, useRef } from "react";
import { prefersReducedMotion } from "../../lib/useReducedMotion.js";

/**
 * FLIP across a route change (MX6): the page that is leaving records where
 * its named parts sit on screen; the page that arrives animates its matching
 * parts from those rects to their own. WAAPI, transform-only, no layout
 * thrash. Captures expire so a slow fetch never flies stale geometry.
 *
 * Both halves exist only after data loads, so this deliberately does NOT use
 * `view-transition-name` (a View Transition would end before either side
 * had rendered); the route-level View Transition stays a plain fade when a
 * FLIP is pending - see RouteTransition.
 */

const MAX_AGE_MS = 2500;
const DURATION_MS = 460;
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const store = new Map();

/* Set by a capture, read once by the route transition so the shared-axis
   slide yields to the FLIP. Separate from the rect store: the arriving
   page consumes the rects in its own layout effect, which runs before the
   route transition's. */
let routeFade = false;

/** True once, then cleared. The route layer calls this when a navigation commits. */
export function takeRouteFade() {
  const v = routeFade;
  routeFade = false;
  return v;
}

/** The key of the freshest capture still waiting, or null. Does not consume it. */
export function peekFlip() {
  const now = Date.now();
  let best = null;
  for (const [key, c] of store) {
    if (now - c.at > MAX_AGE_MS) continue;
    if (!best || c.at > best.at) best = { key, at: c.at };
  }
  return best ? best.key : null;
}

function readRects(refsByName) {
  const out = {};
  for (const name of Object.keys(refsByName)) {
    const el = refsByName[name] && refsByName[name].current;
    if (!el) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    out[name] = { left: r.left, top: r.top, width: r.width, height: r.height };
  }
  return out;
}

/** Record the current rects of the named elements under `key`. */
export function captureFlip(key, refsOrElements) {
  const refs = {};
  for (const name of Object.keys(refsOrElements)) {
    const v = refsOrElements[name];
    refs[name] = v && "current" in v ? v : { current: v };
  }
  const rects = readRects(refs);
  if (Object.keys(rects).length === 0) return;
  store.set(key, { rects, at: Date.now() });
  routeFade = true;
}

/** True when a fresh capture is waiting for `key` (or for any key). */
export function hasPendingFlip(key) {
  const now = Date.now();
  if (key != null) {
    const c = store.get(key);
    return Boolean(c && now - c.at <= MAX_AGE_MS);
  }
  for (const c of store.values()) if (now - c.at <= MAX_AGE_MS) return true;
  return false;
}

export function clearFlip(key) {
  store.delete(key);
}

function inViewport(r) {
  const h = window.innerHeight || 0;
  return r.top + r.height > 0 && r.top < h;
}

/**
 * On mount, animate each named element from its captured rect to where it
 * is now. Runs once per mount; `enabled` gates it (e.g. wait for data).
 */
export function useFlipIn(key, refsByName, { enabled = true, scaleNames = [] } = {}) {
  useLayoutEffect(() => {
    if (!enabled || !key) return undefined;
    const capture = store.get(key);
    if (!capture) return undefined;
    store.delete(key);
    if (Date.now() - capture.at > MAX_AGE_MS) return undefined;
    if (prefersReducedMotion()) return undefined;
    if (typeof Element === "undefined" || !Element.prototype.animate) return undefined;

    const now = readRects(refsByName);
    const anims = [];
    for (const name of Object.keys(now)) {
      const from = capture.rects[name];
      const to = now[name];
      if (!from || !inViewport(to)) continue;
      const el = refsByName[name].current;
      const dx = from.left - to.left;
      const dy = from.top - to.top;
      const scale = scaleNames.includes(name);
      const sx = scale && to.width ? from.width / to.width : 1;
      const sy = scale && to.height ? from.height / to.height : 1;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) continue;
      const prevOrigin = el.style.transformOrigin;
      const prevZ = el.style.zIndex;
      const prevPos = el.style.position;
      el.style.transformOrigin = "0 0";
      el.style.zIndex = "4";
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
      const a = el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
          { transform: "translate(0, 0) scale(1, 1)" },
        ],
        { duration: DURATION_MS, easing: EASE, fill: "both" }
      );
      a.finished
        .catch(() => {})
        .finally(() => {
          a.cancel();
          el.style.transformOrigin = prevOrigin;
          el.style.zIndex = prevZ;
          el.style.position = prevPos;
        });
      anims.push(a);
    }
    return () => anims.forEach((a) => a.cancel());
    // Runs once per mount by design (plus when `enabled` flips on).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, key]);
}

/**
 * On unmount only, record the named elements' rects under `key`.
 * `enabled` is read at unmount time, so a session that reopens (completed
 * becomes live) does not capture on that state change - only on leaving.
 */
export function useFlipOutOnUnmount(key, refsByName, { enabled = true } = {}) {
  const enabledRef = useRef(enabled);
  const keyRef = useRef(key);
  enabledRef.current = enabled;
  keyRef.current = key;
  useLayoutEffect(() => {
    return () => {
      if (!enabledRef.current || keyRef.current == null) return;
      captureFlip(keyRef.current, refsByName);
    };
    // Unmount-only: refsByName is a stable object of refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
