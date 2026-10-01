/**
 * Compact multi-sheet picker for Excel import. BK tokens; 44px targets.
 */
export function SheetPicker({ sheets = [], value, onChange }) {
  if (!sheets.length) return null;

  return (
    <div className="bk-import-sheet-picker" role="radiogroup" aria-label="Sheet">
      <span className="bk-import-label">Sheet</span>
      <div className="bk-import-sheet-picker__options">
        {sheets.map((name) => {
          const selected = name === value;
          const cls = selected
            ? "bk-import-sheet-picker__option bk-import-sheet-picker__option--selected"
            : "bk-import-sheet-picker__option";
          return (
            <button
              key={name}
              type="button"
              role="radio"
              className={cls}
              aria-checked={selected}
              onClick={() => onChange?.(name)}
            >
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
