/**
 * "Let AI read this layout" offer - shown on import error / ignored-column
 * warnings when the coach consent gate would allow convert (bks1).
 */

const IMPORT_MAP_COST = 3;

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
 *   mapping: boolean,
 *   disabled?: boolean,
 *   onMap: () => void,
 * }} props
 */
export function AiLayoutOffer({
  coachStatus = null,
  mapping = false,
  disabled = false,
  onMap,
}) {
  if (!coachStatus?.available) return null;

  const weeklyCap = coachStatus.weeklyCap;
  const remaining =
    weeklyCap && typeof weeklyCap.remaining === "number"
      ? weeklyCap.remaining
      : null;
  const limit =
    weeklyCap && typeof weeklyCap.limit === "number" ? weeklyCap.limit : 7;
  const notEnough =
    weeklyCap != null && remaining != null && remaining < IMPORT_MAP_COST;
  const when = notEnough
    ? formatNextQuestionTime(weeklyCap.nextAvailableAt)
    : null;

  let costLine;
  if (weeklyCap == null) {
    costLine = "Uses 3 coach questions when the weekly limit applies.";
  } else if (notEnough) {
    costLine =
      remaining === 0
        ? when
          ? `Need 3 questions; you have 0 left. Next one frees up ${when}.`
          : "Need 3 questions; you have 0 left this week."
        : when
          ? `Need 3 questions; you have ${remaining} left. Next one frees up ${when}.`
          : `Need 3 questions; you have ${remaining} left this week.`;
  } else {
    costLine = `Uses 3 of your ${limit} weekly coach questions (${remaining} left)`;
  }

  return (
    <div className="bk-import-ai-layout" aria-busy={mapping || undefined}>
      <button
        type="button"
        className="btn btn-secondary"
        disabled={disabled || mapping || notEnough}
        onClick={onMap}
      >
        {mapping ? "Reading layout…" : "Let AI read this layout"}
      </button>
      <p className="bk-import-ai-layout__cost" role="status">
        {mapping
          ? "This can take up to a minute. Hang tight."
          : costLine}
      </p>
    </div>
  );
}

export { IMPORT_MAP_COST };
