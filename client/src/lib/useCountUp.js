import { useEffect, useRef, useState } from "react";
import { easeOutExpo } from "./motionFormat.js";
import { useReducedMotion } from "./useReducedMotion.js";

/** JS mirrors of the --mx-* tokens in index.css (a hook cannot read CSS at
    call time). Keep these in step with :root. */
export const COUNT_UP_MS = 1100; /* --mx-count */
export const MX_STAGGER_MS = 55; /* --mx-stagger */
export const MX_DATA_LEAD_MS = 120; /* data starts this long after its container lands */

/**
 * Roll a number from the value currently displayed to `target`.
 *
 * - First mount rolls from `from` (default 0) unless `delay` has not
 *   elapsed yet (the structure-first rule: the tile lands, then the number
 *   rolls). Later target changes roll from the last displayed value, so a
 *   range change on Analytics reads as "35.6 became 41.2", not a reset.
 * - Under prefers-reduced-motion the target is returned at once.
 * - Returns { value, rolling }. Callers add the `.mx-rolling` class while
 *   rolling so tabular figures keep the layout still.
 */
export function useCountUp(target, { duration = COUNT_UP_MS, delay = 0, from = 0, enabled = true } = {}) {
  const reduced = useReducedMotion();
  const skip = reduced || !enabled || !Number.isFinite(target);
  const [value, setValue] = useState(() => (skip ? target : from));
  const [rolling, setRolling] = useState(false);
  const shown = useRef(skip ? target : from);
  const raf = useRef(0);
  const timer = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(raf.current);
    clearTimeout(timer.current);
    if (skip) {
      shown.current = target;
      setValue(target);
      setRolling(false);
      return undefined;
    }
    /* A value that was not a number ("—") rolls from `from`, not from NaN. */
    const start = Number.isFinite(shown.current) ? shown.current : from;
    if (start === target) {
      setRolling(false);
      return undefined;
    }
    let t0 = 0;
    const tick = (now) => {
      if (!t0) t0 = now;
      const p = Math.min(1, (now - t0) / duration);
      const v = start + (target - start) * easeOutExpo(p);
      shown.current = v;
      setValue(v);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else {
        shown.current = target;
        setValue(target);
        setRolling(false);
      }
    };
    const begin = () => {
      setRolling(true);
      raf.current = requestAnimationFrame(tick);
    };
    if (delay > 0) timer.current = setTimeout(begin, delay);
    else begin();
    return () => {
      cancelAnimationFrame(raf.current);
      clearTimeout(timer.current);
    };
  }, [target, duration, delay, skip, from]);

  return { value, rolling };
}
