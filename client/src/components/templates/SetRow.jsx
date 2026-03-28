export function SetRow({
  setIndex,
  set: setData,
  onChange,
  onRemove,
  canRemove,
  useRIR = false,
  useRPE = false,
}) {
  const colCount = 2 + (useRIR ? 1 : 0) + (useRPE ? 1 : 0);
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
            <input
              value={setData.rpe}
              onChange={(e) => onChange({ rpe: e.target.value })}
              inputMode="decimal"
              placeholder="—"
            />
          </label>
        ) : null}
      </div>
    </div>
  );
}
