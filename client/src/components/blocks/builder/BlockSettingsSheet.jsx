import { useState } from "react";
import { Segmented } from "../ui/Segmented.jsx";
import { BuilderSheet } from "./BuilderSheet.jsx";

const EFFORT_OPTIONS = [
  { value: "rpe", label: "RPE" },
  { value: "rir", label: "RIR" },
  { value: "none", label: "None" },
];

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

  function handleClose() {
    setConfirmDelete(false);
    onClose?.();
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
            options={EFFORT_OPTIONS}
            value={state?.effort || "none"}
            onChange={(effort) => onChange?.({ effort })}
          />
        </div>

        <div className="bk-settings__field">
          <label className="bk-settings__toggle">
            <input
              type="checkbox"
              checked={Boolean(state?.isPublic)}
              disabled={isDraft}
              onChange={(e) => onChange?.({ isPublic: e.target.checked })}
            />
            <span>Public</span>
          </label>
          {isDraft ? (
            <p className="bk-settings__hint">
              Drafts stay private until you save them to your library.
            </p>
          ) : (
            <p className="bk-settings__hint">
              Visible to others for clone. Beta: community sharing is still in progress.
            </p>
          )}
        </div>

        {onExport ? (
          <div className="bk-settings__field">
            <button
              type="button"
              className="bk-actions-list__btn"
              disabled={exporting}
              onClick={() => onExport()}
            >
              {exporting ? "Exporting…" : "Export block"}
            </button>
          </div>
        ) : null}

        {onAskCoach ? (
          <div className="bk-settings__field">
            <button type="button" className="bk-actions-list__btn" onClick={() => onAskCoach()}>
              Ask the coach about this block
            </button>
          </div>
        ) : null}

        {mode === "edit" && onDelete ? (
          <div className="bk-settings__danger">
            <button
              type="button"
              className="bk-settings__delete"
              onClick={() => {
                setConfirmDelete(true);
                onClose?.();
              }}
            >
              Delete block
            </button>
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
            <p
              id="bk-delete-block-title"
              className="muted small session-discard-confirm__title"
            >
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
