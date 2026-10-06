/**
 * "Have AI fix this file" offer - shown when import has problems (bkr3).
 * Replaces the old AiLayoutOffer / pre-preview convert buttons.
 */

import { AiWait } from "../../coach/AiWait.jsx";

const IMPORT_FIX_MAX_COST = 4;
const IMPORT_FIX_SLOW_COPY =
  "Still reading your file - long files take up to a minute.";

function formatNextQuestionTime(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
  const time = d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${weekday} at ${time}`;
}

/**
 * @param {{
 *   coachStatus: object|null,
 *   fixing: boolean,
 *   disabled?: boolean,
 *   onFix: () => void,
 *   buttonLabel: import("react").ReactNode,
 *   waitVerb?: string,
 * }} props
 */
export function AiFileFixOffer({
  coachStatus = null,
  fixing = false,
  disabled = false,
  onFix,
  buttonLabel,
  waitVerb = "Fixing your file...",
}) {
  if (!coachStatus?.available) return null;

  const weeklyCap = coachStatus.weeklyCap;
  const remaining =
    weeklyCap && typeof weeklyCap.remaining === "number"
      ? weeklyCap.remaining
      : null;
  const notEnough =
    weeklyCap != null && remaining != null && remaining < IMPORT_FIX_MAX_COST;
  const when = notEnough
    ? formatNextQuestionTime(weeklyCap.nextAvailableAt)
    : null;

  let costLine;
  if (weeklyCap == null) {
    costLine = "Uses 1-4 coach uses.";
  } else if (notEnough) {
    costLine = when
      ? `Needs 4 coach uses - you have ${remaining} left. More free up ${when}.`
      : `Needs 4 coach uses - you have ${remaining} left.`;
  } else {
    costLine = `Uses 1-4 coach uses - you have ${remaining} left this week.`;
  }

  return (
    <div className="bk-import-ai-layout">
      <button
        type="button"
        className="btn btn-secondary"
        disabled={disabled || fixing || notEnough}
        aria-busy={fixing || undefined}
        onClick={onFix}
      >
        {buttonLabel}
      </button>
      <div className="bk-import-ai-layout__cost">
        {fixing ? (
          <AiWait
            variant="status"
            verb={waitVerb}
            slowCopy={IMPORT_FIX_SLOW_COPY}
          />
        ) : (
          <p className="bk-import-ai-layout__cost-text" role="status">
            {costLine}
          </p>
        )}
      </div>
    </div>
  );
}

export { IMPORT_FIX_MAX_COST, formatNextQuestionTime };
