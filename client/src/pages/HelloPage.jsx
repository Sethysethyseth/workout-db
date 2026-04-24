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
          What this is: This is a mobile friendly workout tracker, made for fast logging and creating workout
          blocks and programs. I intend to add many different features, but for now I want to fully optimize
          the workout logging before I go into the next step. This is where you come in.
        </p>
      </section>

      <section className="card stack" aria-labelledby="hello-try">
        <h2 id="hello-try" style={{ margin: 0 }}>
          Some things to try
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
          Feedback:
        </h2>
        <ul className="stack" style={{ margin: 0, paddingLeft: 18 }}>
          <li>Please let me know anything and everything.</li>
          <li>
            For this test you all likely know me so you can either send feedback here or throw me a text.
          </li>
          <li>
            The loading in and switching from different tabs is probably going to be slow due to me using free
            servers,
          </li>
          <li>
            so please let me know any bugs you find or improvements that you think might be worthwhile!
          </li>
        </ul>
        <div className="row" style={{ justifyContent: "flex-start", gap: 10, marginTop: 2 }}>
          <button className="btn btn-secondary" type="button" onClick={() => navigate("/profile")}>
            Send feedback here
          </button>
          <span className="muted small">Or throw me a text</span>
        </div>
      </section>
    </div>
  );
}

