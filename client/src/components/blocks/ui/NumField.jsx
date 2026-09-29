import { forwardRef } from "react";
import "../../../styles/blocks/bk-ui.css";

/** Numeric set-grid field; forwards ref and remaining input props. */
export const NumField = forwardRef(function NumField(
  { className = "", placeholder, ...rest },
  ref,
) {
  const cls = className ? `bk-num-field ${className}` : "bk-num-field";
  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      className={cls}
      placeholder={placeholder}
      {...rest}
    />
  );
});
