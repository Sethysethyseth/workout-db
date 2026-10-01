import { Link } from "react-router-dom";
import "../../styles/blocks/bk-library.css";

/**
 * Compact "running block" strip. Parent only renders this when an active run exists.
 */
export function LibraryRunningStrip({ name, currentWeek, totalWeeks }) {
  const weekLabel =
    currentWeek != null && totalWeeks != null
      ? `Week ${currentWeek} of ${totalWeeks}`
      : currentWeek != null
        ? `Week ${currentWeek}`
        : null;

  return (
    <Link className="bk-lib-running" to="/blocks/current">
      <div className="bk-lib-running__text">
        <p className="bk-lib-running__label">Running</p>
        <p className="bk-lib-running__name">{name?.trim() || "Block"}</p>
        {weekLabel ? <p className="bk-lib-running__week">{weekLabel}</p> : null}
      </div>
      <span className="bk-lib-running__go">Go</span>
    </Link>
  );
}
