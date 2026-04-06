import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import { ACTIVE_WORKOUT_ERROR, startAdHocWorkoutAndNavigate } from "../lib/startAdHocWorkoutFlow.js";

export function StartLogWorkoutPage() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        await startAdHocWorkoutAndNavigate(navigate, { replace: true });
      } catch (err) {
        if (!cancelled) setError(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (error) {
    if (error.code === ACTIVE_WORKOUT_ERROR && error.activeSessionId) {
      return (
        <div className="stack">
          <div className="card error">
            <strong>Workout already in progress</strong>
            <p className="mt-2" style={{ marginBottom: 0 }}>
              {error.message}{" "}
              <Link to={`/sessions/${error.activeSessionId}`}>Open your session</Link>
            </p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => navigate("/", { replace: true })}>
            Back to home
          </button>
        </div>
      );
    }
    return (
      <div className="stack">
        <ErrorMessage error={error} />
        <button type="button" className="btn btn-secondary" onClick={() => navigate("/", { replace: true })}>
          Back to home
        </button>
      </div>
    );
  }

  return <LoadingState label="Starting workout…" />;
}
