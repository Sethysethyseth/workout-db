import { BuilderSheet } from "./BuilderSheet.jsx";

/**
 * One-setting sheet for the expanded exercise card chips.
 * Phone: bottom sheet; >=720px: centered dialog (via BuilderSheet).
 */
export function ExerciseSettingSheet({ open, title, onClose, children }) {
  return (
    <BuilderSheet
      open={open}
      title={title}
      onClose={onClose}
      className="bk-sheet--ex-setting"
    >
      {children}
    </BuilderSheet>
  );
}
