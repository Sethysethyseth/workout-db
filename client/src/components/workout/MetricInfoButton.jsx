import { createPortal } from "react-dom";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

/** Same copy for per-set `(?)` explainers. */
const METRIC_INTRO_COPY = {
  rpe:
    "RPE = Rate of Perceived Exertion. A 1–10 scale of how hard a set felt. 10 = couldn't do another rep, 7 = had 3 in the tank.",
  rir:
    "RIR = Reps in Reserve. How many more reps you could've done. 0 = total failure, 3 = three more in the tank.",
};

/**
 * (?) next to RPE/RIR labels. Opens a fixed-position popover (portal) so parents
 * like `.table-scroll` do not clip it and set inputs do not reflow.
 */
export function MetricInfoButton({ metric }) {
  const copy = METRIC_INTRO_COPY[metric];
  const title = metric === "rpe" ? "RPE" : "RIR";
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const popoverRef = useRef(null);
  const id = useId();
  const popoverId = `${id}-popover`;

  const place = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const maxW = Math.min(280, Math.max(160, window.innerWidth - 16));
    let left = r.left;
    if (left + maxW > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - 8 - maxW);
    }
    setPos({ top: r.bottom + 6, left, maxWidth: maxW });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e) {
      const t = e.target;
      if (!(t instanceof Node)) return;
      if (btnRef.current?.contains(t) || popoverRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  const toggle = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen((v) => !v);
  }, []);

  const portal =
    open && pos && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={popoverRef}
            id={popoverId}
            role="tooltip"
            className="metric-info-popover"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              maxWidth: pos.maxWidth,
            }}
          >
            <p className="metric-info-popover__text">{copy}</p>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <span className="metric-info-btn-wrap">
        <button
          ref={btnRef}
          type="button"
          className="metric-info-btn"
          aria-label={`What is ${title}?`}
          aria-expanded={open}
          aria-controls={open ? popoverId : undefined}
          onClick={toggle}
        >
          ?
        </button>
      </span>
      {portal}
    </>
  );
}
