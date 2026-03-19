import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as templateApi from "../api/templateApi.js";
import * as sessionApi from "../api/sessionApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { LoadingState } from "../components/LoadingState.jsx";

export function TemplatesPublicPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await templateApi.getPublicTemplates();
      setTemplates(data.templates || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onClone(id) {
    setError(null);
    try {
      await templateApi.cloneTemplate(id);
      navigate("/templates");
    } catch (err) {
      setError(err);
    }
  }

  async function onStart(templateId) {
    setError(null);
    try {
      const data = await sessionApi.startSession(templateId);
      navigate(`/sessions/${data.session.id}`);
    } catch (err) {
      setError(err);
    }
  }

  return (
    <div className="stack">
      <div className="row">
        <div>
          <h1>Public Templates</h1>
          <p className="muted">Clone a template to edit it, or start a session.</p>
        </div>
        <button className="btn btn-secondary" onClick={load} disabled={loading}>
          Refresh
        </button>
      </div>

      <ErrorMessage error={error} />
      {loading ? <LoadingState /> : null}

      {!loading && templates.length === 0 ? (
        <div className="card">No public templates found.</div>
      ) : null}

      <div className="stack">
        {templates.map((t) => (
          <div key={t.id} className="card stack">
            <div className="row">
              <div>
                <h2>{t.name}</h2>
                {t.description ? <p className="muted">{t.description}</p> : null}
                <div className="row">
                  <span className="pill">By {t.user?.email || "Unknown"}</span>
                  <span className="pill">
                    Exercises: {Array.isArray(t.exercises) ? t.exercises.length : 0}
                  </span>
                </div>
              </div>
              <div className="row">
                <button className="btn btn-secondary" onClick={() => onClone(t.id)}>
                  Clone
                </button>
                <button className="btn" onClick={() => onStart(t.id)}>
                  Start session
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

