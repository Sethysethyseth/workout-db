import { useEffect, useState } from "react";
import "../../styles/ai-wait.css";

const SHOW_DELAY_MS = 400;
const SLOW_DELAY_MS = 15_000;
const ALMOST_DELAY_MS = 45_000;

const SLOW_COPY = "Still working - big blocks can take up to a minute.";
const ALMOST_COPY = "Almost there. Hang tight.";

/**
 * Shared AI wait: LogChamp crown + optional copy ladder.
 * - inline: 16px crown left of the busy-button verb (immediate)
 * - block: 28px crown above the ladder (panel-filling waits)
 * - status: ladder only, under a busy button
 */
export function AiWait({ variant = "inline", verb }) {
  const [line, setLine] = useState(null);
  const [lineKey, setLineKey] = useState(0);

  useEffect(() => {
    if (variant === "inline") return undefined;
    let cancelled = false;
    // Under a busy button the verb is already on the button: the status
    // line stays quiet until the wait is genuinely slow.
    const showTimer = setTimeout(() => {
      if (!cancelled && variant !== "status") {
        setLine(verb);
        setLineKey((k) => k + 1);
      }
    }, SHOW_DELAY_MS);
    const slowTimer = setTimeout(() => {
      if (!cancelled) {
        setLine(SLOW_COPY);
        setLineKey((k) => k + 1);
      }
    }, SLOW_DELAY_MS);
    const almostTimer = setTimeout(() => {
      if (!cancelled) {
        setLine(ALMOST_COPY);
        setLineKey((k) => k + 1);
      }
    }, ALMOST_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(showTimer);
      clearTimeout(slowTimer);
      clearTimeout(almostTimer);
    };
  }, [variant, verb]);

  if (variant === "inline") {
    return (
      <span className="ai-wait ai-wait--inline">
        <span className="ai-wait__crown" aria-hidden="true" />
        <span className="ai-wait__label">{verb}</span>
      </span>
    );
  }

  if (variant === "status") {
    return (
      <p className="ai-wait ai-wait--status" role="status" aria-live="polite">
        {line ? (
          <span key={lineKey} className="ai-wait__copy">
            {line}
          </span>
        ) : (
          "\u00a0"
        )}
      </p>
    );
  }

  return (
    <div className="ai-wait ai-wait--block" role="status" aria-live="polite">
      <span className="ai-wait__crown" aria-hidden="true" />
      {line ? (
        <span key={lineKey} className="ai-wait__copy">
          {line}
        </span>
      ) : (
        <span className="ai-wait__copy" aria-hidden="true">
          {"\u00a0"}
        </span>
      )}
    </div>
  );
}

/**
 * Idle + busy content stacked in one grid cell and BOTH always rendered, so
 * the button is sized to the wider of the two and never jumps.
 */
export function AiWaitButtonLabel({ busy, idle, verb }) {
  return (
    <span className="ai-wait-btn-slot">
      <span className="ai-wait-btn-slot__face" data-hidden={busy ? "true" : undefined}>
        {idle}
      </span>
      <span
        className="ai-wait-btn-slot__face"
        data-hidden={busy ? undefined : "true"}
        aria-hidden={busy ? undefined : "true"}
      >
        <AiWait variant="inline" verb={verb} />
      </span>
    </span>
  );
}
