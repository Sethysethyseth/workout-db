import { useLayoutEffect, useRef } from "react";
import { prefersReducedMotion } from "../../lib/useReducedMotion.js";

/**
 * Shared-element motion across a route change (MX6, MXF1). The page that is
 * leaving records a rect; the page that arrives grows or shrinks a card-shaped
 * SURFACE between the two rects. The surface is an empty node (no text), so
 * nothing scales the type. Header and row contents stay put and fade.
 *
 * Captures expire so a slow fetch never flies stale geometry. The route layer
 * fades (instead of sliding) while a capture is pending.
 */

const MAX_AGE_MS = 2500;
const DURATION_MS = 460;
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const store = new Map();

/* Set by a capture, read once by the route transition so the shared-axis
   slide yields to the surface. Separate from the rect store: the arriving
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

/* A mounted page that can be the SOURCE of a shrink (the completed session
   detail) registers here, so the route layer knows to fade - not slide - when
   the user leaves it for History. The route layer decides BEFORE the source
   unmounts (it holds the old page for the View Transition snapshot), so the
   unmount capture alone arrives too late (MXF1 audit). */
let flipSource = null;
let lastCaptureAt = 0;

export function setFlipSource(key) {
  flipSource = key == null ? null : String(key);
}

/** True while a shrink source is mounted, or a capture landed in the last 150ms. */
export function flipSourcePending() {
  return flipSource != null || Date.now() - lastCaptureAt < 150;
}

/**
 * Record the current rects of the named elements under `key`. `fade` also
 * tells the next navigation to fade (the forward tap); an unmount capture
 * passes false so no stale flag is left for the navigation after it.
 */
export function captureFlip(key, refsOrElements, { fade = true } = {}) {
  const refs = {};
  let src = null;
  for (const name of Object.keys(refsOrElements)) {
    const v = refsOrElements[name];
    refs[name] = v && "current" in v ? v : { current: v };
    if (!src && refs[name].current) src = refs[name].current;
  }
  const rects = readRects(refs);
  if (Object.keys(rects).length === 0) return;
  store.set(String(key), { rects, at: Date.now(), src });
  lastCaptureAt = Date.now();
  if (fade) routeFade = true;
}

/* A capture whose source element is still in the document was taken by a
   remount (React StrictMode / re-run effects), not a navigation - never play it. */
function isStale(capture) {
  return Boolean(capture.src && capture.src.isConnected);
}

/** True when a fresh capture is waiting for `key` (or for any key). */
export function hasPendingFlip(key) {
  const now = Date.now();
  if (key != null) {
    const c = store.get(String(key));
    return Boolean(c && now - c.at <= MAX_AGE_MS);
  }
  for (const c of store.values()) if (now - c.at <= MAX_AGE_MS) return true;
  return false;
}

export function clearFlip(key) {
  store.delete(key);
}

function rectOf(el) {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

/**
 * Animate an empty card surface from `from` to `to`. The node holds no text.
 * Returns a handle the caller can cancel; the node removes itself when done.
 */
function playSurface(from, to) {
  const el = document.createElement("div");
  el.className = "mx-flip-surface";
  el.setAttribute("aria-hidden", "true");
  const root = document.getElementById("root") || document.body;
  root.appendChild(el);
  const anim = el.animate(
    [
      {
        left: `${from.left}px`,
        top: `${from.top}px`,
        width: `${from.width}px`,
        height: `${from.height}px`,
      },
      {
        left: `${to.left}px`,
        top: `${to.top}px`,
        width: `${to.width}px`,
        height: `${to.height}px`,
      },
    ],
    { duration: DURATION_MS, easing: EASE, fill: "both" }
  );
  const remove = () => el.remove();
  anim.finished.then(remove, remove);
  return {
    finished: anim.finished,
    cancel() {
      anim.cancel();
      remove();
    },
  };
}

/**
 * Play a waiting capture onto `el` (the History row on the way back). Hides
 * the row until the surface lands so the type is never scaled. No-op when
 * nothing is waiting or motion is reduced.
 */
export function playCapturedSurface(key, el) {
  if (!el || key == null) return;
  const capture = store.get(String(key));
  if (!capture || Date.now() - capture.at > MAX_AGE_MS || isStale(capture)) {
    store.delete(String(key));
    return;
  }
  const from = capture.rects.head;
  store.delete(String(key));
  if (!from) return;
  if (prefersReducedMotion() || typeof Element === "undefined" || !Element.prototype.animate) return;
  const to = rectOf(el);
  const prev = el.style.opacity;
  el.style.opacity = "0";
  const handle = playSurface(from, to);
  handle.finished.then(
    () => {
      el.style.opacity = prev;
    },
    () => {
      el.style.opacity = prev;
    }
  );
}

/**
 * On mount, grow the captured rect into the named element's box via a
 * surface. `onDone` fires when the surface lands (or immediately when there
 * is nothing to play). Runs once per mount, and again if `enabled` flips on.
 */
export function useFlipIn(key, refsByName, { enabled = true, onDone } = {}) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useLayoutEffect(() => {
    if (!enabled || !key) return undefined;
    const capture = store.get(String(key));
    if (!capture || Date.now() - capture.at > MAX_AGE_MS || isStale(capture)) {
      if (capture) store.delete(String(key));
      /* Release any hold the caller set from an earlier hasPendingFlip() -
         an expired capture must never leave the header hidden. */
      onDoneRef.current?.();
      return undefined;
    }
    const from = capture.rects.head;
    store.delete(String(key));
    const el = refsByName.head && refsByName.head.current;
    if (!from || !el || prefersReducedMotion() || typeof Element === "undefined" || !Element.prototype.animate) {
      onDoneRef.current?.();
      return undefined;
    }
    const handle = playSurface(from, rectOf(el));
    let cancelled = false;
    handle.finished.then(
      () => {
        if (!cancelled) onDoneRef.current?.();
      },
      () => {
        if (!cancelled) onDoneRef.current?.();
      }
    );
    return () => {
      cancelled = true;
      handle.cancel();
    };
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
      captureFlip(keyRef.current, refsByName, { fade: false });
    };
    // Unmount-only: refsByName is a stable object of refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
