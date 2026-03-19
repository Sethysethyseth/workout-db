export function LoadingState({ label = "Loading…" }) {
  return (
    <div className="card">
      <div className="muted">{label}</div>
    </div>
  );
}

