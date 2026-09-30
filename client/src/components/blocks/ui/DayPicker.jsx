import { useEffect, useRef } from "react";
import "../../../styles/blocks/bk-ui.css";
import { ProgressRing } from "./ProgressRing.jsx";

/**
 * Day tiles with optional progress rings and bottom-edge tags.
 * Horizontally scrolls when tiles would crush at phone widths; scrolls the
 * selected tile into view (same pattern as WeekStrip).
 * @param {{ key: string, top: string, name: string, progress?: number | null, tag?: string | null }[]} days
 */
export function DayPicker({
  days = [],
  selectedKey,
  onSelect,
  trailing = null,
  className = "",
  ...rest
}) {
  const selectedRef = useRef(null);
  const cls = className ? `bk-day-picker ${className}` : "bk-day-picker";

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
      {days.map((day) => {
        const selected = day.key === selectedKey;
        const showRing = day.progress != null;
        const classes = [
          "bk-day",
          selected ? "bk-day--selected" : "",
          showRing ? "bk-day--has-ring" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <button
            key={day.key}
            type="button"
            ref={selected ? selectedRef : null}
            className={classes}
            aria-pressed={selected}
            onClick={() => onSelect?.(day.key)}
          >
            <span className="bk-day__top">{day.top}</span>
            <span className="bk-day__name">{day.name}</span>
            {showRing ? (
              <span className="bk-day__ring">
                <ProgressRing value={day.progress} />
              </span>
            ) : null}
            {day.tag != null && day.tag !== "" ? (
              <span className="bk-day__tag">{day.tag}</span>
            ) : null}
          </button>
        );
      })}
      {trailing != null ? <div className="bk-day-picker__trailing">{trailing}</div> : null}
    </div>
  );
}
