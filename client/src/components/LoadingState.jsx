export function LoadingState({ label = "Loading…", tone = "soft" }) {
  if (tone === "card") {
    return (
      <div className="card">
        <div className="muted">{label}</div>
      </div>
    );
  }
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="loading-state__text">{label}</span>
    </div>
  );
}
