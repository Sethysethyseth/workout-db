import { useRef } from "react";
import { SlidingIndicator } from "../motion/SlidingIndicator.jsx";

const VIEW_OPTIONS = [
  { value: "muscles", label: "Muscles" },
  { value: "strength", label: "Strength" },
  { value: "exercises", label: "Exercises" },
  { value: "execution", label: "Execution" },
];

/** Page-level Muscles | Strength | Exercises | Execution lens control. The
    selected look is ONE sliding pill (SlidingIndicator), not a per-tab tint. */
export function AnalyticsViewTabs({ value, onChange }) {
  const hostRef = useRef(null);
  return (
    <div
      ref={hostRef}
      className="analytics-view-tabs mx-slide-host"
      role="group"
      aria-label="Analytics view"
    >
      <SlidingIndicator containerRef={hostRef} activeKey={value} />
      {VIEW_OPTIONS.map(({ value: mode, label }) => (
        <button
          key={mode}
          type="button"
          className={`analytics-view-tab${value === mode ? " is-active" : ""}`}
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
