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

export function LoadingState({ label = "Loading…", slowLabel, tone = "soft", delayed = true }) {
  const { visible, slow } = useDelayedReveal(delayed, SHOW_DELAY_MS, SLOW_DELAY_MS);
  if (!visible) return null;

  const text = slow && slowLabel ? slowLabel : label;

  if (tone === "page") {
    const showSlow = slow && slowLabel;
    return (
      <div className="loading-page" role="status" aria-live="polite">
        <div className="loading-page__content">
          <div className="loading-page__mark" aria-hidden="true">
            <span className="loading-page__ring" />
          </div>
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

  if (tone === "card") {
    return (
      <div className="card">
        <div className="muted">{text}</div>
      </div>
    );
  }
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="loading-state__dots" aria-hidden="true">
        <span className="loading-state__dot" />
        <span className="loading-state__dot" />
        <span className="loading-state__dot" />
      </span>
      <span className="loading-state__text">{text}</span>
    </div>
  );
}
