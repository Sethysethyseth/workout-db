import { useRef } from "react";
import "../../../styles/blocks/bk-ui.css";

/**
 * Radiogroup of option buttons; arrow keys move the selection.
 * @param {{ value: string, label: string }[]} options
 */
export function Segmented({
  options = [],
  value,
  onChange,
  label,
  className = "",
  fill = false,
  ...rest
}) {
  const refs = useRef(new Map());
  const cls = ["bk-segmented", fill ? "bk-segmented--fill" : "", className].filter(Boolean).join(" ");
  const index = options.findIndex((o) => o.value === value);

  function selectAt(i) {
    const opt = options[i];
    if (!opt) return;
    onChange?.(opt.value);
    const el = refs.current.get(opt.value);
    if (el) el.focus();
  }

  function onKeyDown(e) {
    if (!options.length) return;
    let next = index;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      next = index < 0 ? 0 : (index + 1) % options.length;
      selectAt(next);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      next = index < 0 ? options.length - 1 : (index - 1 + options.length) % options.length;
      selectAt(next);
    } else if (e.key === "Home") {
      e.preventDefault();
      selectAt(0);
    } else if (e.key === "End") {
      e.preventDefault();
      selectAt(options.length - 1);
    }
  }

  return (
    <div
      className={cls}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      {...rest}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        const optCls = selected
          ? "bk-segmented__option bk-segmented__option--selected"
          : "bk-segmented__option";
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            className={optCls}
            aria-checked={selected}
            tabIndex={selected || (index < 0 && opt === options[0]) ? 0 : -1}
            ref={(el) => {
              if (el) refs.current.set(opt.value, el);
              else refs.current.delete(opt.value);
            }}
            onClick={() => onChange?.(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
