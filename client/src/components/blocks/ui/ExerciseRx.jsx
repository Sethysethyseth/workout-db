import "../../../styles/blocks/bk-ui.css";
import { formatRx } from "./rxFormat.js";

/** Renders formatRx parts: label in body type, value in display type. */
export function ExerciseRx({ rx, className = "", ...rest }) {
  const parts = formatRx(rx ?? {});
  if (!parts.length) return null;
  const cls = className ? `bk-rx ${className}` : "bk-rx";
  return (
    <p className={cls} {...rest}>
      {parts.map((part) => (
        <span key={part.key} className="bk-rx__part">
          {part.label != null && part.label !== "" ? (
            <span className="bk-rx__label">{part.label}</span>
          ) : null}
          <b className="bk-rx__value">{part.value}</b>
        </span>
      ))}
    </p>
  );
}
