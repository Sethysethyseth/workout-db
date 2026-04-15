import { useNavigate } from "react-router-dom";

export function HelloPage() {
  const navigate = useNavigate();

  return (
    <div className="settings-page stack" style={{ maxWidth: "42rem" }}>
      <header className="settings-page-header">
        <div className="row" style={{ alignItems: "baseline", justifyContent: "space-between" }}>
          <h1 className="settings-page-title">Hello!</h1>
          <span className="pill" aria-label="Beta">
            Beta
          </span>
        </div>
        <p className="settings-page-subtitle muted small">Welcome to WorkoutDB Beta</p>
      </header>

      <section className="card stack" aria-labelledby="hello-intro">
        <h2 id="hello-intro" style={{ margin: 0 }}>
          What this is
        </h2>
        <p className="muted" style={{ margin: 0 }}>
          WorkoutDB is a mobile-first workout tracker built for fast logging and clear workout structure.
        </p>
      </section>

      <section className="card stack" aria-labelledby="hello-try">
        <h2 id="hello-try" style={{ margin: 0 }}>
          What to try
        </h2>
        <ul className="stack" style={{ margin: 0, paddingLeft: 18 }}>
          <li>Quick Log Workout</li>
          <li>Create Workout (from a program/template)</li>
          <li>Add exercises and sets</li>
          <li>Finish a workout</li>
          <li>Reopen a logged or active session (if you have one)</li>
        </ul>
      </section>

      <section className="card stack" aria-labelledby="hello-feedback">
        <h2 id="hello-feedback" style={{ margin: 0 }}>
          Helpful feedback
        </h2>
        <ul className="stack" style={{ margin: 0, paddingLeft: 18 }}>
          <li>Anything confusing</li>
          <li>Anything that feels slow or clunky</li>
          <li>Anything that looks broken on mobile</li>
          <li>Features you expected to find</li>
        </ul>
        <div className="row" style={{ justifyContent: "flex-start", gap: 10, marginTop: 2 }}>
          <button className="btn btn-secondary" type="button" onClick={() => navigate("/profile")}>
            Send feedback
          </button>
          <span className="muted small">Opens Profile → Beta feedback</span>
        </div>
      </section>
    </div>
  );
}

