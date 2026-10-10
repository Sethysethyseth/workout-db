import { useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useLocation, useNavigationType, useOutlet } from "react-router-dom";
import "../../styles/shell-motion.css";
import { prefersReducedMotion } from "../../lib/useReducedMotion.js";
import { routeDirection } from "./navOrder.js";
import { flipSourcePending, takeRouteFade } from "./useFlip.js";

/**
 * MX5 shared-axis route transition. Mounted as a pathless layout route in
 * App.jsx, so it wraps the page outlet and nothing else (the masthead, the
 * persistent workout bar and the bottom nav stay put).
 *
 * The navigation itself is never gated: the router has already changed
 * location by the time this runs - the transition only decorates it.
 *
 * - With the View Transitions API (progressive enhancement): the previous
 *   page is held for one commit while the browser snapshots it, then the new
 *   page renders inside `startViewTransition`. `::view-transition` is
 *   pointer-events: none (shell-motion.css), so a tap mid-transition lands on
 *   the live page and wins; a second navigation skips the running
 *   transition. Direction rides on `html[data-mx-dir]`.
 * - Without it: the new page is already in the DOM; a WAAPI enter slide runs
 *   on the wrapper (no remount, no key) - old page leaves instantly.
 * - Reduced motion: both paths become a short crossfade (CSS + the WAAPI
 *   branch below).
 * - PUSH navigations start the new page at the top, so a page that slides in
 *   slides in at its head; back/forward keep the browser's own scroll.
 * - When a list -> detail FLIP is pending (useFlip), the axis is dropped for
 *   a fade so the two motions never fight.
 */

const supportsViewTransitions =
  typeof document !== "undefined" && typeof document.startViewTransition === "function";

const SLIDE_PX = 28;

function enterKeyframes(dir) {
  if (prefersReducedMotion() || dir === "fade") {
    return [{ opacity: 0 }, { opacity: 1 }];
  }
  const from = dir === "back" ? -SLIDE_PX : SLIDE_PX;
  return [
    { opacity: 0, transform: `translateX(${from}px)` },
    { opacity: 1, transform: "translateX(0)" },
  ];
}

export function RouteTransition() {
  const outlet = useOutlet();
  const { pathname } = useLocation();
  const navType = useNavigationType();
  const wrapperRef = useRef(null);
  const prevPathRef = useRef(pathname);
  const vtRef = useRef(null);
  const lastLiveOutletRef = useRef(outlet);
  const [committed, setCommitted] = useState(pathname);

  const showLive = !supportsViewTransitions || committed === pathname;
  const content = showLive ? outlet : lastLiveOutletRef.current;

  useLayoutEffect(() => {
    if (showLive) lastLiveOutletRef.current = outlet;
  });

  useLayoutEffect(() => {
    const from = prevPathRef.current;
    if (from === pathname) return undefined;
    prevPathRef.current = pathname;

    /* Fade (no slide, no View Transition snapshot) when a shrink will run:
       the forward tap set the flag, or we are leaving a shrink source for
       History - the source is still mounted at this point, so ask it. */
    const fadeFlag = takeRouteFade();
    const toHistoryShrink = pathname === "/sessions" && flipSourcePending();
    const dir = fadeFlag || toHistoryShrink ? "fade" : routeDirection(from, pathname);
    const push = navType === "PUSH";
    const scrollTop = () => {
      if (push && typeof window !== "undefined") window.scrollTo(0, 0);
    };

    /* A pending FLIP fades the live page instead of snapshotting it, so the
       card surface (a sibling of this wrapper, on #root) stays visible and
       the grow/shrink reads as the same motion as the fade. */
    const reduced = prefersReducedMotion();
    const flipFade = dir === "fade" && !reduced;

    if (!supportsViewTransitions || flipFade) {
      if (flipFade && supportsViewTransitions) {
        flushSync(() => setCommitted(pathname));
      }
      scrollTop();
      const el = wrapperRef.current;
      if (el && typeof el.animate === "function") {
        const a = el.animate(enterKeyframes(dir), {
          duration: reduced ? 180 : 420,
          easing: reduced ? "ease-out" : "cubic-bezier(0.16, 1, 0.3, 1)",
          fill: "backwards",
        });
        return () => a.cancel();
      }
      return undefined;
    }

    if (vtRef.current) {
      try {
        vtRef.current.skipTransition();
      } catch {
        /* already finished */
      }
      vtRef.current = null;
    }
    const html = document.documentElement;
    html.dataset.mxDir = dir;
    const commit = () => {
      flushSync(() => setCommitted(pathname));
      scrollTop();
    };
    let transition = null;
    try {
      transition = document.startViewTransition(commit);
    } catch {
      commit();
      delete html.dataset.mxDir;
      return undefined;
    }
    vtRef.current = transition;
    transition.finished
      .catch(() => {})
      .finally(() => {
        if (vtRef.current === transition) vtRef.current = null;
        if (html.dataset.mxDir === dir) delete html.dataset.mxDir;
      });
    return undefined;
  }, [pathname, navType]);

  return (
    <div ref={wrapperRef} className="mx-route">
      {content}
    </div>
  );
}
