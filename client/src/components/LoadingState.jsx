import { useEffect, useState } from "react";

const SHOW_DELAY_MS = 400;
const SLOW_DELAY_MS = 4000;

// Cold-start UX per WORKOUTDB_MASTER_PROMPT_17.md ("Motion / loading"):
// fast/cached loads never flash a loader; only a load that's actually slow
// escalates to honest copy ("waking up the server...").
function useDelayedReveal(enabled, delayMs, slowMs) {
  const [visible, setVisible] = useState(!enabled);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const showTimer = setTimeout(() => setVisible(true), delayMs);
    const slowTimer = setTimeout(() => setSlow(true), delayMs + slowMs);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(slowTimer);
    };
  }, [enabled, delayMs, slowMs]);

  return { visible, slow };
}

/**
 * The one waiting motif: a barbell that loads plates from the inside out,
 * holds, and unloads. Pure CSS; `plates` sets how many pairs.
 */
export function Barbell({ plates = 3, inline = false, className = "" }) {
  const pairs = Math.max(1, Math.min(3, plates));
  const sides = [];
  for (let i = pairs; i >= 1; i -= 1) sides.push(`l${i}`);
  for (let i = 1; i <= pairs; i += 1) sides.push(`r${i}`);
  return (
    <span
      className={`barbell${inline ? " barbell--inline" : ""}${className ? ` ${className}` : ""}`}
      aria-hidden="true"
    >
      <span className="barbell__bar" />
      {sides.map((side) => (
        <span key={side} className={`barbell__plate barbell__plate--${side}`} />
      ))}
    </span>
  );
}

const SKELETON_VARIANTS = {
  /* History / Library / roster: a stack of row cards. */
  list: ({ rows }) => (
    <div className="skeleton skeleton--list">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton__row" />
      ))}
    </div>
  ),
  /* Analytics: KPI tiles, then a chart-sized block. */
  analytics: () => (
    <div className="skeleton skeleton--analytics">
      <div className="skeleton__tiles">
        <div className="skeleton__tile" />
        <div className="skeleton__tile" />
        <div className="skeleton__tile" />
        <div className="skeleton__tile" />
      </div>
      <div className="skeleton__block" />
    </div>
  ),
  /* A workout or template: a title line, then exercise blocks. */
  session: ({ rows }) => (
    <div className="skeleton skeleton--session">
      <div className="skeleton__title" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton__block skeleton__block--short" />
      ))}
    </div>
  ),
  /* Settings-style detail: a couple of grouped rows. */
  settings: () => (
    <div className="skeleton skeleton--settings">
      <div className="skeleton__block skeleton__block--short" />
      <div className="skeleton__row" />
    </div>
  ),
};

export function LoadingState({
  label = "Loading…",
  slowLabel,
  tone = "soft",
  delayed = true,
  variant = "list",
  rows = 3,
}) {
  const { visible, slow } = useDelayedReveal(delayed, SHOW_DELAY_MS, SLOW_DELAY_MS);
  if (!visible) return null;

  const text = slow && slowLabel ? slowLabel : label;

  if (tone === "page") {
    const showSlow = slow && slowLabel;
    return (
      <div className="loading-page" role="status" aria-live="polite">
        <div className="loading-page__content">
          <div className="loading-page__mark" aria-hidden="true">
            <span className="loading-page__wordmark" />
            <span className="loading-page__crown" />
          </div>
          <Barbell plates={3} className="loading-page__barbell" />
          <div className="loading-page__text-wrap">
            <span
              className={`loading-page__text loading-page__text--primary${showSlow ? " loading-page__text--hidden" : ""}`}
            >
              {label}
            </span>
            {slowLabel ? (
              <span
                className={`loading-page__text loading-page__text--slow${showSlow ? " loading-page__text--visible" : ""}`}
              >
                {slowLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  if (tone === "skeleton") {
    const render = SKELETON_VARIANTS[variant] || SKELETON_VARIANTS.list;
    return (
      <div className="skeleton-wrap" role="status" aria-live="polite" aria-label={text}>
        {render({ rows })}
        <div className="skeleton__caption">
          <Barbell plates={2} inline />
          <span className="skeleton__caption-text">{text}</span>
        </div>
      </div>
    );
  }

  if (tone === "card") {
    return (
      <div className="card">
        <div className="muted">{text}</div>
      </div>
    );
  }
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <Barbell plates={2} inline />
      <span className="loading-state__text">{text}</span>
    </div>
  );
}
