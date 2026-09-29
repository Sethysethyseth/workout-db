import "../../../styles/blocks/bk-ui.css";
import "../../../styles/blocks/bk-log.css";
import { ExerciseRx } from "../ui/ExerciseRx.jsx";
import { planToRx } from "./planHelpers.js";

/**
 * Rx line + coach notes under a planned exercise name.
 * Mount only when `plan` is present.
 */
export function PlanLine({ plan, notes, unit, className = "" }) {
  if (!plan) return null;
  const rx = planToRx(plan, unit);
  const noteText = notes != null ? String(notes).trim() : "";
  if (!rx && !noteText) return null;
  const cls = className ? `bk-log-plan ${className}` : "bk-log-plan";
  return (
    <div className={cls}>
      {rx ? <ExerciseRx rx={rx} className="bk-log-plan__rx" /> : null}
      {noteText ? <p className="bk-log-plan__notes">{noteText}</p> : null}
    </div>
  );
}
