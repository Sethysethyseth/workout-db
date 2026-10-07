import "../../../styles/blocks/bk-ui.css";
import { formatRx } from "./rxFormat.js";

/**
 * Renders formatRx parts: label in body type, value in display type.
 * `suffix` (optional) trails the parts in body type, e.g. "each side".
 */
export function ExerciseRx({ rx, suffix = null, className = "", ...rest }) {
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
      {suffix ? (
        <span className="bk-rx__part">
          <span className="bk-rx__label">{suffix}</span>
        </span>
      ) : null}
    </p>
  );
}
