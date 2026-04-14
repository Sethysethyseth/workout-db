import { useEffect, useMemo, useRef, useState } from "react";
import { getExerciseSuggestions } from "../../lib/exerciseSuggestions.js";

/**
 * Exercise name text field with lightweight suggestion list (max 5).
 * Selection is optional — the user can always keep typing a custom name.
 */
export function ExerciseNameInput({
  id,
  value,
  onChange,
  onBlur,
  onKeyDown,
  disabled,
  placeholder,
  autoComplete = "off",
  "aria-label": ariaLabel,
}) {
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);

  const suggestions = useMemo(() => getExerciseSuggestions(value, 5), [value]);

  useEffect(() => {
    function onDocDown(e) {
      if (!wrapRef.current || wrapRef.current.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, []);

  return (
    <div className="exercise-name-input-wrap" ref={wrapRef}>
      <input
        id={id}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-label={ariaLabel}
        aria-expanded={open && suggestions.length > 0}
        aria-controls={suggestions.length > 0 ? `${id || "ex"}-suggestions` : undefined}
        aria-autocomplete="list"
        onChange={(e) => {
          setOpen(true);
          onChange(e);
        }}
        onFocus={() => setOpen(true)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
      />
      {open && suggestions.length > 0 && !disabled ? (
        <ul
          id={`${id || "ex"}-suggestions`}
          className="exercise-name-suggestions"
          role="listbox"
        >
          {suggestions.map((label) => (
            <li key={label} role="presentation">
              <button
                type="button"
                className="exercise-name-suggestion-btn"
                role="option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange({ target: { value: label } });
                  setOpen(false);
                }}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
