import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import { startAdHocWorkoutAndNavigate } from "../lib/startAdHocWorkoutFlow.js";

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
