export function SetRow({
  setIndex,
  set: setData,
  onChange,
  onRemove,
  canRemove,
}) {
  return (
    <div className="card set-row">
      <div className="row set-row-head">
        <strong className="muted small">Set {setIndex + 1}</strong>
        {canRemove ? (
          <button type="button" className="btn btn-ghost" onClick={onRemove}>
            Remove set
          </button>
        ) : null}
      </div>
      <div className="grid-set-row">
        <label>
          Reps
          <input
            value={setData.reps}
            onChange={(e) => onChange({ reps: e.target.value })}
            inputMode="numeric"
            placeholder="e.g. 8"
          />
        </label>
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
          RIR <span className="muted small">(optional)</span>
          <input
            value={setData.rir}
            onChange={(e) => onChange({ rir: e.target.value })}
            inputMode="numeric"
            placeholder="—"
          />
        </label>
        <label>
          RPE <span className="muted small">(optional)</span>
          <input
            value={setData.rpe}
            onChange={(e) => onChange({ rpe: e.target.value })}
            inputMode="decimal"
            placeholder="—"
          />
        </label>
      </div>
    </div>
  );
}
