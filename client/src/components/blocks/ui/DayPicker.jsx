import { useEffect, useRef } from "react";
import "../../../styles/blocks/bk-ui.css";
import { ProgressRing } from "./ProgressRing.jsx";
import { useHoldToReorder } from "./useHoldToReorder.js";

/**
 * Day tiles with optional progress rings and bottom-edge tags.
 * Horizontally scrolls when tiles would crush at phone widths; scrolls the
 * selected tile into view (same pattern as WeekStrip).
 * Optional `onReorder(fromIndex, toIndex)` enables hold-to-drag reorder.
 * @param {{ key: string, top: string, name: string, progress?: number | null, tag?: string | null }[]} days
 */
export function DayPicker({
  days = [],
  selectedKey,
  onSelect,
  onReorder,
  trailing = null,
  className = "",
  scrollEndToken = null,
  ...rest
}) {
  const selectedRef = useRef(null);
  const prevEndToken = useRef(scrollEndToken);
  const reorderEnabled = typeof onReorder === "function";
  const {
    containerRef,
    containerClassName,
    setItemRef,
    getItemStyle,
    getItemClassNames,
    getItemPointerProps,
  } = useHoldToReorder({
    enabled: reorderEnabled,
    itemCount: days.length,
    onReorder,
  });

  const cls = ["bk-day-picker", className, containerClassName].filter(Boolean).join(" ");

  useEffect(() => {
    const tokenChanged = scrollEndToken != null && scrollEndToken !== prevEndToken.current;
    prevEndToken.current = scrollEndToken;
    if (tokenChanged && containerRef.current) {
      containerRef.current.scrollTo({ left: containerRef.current.scrollWidth, behavior: "auto" });
      return;
    }
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "nearest",
        block: "nearest",
      });
    }
  }, [selectedKey, scrollEndToken]);

  return (
    <div ref={containerRef} className={cls} {...rest}>
      {days.map((day, index) => {
        const selected = day.key === selectedKey;
        const showRing = day.progress != null;
        const baseClasses = [
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
            ref={(el) => {
              setItemRef(index, el);
              if (selected) selectedRef.current = el;
            }}
            className={getItemClassNames(index, baseClasses)}
            style={getItemStyle(index)}
            aria-pressed={selected}
            onClick={() => onSelect?.(day.key)}
            {...getItemPointerProps(index)}
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
