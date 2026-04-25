import { WorkoutSetRowShell } from "../workout/WorkoutSetRowShell.jsx";

export function SetRow({
  setIndex,
  set: setData,
  onChange,
  onRemove,
  canRemove,
  useRIR = false,
  useRPE = false,
  useSetNotes = false,
}) {
  const colCount = 2 + (useRIR ? 1 : 0) + (useRPE ? 1 : 0);
  return (
    <WorkoutSetRowShell
      label={`Set ${setIndex + 1}`}
      canRemove={canRemove}
      onRemove={onRemove}
      disabled={false}
    >
      <div className="grid-set-row" style={{ "--set-cols": colCount }}>
        <label>
          Weight
          <input
            value={setData.weight}
            onChange={(e) => onChange({ weight: e.target.value })}
            inputMode="decimal"
            placeholder="e.g. 185"
          />
        </label>
        <label>
          Reps
          <input
            value={setData.reps}
            onChange={(e) => onChange({ reps: e.target.value })}
            inputMode="numeric"
            placeholder="e.g. 8"
          />
        </label>
        {useRIR ? (
          <label>
            RIR <span className="muted small">(optional)</span>
            <span className="muted small" style={{ display: "block", fontWeight: 400, lineHeight: 1.25 }}>
              Reps in Reserve
            </span>
            <input
              value={setData.rir}
              onChange={(e) => onChange({ rir: e.target.value })}
              inputMode="numeric"
              placeholder="—"
            />
          </label>
        ) : null}
        {useRPE ? (
          <label>
            RPE <span className="muted small">(optional)</span>
            <span className="muted small" style={{ display: "block", fontWeight: 400, lineHeight: 1.25 }}>
              Rating of Perceived Exertion
            </span>
            <input
              value={setData.rpe}
              onChange={(e) => onChange({ rpe: e.target.value })}
              inputMode="decimal"
              placeholder="—"
            />
          </label>
        ) : null}
      </div>
      {useSetNotes ? (
        <label className="mt-2" style={{ display: "grid", gap: 6, fontWeight: 600 }}>
          Notes <span className="muted small">(optional)</span>
          <input
            value={setData.notes ?? ""}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="—"
          />
        </label>
      ) : null}
    </WorkoutSetRowShell>
  );
}
