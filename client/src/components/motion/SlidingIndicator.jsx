import { useLayoutEffect, useRef, useState } from "react";
import "./motion.css";
import { useReducedMotion } from "../../lib/useReducedMotion.js";

/**
 * The ONE "selected" look for segmented controls: a single pill that slides
 * (spring) between options instead of each option tinting itself. Place it
 * as the first child of a `.mx-slide-host` container whose options carry
 * `aria-pressed="true"` when active; it measures that option and follows.
 *
 * - `activeKey` only needs to change when the selection does; the indicator
 *   also re-measures on container resize and once fonts have loaded.
 * - First paint and reduced motion snap (no transition) - see motion.css.
 * - Pure layout read -> style write, never per frame.
 */
export function SlidingIndicator({ containerRef, activeKey, selector = '[aria-pressed="true"]' }) {
  const reduced = useReducedMotion();
  const selfRef = useRef(null);
  const [box, setBox] = useState(null);
  const [ready, setReady] = useState(false);
  const readyTimer = useRef(0);

  useLayoutEffect(() => {
    /* On first mount this child's layout effect runs BEFORE React attaches
       the parent's ref, so containerRef is still null here. The indicator's
       own element is always attached by now - its parent is the host. */
    const host = containerRef?.current ?? selfRef.current?.parentElement ?? null;
    if (!host) return undefined;

    const measure = () => {
      const el = host.querySelector(selector);
      if (!el) {
        setBox(null);
        return;
      }
      setBox({
        x: el.offsetLeft,
        y: el.offsetTop,
        w: el.offsetWidth,
        h: el.offsetHeight,
      });
    };

    measure();
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(host);
    window.addEventListener("resize", measure);
    const fonts = typeof document !== "undefined" ? document.fonts : null;
    if (fonts && fonts.ready) fonts.ready.then(measure).catch(() => {});
    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [containerRef, activeKey, selector]);

  /* Transitions switch on one frame after the first measurement so the
     initial position never animates in from 0,0. */
  useLayoutEffect(() => {
    if (!box || ready) return undefined;
    readyTimer.current = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(readyTimer.current);
  }, [box, ready]);

  /* Always rendered (hidden until measured) so selfRef exists on mount. */
  return (
    <span
      ref={selfRef}
      className={`mx-slide-ind${ready && !reduced ? " is-ready" : ""}`}
      aria-hidden="true"
      style={
        box
          ? {
              transform: `translate(${box.x}px, ${box.y}px)`,
              width: `${box.w}px`,
              height: `${box.h}px`,
            }
          : { visibility: "hidden" }
      }
    />
  );
}
