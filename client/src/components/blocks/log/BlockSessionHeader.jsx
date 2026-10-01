import { Card } from "../ui/Card.jsx";
import { Chip } from "../ui/Chip.jsx";
import { Eyebrow } from "../ui/Eyebrow.jsx";
import { ProgressBar } from "../ui/ProgressBar.jsx";
import "../../../styles/blocks/bk-ui.css";
import "../../../styles/blocks/bk-log.css";

/**
 * Block-day session header (recovery-logbook look).
 * Day name once as the title; block name once in the chip row.
 * Progress width = logged / total of the current counts (0% at 0/N).
 */
export function BlockSessionHeader({
  weekOrder,
  dayName,
  weekLabel,
  blockName,
  loggedSets = 0,
  totalSets = 0,
  className = "",
}) {
  const total = Math.max(0, Number(totalSets) || 0);
  const logged = Math.max(0, Number(loggedSets) || 0);
  const ratio = total > 0 ? logged / total : 0;
  const cls = className
    ? `bk-log-session bk ${className}`
    : "bk-log-session bk";

  return (
    <Card className={cls}>
      <Eyebrow>{weekOrder != null ? `Week ${weekOrder}` : "Block day"}</Eyebrow>
      <h2 className="bk-log-session__title">{dayName}</h2>
      <div className="bk-log-session__meta">
        {blockName ? <Chip>{blockName}</Chip> : null}
        {weekLabel ? <Chip tone="warn">{weekLabel}</Chip> : null}
      </div>
      <ProgressBar
        value={ratio}
        label={`${logged} of ${total} sets logged`}
        className="bk-log-session__progress"
      />
      <div className="bk-log-session__foot">
        <span className="bk-log-session__count num">
          {`${logged} / ${total} sets logged`}
        </span>
      </div>
    </Card>
  );
}
