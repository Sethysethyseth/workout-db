import { useRef } from "react";
import { analyticsQuiet } from "../../lib/analyticsSessionCache.js";
import { useCountUp } from "../../lib/useCountUp.js";
import { formatRolling, splitLeadingNumber } from "../../lib/motionFormat.js";

/**
 * Rolls the leading number of a display string and leaves the rest alone:
 * "157.5 lbs × 4" rolls 157.5, "+47 lbs" rolls 47 behind its "+". Strings
 * with no leading number ("—", "not enough data") render as-is.
 *
 * `delay` follows the structure-first rule (the tile lands, then the number
 * rolls); callers pass the cascade slot's data delay.
 */
export function CountUp({ text, delay = 0, enabled = true, className = "" }) {
  /* A quiet Analytics return prints the cached number. A later change
     (stale-while-revalidate) rolls from that number and keeps rolling;
     the flag is latched so a re-render does not cancel it. */
  const initialText = useRef(text);
  const quietMount = useRef(analyticsQuiet());
  const roll = enabled && (!quietMount.current || text !== initialText.current);
  const parts = splitLeadingNumber(text);
  const target = parts ? parts.value : NaN;
  const { value, rolling } = useCountUp(target, { delay, enabled: roll && parts != null });

  if (!parts) return <span className={className || undefined}>{text}</span>;

  /* Always show the hook's value: it holds `from` (or the last shown value)
     until the delayed roll starts, so the final number never flashes in
     first and then snaps back to roll. */
  const shown = formatRolling(value, parts.decimals, parts.grouped);
  const cls = `${className}${rolling ? " mx-rolling" : ""}`.trim();
  return (
    <span className={cls || undefined}>
      {parts.prefix}
      {shown}
      {parts.rest}
    </span>
  );
}
