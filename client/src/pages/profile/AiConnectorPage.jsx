import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as aiApi from "../../api/aiApi.js";
import { ErrorMessage } from "../../components/ErrorMessage.jsx";
import { LoadingState } from "../../components/LoadingState.jsx";

function formatGrantDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function AiConnectorPage() {
  const [consent, setConsent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await aiApi.getAiConsent();
        if (!cancelled) setConsent(data);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onToggle() {
    if (!consent || submitting) return;
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const data = consent.granted
        ? await aiApi.revokeAiConsent()
        : await aiApi.grantAiConsent();
      setConsent(data);
      setSuccess(
        data.granted ? "AI access turned on." : "AI access turned off."
      );
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <LoadingState slowLabel="Waking up the server…" />;
  }

  const granted = Boolean(consent?.granted);
  const grantDate = formatGrantDate(consent?.grantedAt);

  return (
    <div className="settings-page stack">
      <Link to="/profile" className="settings-page-back">
        &larr; Profile
      </Link>
      <header className="settings-page-header">
        <h1 className="settings-page-title">AI access</h1>
      </header>

      <ErrorMessage error={error} />

      <section className="settings-section" aria-labelledby="settings-ai-heading">
        <h2 id="settings-ai-heading" className="settings-section-heading">
          AI access
        </h2>
        <div className="settings-group">
          {success ? (
            <div className="settings-feedback settings-feedback--success" role="status">
              {success}
            </div>
          ) : null}
          <p>
            LogChamp can answer questions about your training inside an AI
            assistant you already use. This is off until you turn it on.
          </p>
          <p>
            Only your computed summary leaves LogChamp - totals, trends,
            personal records, and how complete your effort data is. Your
            individual sets, notes, and account details are never sent.
          </p>
          <p>
            You can turn this off at any time, which immediately cuts off
            access.
          </p>
          <p>
            {granted && grantDate
              ? `AI access is on. You turned it on on ${grantDate}.`
              : "AI access is off."}
          </p>
          <div className="settings-security-actions">
            <button
              className="btn"
              type="button"
              disabled={submitting}
              onClick={() => void onToggle()}
            >
              {submitting
                ? granted
                  ? "Turning off…"
                  : "Turning on…"
                : granted
                  ? "Turn off AI access"
                  : "Turn on AI access"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
