import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function DashboardPage() {
  const { currentUser } = useAuth();

  return (
    <div className="stack">
      <div className="card">
        <h1>Dashboard</h1>
        <p className="muted">Signed in as {currentUser.email}</p>
      </div>

      <div className="grid-2">
        <div className="card stack">
          <h2>Templates</h2>
          <div className="row">
            <Link className="btn btn-secondary" to="/templates">
              My templates
            </Link>
            <Link className="btn btn-secondary" to="/templates/public">
              Public templates
            </Link>
            <Link className="btn" to="/templates/new">
              Create template
            </Link>
          </div>
        </div>

        <div className="card stack">
          <h2>Sessions</h2>
          <div className="row">
            <Link className="btn btn-secondary" to="/sessions">
              Session history
            </Link>
          </div>
          <p className="muted small">
            Start a session from a template to begin logging sets.
          </p>
        </div>
      </div>
    </div>
  );
}

