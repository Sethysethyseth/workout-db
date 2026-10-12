import { useState } from "react";
import { analyticsQuiet } from "../../lib/analyticsSessionCache.js";
import { COUNT_UP_MS, useCountUp } from "../../lib/useCountUp.js";
import { formatRolling, splitLeadingNumber } from "../../lib/motionFormat.js";

/* A return to Analytics in the same session replays faster: matches the
   --mx-count / --mx-stagger scale in analytics-motion.css (.mx-quiet). */
const RETURN_SCALE = 0.55;

/**
 * Rolls the leading number of a display string and leaves the rest alone:
 * "157.5 lbs × 4" rolls 157.5, "+47 lbs" rolls 47 behind its "+". Strings
 * with no leading number ("—", "not enough data") render as-is.
 *
 * `delay` follows the structure-first rule (the tile lands, then the number
 * rolls); callers pass the cascade slot's data delay.
 */
export function CountUp({ text, delay = 0, enabled = true, className = "" }) {
  /* Latched at mount so a later re-render (stale-while-revalidate) keeps
     the same pace instead of switching speed mid-roll. */
  const [scale] = useState(() => (analyticsQuiet() ? RETURN_SCALE : 1));
  const parts = splitLeadingNumber(text);
  const target = parts ? parts.value : NaN;
  const { value, rolling } = useCountUp(target, {
    delay: Math.round(delay * scale),
    duration: Math.round(COUNT_UP_MS * scale),
    enabled: enabled && parts != null,
  });

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
