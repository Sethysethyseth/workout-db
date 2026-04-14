import { Link } from "react-router-dom";

export function SecondaryActions({ currentBlock }) {
  return (
    <section className="secondary-actions" aria-label="More options">
      <h2 className="secondary-actions__title muted small">Library &amp; build</h2>
      <div className="secondary-actions__grid">
        <Link className="secondary-actions__link" to="/templates">
          Browse templates
        </Link>
        <Link className="secondary-actions__link" to="/create-template?type=workout">
          Create workout
        </Link>
        <Link className="secondary-actions__link" to="/create-template?type=block">
          Create block
        </Link>
      </div>
      {currentBlock?.kind === "block" ? (
        <p className="secondary-actions__footnote muted small" style={{ margin: 0 }}>
          Current block:{" "}
          <Link to={`/blocks/${currentBlock.id}/edit`}>
            {currentBlock.name?.trim() || `Block #${currentBlock.id}`}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
