import { useEffect, useRef } from "react";
import "../../../styles/blocks/bk-ui.css";

/**
 * Horizontally scrollable week tiles with progress bars.
 * @param {{ key: string, short: string, progress: number, current?: boolean, ariaLabel: string }[]} weeks
 */
export function WeekStrip({
  weeks = [],
  selectedKey,
  onSelect,
  trailing = null,
  className = "",
  ...rest
}) {
  const selectedRef = useRef(null);
  const cls = className ? `bk-week-strip ${className}` : "bk-week-strip";

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "nearest",
        block: "nearest",
      });
    }
  }, [selectedKey]);

  return (
    <div className={cls} {...rest}>
      {weeks.map((week) => {
        const selected = week.key === selectedKey;
        const classes = [
          "bk-week",
          selected ? "bk-week--selected" : "",
          week.current ? "bk-week--current" : "",
        ]
          .filter(Boolean)
          .join(" ");
        const progress = Math.max(0, Math.min(1, Number(week.progress) || 0));
        return (
          <button
            key={week.key}
            type="button"
            ref={selected ? selectedRef : null}
            className={classes}
            aria-pressed={selected}
            aria-label={week.ariaLabel}
            onClick={() => onSelect?.(week.key)}
          >
            <span className="bk-week__label">{week.short}</span>
            <span className="bk-week__bar" aria-hidden="true">
              <span className="bk-week__fill" style={{ width: `${progress * 100}%` }} />
            </span>
          </button>
        );
      })}
      {trailing != null ? <div className="bk-week-strip__trailing">{trailing}</div> : null}
    </div>
  );
}
