import { useRef } from "react";
import { SlidingIndicator } from "../motion/SlidingIndicator.jsx";

const DEFAULT_OPTIONS = [
  { value: "chart", label: "Chart" },
  { value: "table", label: "Table" },
];

/** Chart | Table segmented chips for an analytics card head - the accessible
    twin of every chart. One sliding selected pill, same as the view tabs. */
export function ChartTableToggle({ value, onChange, cardName, options = DEFAULT_OPTIONS }) {
  const hostRef = useRef(null);
  return (
    <div
      ref={hostRef}
      className="chart-table-toggle mx-slide-host"
      role="group"
      aria-label={`${cardName} view mode`}
    >
      <SlidingIndicator containerRef={hostRef} activeKey={value} />
      {options.map(({ value: mode, label }) => (
        <button
          key={mode}
          type="button"
          className={`range-chip view-chip${value === mode ? " is-active" : ""}`}
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
