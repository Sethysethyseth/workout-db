import { useCallback, useEffect, useRef, useState } from "react";

const HOLD_MS = 400;
const MOVE_CANCEL_PX = 8;
const EDGE_SCROLL_PX = 32;
const EDGE_SCROLL_SPEED = 10;
const CLICK_SUPPRESS_MS = 400;

function slotShiftPx(fromIndex, overIndex, index, slotSize) {
  if (index === fromIndex || fromIndex === overIndex) return 0;
  if (fromIndex < overIndex && index > fromIndex && index <= overIndex) {
    return -slotSize;
  }
  if (fromIndex > overIndex && index >= overIndex && index < fromIndex) {
    return slotSize;
  }
  return 0;
}

// Slot centres are measured ONCE at lift, in strip content coordinates, before
// any pill is transformed. Live rects would include the slide-aside transforms
// (and the dragged pill itself), so the target flips back the moment the
// neighbours open the gap.
function measureSlotMids(strip, itemEls) {
  const stripLeft = strip.getBoundingClientRect().left;
  return itemEls.map((el) => {
    const r = el.getBoundingClientRect();
    return r.left + r.width / 2 - stripLeft + strip.scrollLeft;
  });
}

function nearestSlot(x, mids) {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < mids.length; i++) {
    const d = Math.abs(x - mids[i]);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

/**
 * Drag offset (scroll-aware) and the slot under the dragged pill's centre.
 * The offset is clamped to the first..last slot so the translated pill never
 * widens the strip's scroll area (edge auto-scroll would run away into it).
 */
function trackDrag(d, strip) {
  const raw = d.clientX - d.startX + (strip.scrollLeft - d.startScroll);
  const home = d.mids[d.fromIndex];
  const dx = Math.min(
    Math.max(raw, d.mids[0] - home),
    d.mids[d.mids.length - 1] - home
  );
  return { dx, overIndex: nearestSlot(home + dx, d.mids) };
}

function lockPageScroll() {
  const body = document.body;
  if (!body || body.dataset.bkReorderLock === "1") return;
  body.dataset.bkReorderLock = "1";
  body.dataset.bkReorderOverflow = body.style.overflow || "";
  body.style.overflow = "hidden";
}

function unlockPageScroll() {
  const body = document.body;
  if (!body || body.dataset.bkReorderLock !== "1") return;
  body.style.overflow = body.dataset.bkReorderOverflow || "";
  delete body.dataset.bkReorderOverflow;
  delete body.dataset.bkReorderLock;
}

/**
 * Hold-to-reorder for horizontal pill strips (pointer events only).
 * Active only when `enabled` is true (caller passes that when onReorder exists).
 */
export function useHoldToReorder({ enabled, itemCount, onReorder }) {
  const containerRef = useRef(null);
  const itemRefs = useRef([]);
  const holdTimerRef = useRef(null);
  const suppressClickRef = useRef(false);
  const suppressTimerRef = useRef(null);
  const dragRef = useRef(null);
  const scrollRafRef = useRef(0);
  const [drag, setDrag] = useState(null);

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current != null) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const stopEdgeScroll = useCallback(() => {
    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current);
      scrollRafRef.current = 0;
    }
  }, []);

  const armClickSuppress = useCallback(() => {
    suppressClickRef.current = true;
    if (suppressTimerRef.current != null) clearTimeout(suppressTimerRef.current);
    suppressTimerRef.current = setTimeout(() => {
      suppressClickRef.current = false;
      suppressTimerRef.current = null;
    }, CLICK_SUPPRESS_MS);
  }, []);

  const resetDrag = useCallback(() => {
    clearHoldTimer();
    stopEdgeScroll();
    unlockPageScroll();
    const active = dragRef.current;
    if (active?.pointerId != null && active.target?.releasePointerCapture) {
      try {
        active.target.releasePointerCapture(active.pointerId);
      } catch {
        /* already released */
      }
    }
    dragRef.current = null;
    setDrag(null);
  }, [clearHoldTimer, stopEdgeScroll]);

  const tickEdgeScroll = useCallback(() => {
    const d = dragRef.current;
    const strip = containerRef.current;
    if (!d?.lifted || !strip) {
      scrollRafRef.current = 0;
      return;
    }
    const rect = strip.getBoundingClientRect();
    let delta = 0;
    if (d.clientX < rect.left + EDGE_SCROLL_PX) delta = -EDGE_SCROLL_SPEED;
    else if (d.clientX > rect.right - EDGE_SCROLL_PX) delta = EDGE_SCROLL_SPEED;
    if (delta) {
      strip.scrollLeft += delta;
      Object.assign(d, trackDrag(d, strip));
      setDrag({ ...d });
    }
    scrollRafRef.current = requestAnimationFrame(tickEdgeScroll);
  }, []);

  const startEdgeScroll = useCallback(() => {
    if (!scrollRafRef.current) {
      scrollRafRef.current = requestAnimationFrame(tickEdgeScroll);
    }
  }, [tickEdgeScroll]);

  const lift = useCallback(
    (pending) => {
      holdTimerRef.current = null;
      const strip = containerRef.current;
      const target = pending.target;
      if (!strip || !target) return;
      try {
        target.setPointerCapture(pending.pointerId);
      } catch {
        /* capture optional */
      }
      try {
        navigator.vibrate?.(10);
      } catch {
        /* vibrate optional */
      }
      const items = itemRefs.current.slice(0, itemCount).filter(Boolean);
      const fromEl = items[pending.fromIndex];
      const slotSize = fromEl
        ? fromEl.getBoundingClientRect().width + 6
        : 72;
      const next = {
        ...pending,
        lifted: true,
        overIndex: pending.fromIndex,
        dx: 0,
        slotSize,
        mids: measureSlotMids(strip, items),
        startScroll: strip.scrollLeft,
      };
      dragRef.current = next;
      armClickSuppress();
      lockPageScroll();
      setDrag(next);
      startEdgeScroll();
    },
    [itemCount, startEdgeScroll, armClickSuppress]
  );

  useEffect(() => {
    if (!enabled || !drag?.lifted) return undefined;
    function onKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        resetDrag();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, drag?.lifted, resetDrag]);

  // Touch: browsers fix touch-action when the finger lands, so the strip's
  // pan-x would win the first move after a lift and fire pointercancel. A
  // non-passive touchmove that cancels the pan ONLY while lifted keeps the
  // drag; before the lift, swipes scroll the strip natively. Long-press must
  // not open the context menu either.
  useEffect(() => {
    const strip = containerRef.current;
    if (!enabled || !strip) return undefined;
    function onTouchMove(e) {
      if (dragRef.current?.lifted && e.cancelable) e.preventDefault();
    }
    function onContextMenu(e) {
      e.preventDefault();
    }
    strip.addEventListener("touchmove", onTouchMove, { passive: false });
    strip.addEventListener("contextmenu", onContextMenu);
    return () => {
      strip.removeEventListener("touchmove", onTouchMove);
      strip.removeEventListener("contextmenu", onContextMenu);
    };
  }, [enabled]);

  useEffect(
    () => () => {
      clearHoldTimer();
      stopEdgeScroll();
      unlockPageScroll();
      if (suppressTimerRef.current != null) clearTimeout(suppressTimerRef.current);
    },
    [clearHoldTimer, stopEdgeScroll]
  );

  useEffect(() => {
    itemRefs.current.length = itemCount;
  }, [itemCount]);

  const setItemRef = useCallback((index, el) => {
    itemRefs.current[index] = el;
  }, []);

  const onItemPointerDown = useCallback(
    (index, e) => {
      if (!enabled) return;
      if (e.button != null && e.button !== 0) return;
      clearHoldTimer();
      const pending = {
        fromIndex: index,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        clientX: e.clientX,
        clientY: e.clientY,
        target: e.currentTarget,
        lifted: false,
        overIndex: index,
        dx: 0,
        slotSize: 0,
      };
      dragRef.current = pending;
      holdTimerRef.current = setTimeout(() => lift(pending), HOLD_MS);
    },
    [enabled, clearHoldTimer, lift]
  );

  const onItemPointerMove = useCallback(
    (e) => {
      if (!enabled) return;
      const d = dragRef.current;
      if (!d || d.pointerId !== e.pointerId) return;
      d.clientX = e.clientX;
      d.clientY = e.clientY;
      if (!d.lifted) {
        const dist = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
        if (dist > MOVE_CANCEL_PX) {
          clearHoldTimer();
          dragRef.current = null;
        }
        return;
      }
      e.preventDefault();
      const strip = containerRef.current;
      if (!strip) return;
      Object.assign(d, trackDrag(d, strip));
      setDrag({ ...d });
    },
    [enabled, clearHoldTimer]
  );

  const finishPointer = useCallback(
    (e, cancelled) => {
      if (!enabled) return;
      const d = dragRef.current;
      if (!d || (e && d.pointerId !== e.pointerId)) return;
      clearHoldTimer();
      if (!d.lifted) {
        dragRef.current = null;
        return;
      }
      if (e) e.preventDefault();
      const fromIndex = d.fromIndex;
      const toIndex = d.overIndex;
      // Hold-and-release must not fire the pill click (select / actions sheet).
      armClickSuppress();
      resetDrag();
      if (!cancelled && fromIndex !== toIndex) {
        onReorder?.(fromIndex, toIndex);
      }
    },
    [enabled, clearHoldTimer, resetDrag, onReorder, armClickSuppress]
  );

  const onItemPointerUp = useCallback(
    (e) => finishPointer(e, false),
    [finishPointer]
  );

  const onItemPointerCancel = useCallback(
    (e) => finishPointer(e, true),
    [finishPointer]
  );

  const onItemClickCapture = useCallback(
    (e) => {
      if (!enabled) return;
      if (suppressClickRef.current) {
        e.preventDefault();
        e.stopPropagation();
        suppressClickRef.current = false;
        if (suppressTimerRef.current != null) {
          clearTimeout(suppressTimerRef.current);
          suppressTimerRef.current = null;
        }
      }
    },
    [enabled]
  );

  const getItemStyle = useCallback(
    (index) => {
      if (!drag?.lifted) return undefined;
      if (index === drag.fromIndex) {
        return {
          transform: `translateX(${drag.dx}px)`,
          zIndex: 2,
          position: "relative",
        };
      }
      const shift = slotShiftPx(drag.fromIndex, drag.overIndex, index, drag.slotSize);
      if (!shift) return undefined;
      return { transform: `translateX(${shift}px)` };
    },
    [drag]
  );

  const getItemClassNames = useCallback(
    (index, baseClasses) => {
      if (!enabled) return baseClasses;
      const parts = [baseClasses, "bk-pill--reorderable"];
      if (drag?.lifted && index === drag.fromIndex) {
        parts.push("bk-pill--lifting");
      } else if (drag?.lifted) {
        const shift = slotShiftPx(drag.fromIndex, drag.overIndex, index, drag.slotSize);
        if (shift) parts.push("bk-pill--slot-shift");
      }
      return parts.filter(Boolean).join(" ");
    },
    [enabled, drag]
  );

  const getItemPointerProps = useCallback(
    (index) => {
      if (!enabled) return {};
      return {
        onPointerDown: (e) => onItemPointerDown(index, e),
        onPointerMove: onItemPointerMove,
        onPointerUp: onItemPointerUp,
        onPointerCancel: onItemPointerCancel,
        onClickCapture: onItemClickCapture,
      };
    },
    [
      enabled,
      onItemPointerDown,
      onItemPointerMove,
      onItemPointerUp,
      onItemPointerCancel,
      onItemClickCapture,
    ]
  );

  const containerClassName = enabled && drag?.lifted ? "bk-strip--reordering" : "";

  return {
    containerRef,
    containerClassName,
    setItemRef,
    getItemStyle,
    getItemClassNames,
    getItemPointerProps,
  };
}
