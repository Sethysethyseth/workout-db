import { useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useLocation, useNavigationType, useOutlet } from "react-router-dom";
import "../../styles/shell-motion.css";
import { prefersReducedMotion } from "../../lib/useReducedMotion.js";
import { routeDirection } from "./navOrder.js";
import { flipSourcePending, takeRouteFade } from "./useFlip.js";
import { arenaArrivalScroll } from "../../lib/arenaFold.js";

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
  /* The Arena stage mode of the route we are leaving. ArenaStage's layout
     effect runs first and already holds the NEW route's mode, so read the
     one recorded at the end of the previous run (reviewer fix, ar-r1b). */
  const prevArenaModeRef = useRef(null);
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
       History - the source is still mounted at this point, so ask it.
       Under Arena, also fade when leaving the live-logger strip: a view
       transition snapshot across the stage height change aborts with a
       page error ("Viewport size changed"). */
    const fadeFlag = takeRouteFade();
    const toHistoryShrink = pathname === "/sessions" && flipSourcePending();
    const arenaLeavingStrip =
      typeof document !== "undefined" &&
      document.documentElement.hasAttribute("data-arena") &&
      prevArenaModeRef.current === "working" &&
      from !== pathname;
    const dir =
      fadeFlag || toHistoryShrink || arenaLeavingStrip ? "fade" : routeDirection(from, pathname);
    const push = navType === "PUSH";
    /* Leaving the live logger under Arena (Finish and Discard replace the
       route) also starts the next page at the top, so Home opens to the room
       and its SAVED board instead of inheriting the logger's scroll. */
    /* Under Arena a tab change keeps the fold: if the room was folded to
       the rail on the page you left, the new page starts folded too
       (lib/arenaFold.js); otherwise, and always after the logger, the top. */
    const arenaOn =
      typeof document !== "undefined" && document.documentElement.hasAttribute("data-arena");
    const scrollTop = () => {
      if (typeof window === "undefined") return;
      if (arenaLeavingStrip) window.scrollTo(0, 0);
      else if (push) {
        const y = arenaOn ? arenaArrivalScroll() : 0;
        if (y > 0) {
          /* Folded to folded: the spacer's size change cuts instead of
             easing, and scroll anchoring is off for the cut (arena.css), or
             the page would be scrolled against a height that is still
             moving, or pulled back to the old page's scroll, and miss the
             fold. */
          const root = document.documentElement;
          root.dataset.arenaSnap = "";
          void root.offsetHeight;
          window.scrollTo(0, y);
          requestAnimationFrame(() => requestAnimationFrame(() => delete root.dataset.arenaSnap));
        } else window.scrollTo(0, 0);
      }
    };

    /* A pending FLIP fades the live page instead of snapshotting it, so the
       card surface (a sibling of this wrapper, on #root) stays visible and
       the grow/shrink reads as the same motion as the fade. */
    const reduced = prefersReducedMotion();
    const flipFade = dir === "fade" && !reduced;

    if (!supportsViewTransitions || flipFade) {
      if (flipFade && supportsViewTransitions) {
        /* Do not flushSync inside useLayoutEffect - React warns
           ("flushSync was called from inside a lifecycle method"). Commit
           synchronously via the layout effect's own setState instead; the
           WAAPI enter still runs on the committed page. */
        setCommitted(pathname);
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
    /* Never leave VT promises unhandled - an abort must not surface as a pageerror. */
    transition.ready.catch(() => {});
    transition.finished
      .catch(() => {})
      .finally(() => {
        if (vtRef.current === transition) vtRef.current = null;
        if (html.dataset.mxDir === dir) delete html.dataset.mxDir;
      });
    return undefined;
  }, [pathname, navType]);

  /* After the effect above: remember this route's Arena mode for the next navigation. */
  useLayoutEffect(() => {
    prevArenaModeRef.current =
      typeof document !== "undefined" && document.documentElement.hasAttribute("data-arena-working")
        ? "working"
        : null;
  });

  return (
    <div ref={wrapperRef} className="mx-route">
      {content}
    </div>
  );
}
