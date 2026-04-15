import { useEffect, useState } from "react";
import * as feedbackApi from "../api/feedbackApi.js";
import { ApiError } from "../api/http.js";
import { LoadingState } from "../components/LoadingState.jsx";

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function DevFeedbackPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError(null);
      try {
        const data = await feedbackApi.listFeedback();
        if (!cancelled) {
          setItems(Array.isArray(data.feedbackItems) ? data.feedbackItems : []);
        }
      } catch (err) {
        if (!cancelled) {
          setItems(null);
          if (err instanceof ApiError && err.status === 403) {
            setError(
              new Error(
                "You are not allowed to review feedback, or review is not configured on the server."
              )
            );
          } else {
            setError(err instanceof Error ? err : new Error("Failed to load feedback."));
          }
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="settings-page stack dev-feedback-page">
      <header className="settings-page-header">
        <h1 className="settings-page-title">Feedback (dev)</h1>
        <p className="settings-page-subtitle muted small">Newest first. Manual route only.</p>
      </header>

      {error ? (
        <div className="card error" role="alert">
          {error.message}
        </div>
      ) : null}

      {items === null && !error ? <LoadingState label="Loading feedback…" /> : null}

      {items && items.length === 0 ? (
        <p className="muted small">No submissions yet.</p>
      ) : null}

      {items && items.length > 0 ? (
        <ul className="dev-feedback-list">
          {items.map((row) => (
            <li key={row.id} className="dev-feedback-card">
              <div className="dev-feedback-card__meta muted small">
                <span>{formatWhen(row.createdAt)}</span>
                <span className="dev-feedback-card__sep">·</span>
                <span>{row.user?.email || row.userId}</span>
                <span className="dev-feedback-card__sep">·</span>
                <span>{row.category}</span>
                {row.pagePath ? (
                  <>
                    <span className="dev-feedback-card__sep">·</span>
                    <span title={row.pagePath}>{row.pagePath}</span>
                  </>
                ) : null}
                {row.theme ? (
                  <>
                    <span className="dev-feedback-card__sep">·</span>
                    <span>theme: {row.theme}</span>
                  </>
                ) : null}
              </div>
              <p className="dev-feedback-card__message">{row.message}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
