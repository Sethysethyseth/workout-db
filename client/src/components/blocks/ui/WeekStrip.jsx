import { useEffect, useRef } from "react";
import "../../../styles/blocks/bk-ui.css";
import { useHoldToReorder } from "./useHoldToReorder.js";

/**
 * Horizontally scrollable week tiles with progress bars.
 * Optional `onReorder(fromIndex, toIndex)` enables hold-to-drag reorder.
 * @param {{ key: string, short: string, progress: number, current?: boolean, ariaLabel: string }[]} weeks
 */
export function WeekStrip({
  weeks = [],
  selectedKey,
  onSelect,
  onReorder,
  trailing = null,
  className = "",
  ...rest
}) {
  const selectedRef = useRef(null);
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
    itemCount: weeks.length,
    onReorder,
  });

  const cls = ["bk-week-strip", className, containerClassName].filter(Boolean).join(" ");

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
    <div ref={containerRef} className={cls} {...rest}>
      {weeks.map((week, index) => {
        const selected = week.key === selectedKey;
        const baseClasses = [
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
            ref={(el) => {
              setItemRef(index, el);
              if (selected) selectedRef.current = el;
            }}
            className={getItemClassNames(index, baseClasses)}
            style={getItemStyle(index)}
            aria-pressed={selected}
            aria-label={week.ariaLabel}
            onClick={() => onSelect?.(week.key)}
            {...getItemPointerProps(index)}
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
