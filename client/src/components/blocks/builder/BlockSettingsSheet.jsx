import { useRef, useState } from "react";
import { Segmented } from "../ui/Segmented.jsx";
import { BuilderSheet, useOverlayFocus } from "./BuilderSheet.jsx";

function ActionIcon({ children }) {
  return (
    <svg
      className="bk-ex-actions__icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const EFFORT_OPTIONS = [
  { value: "rpe", label: "RPE" },
  { value: "rir", label: "RIR" },
  { value: "none", label: "None" },
];

export function effortScaleNote(effort) {
  if (effort === "rpe") return "How hard each set felt, 1-10.";
  if (effort === "rir") return "How many more reps you had left.";
  return "No RPE or RIR targets in this block.";
}

const PUBLIC_NOT_YET_MSG = "this hasnt been implemented yet bro stop prying";

export function BlockSettingsSheet({
  open,
  onClose,
  state,
  onChange,
  onDelete,
  onExport,
  onAskCoach,
  exporting = false,
  mode,
}) {
  const isDraft = Boolean(state?.isDraft);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [publicNote, setPublicNote] = useState(false);
  const cancelDeleteRef = useRef(null);

  useOverlayFocus({
    open: confirmDelete,
    onClose: () => setConfirmDelete(false),
    focusRef: cancelDeleteRef,
  });

  function handleClose() {
    setConfirmDelete(false);
    onClose?.();
  }

  function handlePublicChange(checked) {
    if (checked) {
      setPublicNote(true);
      onChange?.({ isPublic: false });
      return;
    }
    setPublicNote(false);
    onChange?.({ isPublic: false });
  }

  return (
    <>
      <BuilderSheet open={open} title="Block settings" onClose={handleClose} wide>
        <label className="bk-settings__field">
          <span className="bk-settings__label">Name</span>
          <input
            className="bk-settings__input"
            value={state?.name ?? ""}
            onChange={(e) => onChange?.({ name: e.target.value })}
            maxLength={120}
            placeholder="Name this block"
          />
        </label>

        <label className="bk-settings__field">
          <span className="bk-settings__label">Description</span>
          <textarea
            className="bk-settings__textarea"
            value={state?.description ?? ""}
            onChange={(e) => onChange?.({ description: e.target.value })}
            maxLength={2000}
            rows={3}
            placeholder="Goals, progression, notes"
          />
        </label>

        <div className="bk-settings__field">
          <span className="bk-settings__label">Effort scale</span>
          <Segmented
            label="Effort scale"
            fill
            options={EFFORT_OPTIONS}
            value={state?.effort || "none"}
            onChange={(effort) => onChange?.({ effort })}
          />
          <p className="bk-effort-note">{effortScaleNote(state?.effort || "none")}</p>
        </div>

        <div className="bk-settings__field">
          <label className="bk-settings__toggle">
            <input
              type="checkbox"
              checked={Boolean(state?.isPublic)}
              disabled={isDraft}
              onChange={(e) => handlePublicChange(e.target.checked)}
            />
            <span>Public</span>
          </label>
          {publicNote ? <p className="bk-settings__hint">{PUBLIC_NOT_YET_MSG}</p> : null}
          {isDraft ? (
            <p className="bk-settings__hint">
              Drafts stay private until you save them to your library.
            </p>
          ) : null}
        </div>

        {onExport || onAskCoach || (mode === "edit" && onDelete) ? (
          <div className="bk-ex-actions">
            {onExport ? (
              <button
                type="button"
                className="bk-ex-actions__row"
                disabled={exporting}
                onClick={() => onExport()}
              >
                <ActionIcon>
                  <path d="M12 3v12" />
                  <path d="m7 10 5 5 5-5" />
                  <path d="M5 21h14" />
                </ActionIcon>
                <span className="bk-ex-actions__label">
                  {exporting ? "Exporting…" : "Export block"}
                </span>
              </button>
            ) : null}
            {onAskCoach ? (
              <button type="button" className="bk-ex-actions__row" onClick={() => onAskCoach()}>
                <ActionIcon>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </ActionIcon>
                <span className="bk-ex-actions__label">Ask the coach about this block</span>
              </button>
            ) : null}
            {mode === "edit" && onDelete ? (
              <>
                <div className="bk-ex-actions__divider" role="separator" />
                <button
                  type="button"
                  className="bk-ex-actions__row bk-ex-actions__row--danger"
                  onClick={() => {
                    setConfirmDelete(true);
                    onClose?.();
                  }}
                >
                  <ActionIcon>
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  </ActionIcon>
                  <span className="bk-ex-actions__label">Delete block</span>
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </BuilderSheet>

      {confirmDelete ? (
        <div className="bk-builder-confirm" role="presentation">
          <button
            type="button"
            className="bk-sheet__backdrop"
            aria-label="Cancel"
            onClick={() => setConfirmDelete(false)}
          />
          <div
            className="stack session-discard-confirm bk-builder-confirm__panel"
            role="alertdialog"
            aria-labelledby="bk-delete-block-title"
          >
            <p id="bk-delete-block-title" className="session-discard-confirm__title">
              Delete this block?
            </p>
            <p className="muted small session-discard-confirm__body">
              Delete this block permanently? This cannot be undone.
            </p>
            <div className="row session-discard-confirm__actions">
              <button
                type="button"
                className="session-discard-confirm__discard"
                onClick={() => {
                  setConfirmDelete(false);
                  onDelete();
                }}
              >
                Delete block
              </button>
              <button
                ref={cancelDeleteRef}
                type="button"
                className="btn btn-secondary"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
