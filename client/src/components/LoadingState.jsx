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
    return (
      <div className="loading-page" role="status" aria-live="polite">
        <span className="loading-page__text">{text}</span>
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
      <span className="loading-state__text">{text}</span>
    </div>
  );
}
