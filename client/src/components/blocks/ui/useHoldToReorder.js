import { useCallback, useEffect, useRef, useState } from "react";

const HOLD_MS = 400;
const MOVE_CANCEL_PX = 8;
const EDGE_SCROLL_PX = 32;
const EDGE_SCROLL_SPEED = 10;
const EDGE_SCROLL_Y_PX = 64;
const EDGE_SCROLL_Y_SPEED = 14;
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

function isDocumentScroller(scroller) {
  return (
    !scroller ||
    scroller === document.body ||
    scroller === document.documentElement ||
    scroller === document.scrollingElement
  );
}

function scrollPos(scroller) {
  if (isDocumentScroller(scroller)) {
    return window.scrollY || document.documentElement.scrollTop || 0;
  }
  return scroller.scrollTop || 0;
}

function findScrollParent(el) {
  let node = el?.parentElement || null;
  while (node && node !== document.body && node !== document.documentElement) {
    const oy = getComputedStyle(node).overflowY;
    if (
      (oy === "auto" || oy === "scroll" || oy === "overlay") &&
      node.scrollHeight > node.clientHeight + 1
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return document.scrollingElement || document.documentElement;
}

function visibleScrollEdges(scroller) {
  if (isDocumentScroller(scroller)) {
    return { top: 0, bottom: window.innerHeight };
  }
  const rect = scroller.getBoundingClientRect();
  return {
    top: Math.max(0, rect.top),
    bottom: Math.min(window.innerHeight, rect.bottom),
  };
}

function edgeScrollDeltaY(clientY, edges) {
  const distTop = clientY - edges.top;
  const distBottom = edges.bottom - clientY;
  if (distTop < EDGE_SCROLL_Y_PX && distTop <= distBottom) {
    const t = 1 - Math.min(EDGE_SCROLL_Y_PX, Math.max(0, distTop)) / EDGE_SCROLL_Y_PX;
    return -Math.max(4, Math.round(EDGE_SCROLL_Y_SPEED * t));
  }
  if (distBottom < EDGE_SCROLL_Y_PX) {
    const t = 1 - Math.min(EDGE_SCROLL_Y_PX, Math.max(0, distBottom)) / EDGE_SCROLL_Y_PX;
    return Math.max(4, Math.round(EDGE_SCROLL_Y_SPEED * t));
  }
  return 0;
}

function layoutTopInScroller(el, scroller) {
  const rect = el.getBoundingClientRect();
  let translateY = 0;
  const transform = getComputedStyle(el).transform;
  if (transform && transform !== "none") {
    try {
      translateY = new DOMMatrixReadOnly(transform).m42 || 0;
    } catch {
      translateY = 0;
    }
  }
  const layoutHeight = el.offsetHeight || rect.height;
  const viewportTop = rect.top - translateY - (rect.height - layoutHeight) / 2;
  if (isDocumentScroller(scroller)) {
    return viewportTop + (window.scrollY || document.documentElement.scrollTop || 0);
  }
  const host = scroller.getBoundingClientRect();
  return viewportTop - host.top + (scroller.scrollTop || 0);
}

function measureVertical(items, scroller) {
  const tops = items.map((el) => layoutTopInScroller(el, scroller));
  const heights = items.map((el) => el.offsetHeight || 48);
  const mids = tops.map((top, i) => top + heights[i] / 2);
  let slotSize = (heights[0] || 48) + 10;
  if (tops.length >= 2) slotSize = Math.max(1, tops[1] - tops[0]);
  return { mids, slotSize };
}

function trackDragY(d, items, scroller) {
  const { mids, slotSize } = measureVertical(items, scroller);
  const home = mids[d.fromIndex] ?? 0;
  const raw = d.clientY - d.startY + (scrollPos(scroller) - d.startScroll);
  const min = (mids[0] ?? home) - home;
  const max = (mids[mids.length - 1] ?? home) - home;
  const dy = Math.min(Math.max(raw, min), max);
  return {
    dy,
    overIndex: mids.length ? nearestSlot(home + dy, mids) : d.fromIndex,
    mids,
    slotSize,
  };
}

function verticalDragChanged(prev, next) {
  return (
    prev.overIndex !== next.overIndex ||
    Math.abs((prev.dy || 0) - next.dy) >= 0.5 ||
    Math.abs((prev.slotSize || 0) - next.slotSize) >= 0.5
  );
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
 * Hold-to-reorder (pointer events only).
 * `axis` `"x"` (default) is the horizontal pill-strip path. `"y"` uses
 * clientY / top / height / translateY and edge-scrolls the nearest scroller.
 * Active only when `enabled` is true (caller passes that when onReorder exists).
 */
export function useHoldToReorder({ enabled, itemCount, onReorder, axis = "x" }) {
  const axisRef = useRef(axis === "y" ? "y" : "x");
  axisRef.current = axis === "y" ? "y" : "x";
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
    if (d.axis === "y") {
      const scroller = d.scroller || findScrollParent(strip);
      const items = itemRefs.current.filter(Boolean);
      const delta = items.length
        ? edgeScrollDeltaY(d.clientY, visibleScrollEdges(scroller))
        : 0;
      if (delta) {
        if (isDocumentScroller(scroller)) window.scrollBy(0, delta);
        else scroller.scrollTop += delta;
      }
      if (items.length && items.length === itemRefs.current.length) {
        const next = trackDragY(d, itemRefs.current, scroller);
        if (delta || verticalDragChanged(d, next)) {
          Object.assign(d, next);
          setDrag({ ...d });
        }
      }
    } else {
      const rect = strip.getBoundingClientRect();
      let delta = 0;
      if (d.clientX < rect.left + EDGE_SCROLL_PX) delta = -EDGE_SCROLL_SPEED;
      else if (d.clientX > rect.right - EDGE_SCROLL_PX) delta = EDGE_SCROLL_SPEED;
      if (delta) {
        strip.scrollLeft += delta;
        Object.assign(d, trackDrag(d, strip));
        setDrag({ ...d });
      }
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
      const vertical = pending.axis === "y";
      let next;
      if (vertical) {
        const scroller = findScrollParent(strip);
        const measured =
          items.length > 0
            ? measureVertical(items, scroller)
            : { mids: [], slotSize: 48 };
        next = {
          ...pending,
          lifted: true,
          overIndex: pending.fromIndex,
          dy: 0,
          dx: 0,
          slotSize: measured.slotSize,
          mids: measured.mids,
          scroller,
          startScroll: scrollPos(scroller),
        };
      } else {
        const fromEl = items[pending.fromIndex];
        const slotSize = fromEl
          ? fromEl.getBoundingClientRect().width + 6
          : 72;
        next = {
          ...pending,
          lifted: true,
          overIndex: pending.fromIndex,
          dx: 0,
          slotSize,
          mids: measureSlotMids(strip, items),
          startScroll: strip.scrollLeft,
        };
      }
      dragRef.current = next;
      armClickSuppress();
      if (!vertical) lockPageScroll();
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
      if (axisRef.current === "y") {
        const target = e.target;
        if (target instanceof Element && target.closest("input, textarea, select")) return;
      }
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
        dy: 0,
        slotSize: 0,
        axis: axisRef.current,
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
      if (d.axis === "y") {
        const scroller = d.scroller || findScrollParent(strip);
        const items = itemRefs.current;
        if (!items.length || items.some((el) => !el)) return;
        Object.assign(d, trackDragY(d, items, scroller));
      } else {
        Object.assign(d, trackDrag(d, strip));
      }
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
      const shiftAxis = drag.axis === "y" ? "Y" : "X";
      const offset = shiftAxis === "Y" ? drag.dy || 0 : drag.dx;
      if (index === drag.fromIndex) {
        return {
          transform: `translate${shiftAxis}(${offset}px)`,
          zIndex: 2,
          position: "relative",
        };
      }
      const shift = slotShiftPx(drag.fromIndex, drag.overIndex, index, drag.slotSize);
      if (!shift) return undefined;
      return { transform: `translate${shiftAxis}(${shift}px)` };
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
