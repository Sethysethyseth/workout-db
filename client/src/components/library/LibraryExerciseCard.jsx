import { useEffect, useRef, useState } from "react";
import { Card } from "../blocks/ui/index.js";
import { AddExerciseToLibrarySheet } from "../workout/AddExerciseToLibrarySheet.jsx";
import { summarizeCustomExerciseMuscles } from "./meta.js";
import "../../styles/blocks/bk-library.css";

export function LibraryExerciseCard({
  exercise: x,
  busy,
  isActing,
  actingAction,
  onDelete,
  onUpdated,
}) {
  const muscleSummary = summarizeCustomExerciseMuscles(x.muscles);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const keepBtnRef = useRef(null);
  const savedTimerRef = useRef(null);

  useEffect(() => {
    if (!confirmDelete) return;
    keepBtnRef.current?.focus();
  }, [confirmDelete]);

  useEffect(() => {
    if (!confirmDelete) return undefined;
    function onKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        setConfirmDelete(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmDelete]);

  useEffect(() => () => clearTimeout(savedTimerRef.current), []);

  function openEdit() {
    if (busy || confirmDelete) return;
    setEditOpen(true);
  }

  function acknowledgeSaved() {
    setSaved(true);
    clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card className="bk-lib-card">
      <button type="button" className="bk-lib-card__open" onClick={openEdit} disabled={busy}>
        <h2 className="bk-lib-card__title">{x.name}</h2>
        {muscleSummary ? <p className="bk-lib-card__meta">{muscleSummary}</p> : null}
      </button>
      {saved ? (
        <p className="bk-lib-card__saved" role="status">
          Saved
        </p>
      ) : null}
      {confirmDelete ? (
        <div
          className="stack session-discard-confirm bk-lib-card-confirm"
          role="alertdialog"
          aria-labelledby={`bk-lib-del-ex-title-${x.id}`}
        >
          <p
            id={`bk-lib-del-ex-title-${x.id}`}
            className="muted small session-discard-confirm__title"
          >
            Delete &ldquo;{x.name}&rdquo;?
          </p>
          <p className="muted small session-discard-confirm__body">
            Sessions that used it keep their logged sets, but they lose the link to this exercise,
            so analytics stops attributing those sets to its muscles.
          </p>
          <div className="row session-discard-confirm__actions">
            <button
              type="button"
              className="session-discard-confirm__discard"
              disabled={busy}
              onClick={() => {
                setConfirmDelete(false);
                onDelete(x);
              }}
            >
              {isActing && actingAction === "delete" ? "Deleting…" : "Delete exercise"}
            </button>
            <button
              ref={keepBtnRef}
              type="button"
              className="btn btn-secondary"
              disabled={busy}
              onClick={() => setConfirmDelete(false)}
            >
              Keep
            </button>
          </div>
        </div>
      ) : (
        <div className="bk-lib-card__secondary" style={{ borderTop: "none", paddingTop: 0 }}>
          <button
            type="button"
            className="bk-lib-btn bk-lib-btn--ghost"
            onClick={openEdit}
            disabled={busy}
          >
            Edit
          </button>
          <button
            type="button"
            className="bk-lib-btn bk-lib-btn--ghost bk-lib-btn--danger"
            onClick={() => setConfirmDelete(true)}
            disabled={busy}
          >
            Delete
          </button>
        </div>
      )}
      <AddExerciseToLibrarySheet
        open={editOpen}
        mode="edit"
        exercise={x}
        onClose={() => setEditOpen(false)}
        onSaved={(updated) => {
          setEditOpen(false);
          if (onUpdated) onUpdated(updated);
          acknowledgeSaved();
        }}
      />
    </Card>
  );
}
