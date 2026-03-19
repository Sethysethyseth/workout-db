import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as templateApi from "../api/templateApi.js";
import * as sessionApi from "../api/sessionApi.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { LoadingState } from "../components/LoadingState.jsx";

export function TemplatesMinePage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await templateApi.getMyTemplates();
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
          <h1>My Templates</h1>
          <p className="muted">Create a template, then start a workout session.</p>
        </div>
        <div className="row">
          <button className="btn btn-secondary" onClick={load} disabled={loading}>
            Refresh
          </button>
          <Link className="btn" to="/templates/new">
            New template
          </Link>
        </div>
      </div>

      <ErrorMessage error={error} />
      {loading ? <LoadingState /> : null}

      {!loading && templates.length === 0 ? (
        <div className="card">
          <p>No templates yet.</p>
          <Link className="btn" to="/templates/new">
            Create your first template
          </Link>
        </div>
      ) : null}

      <div className="stack">
        {templates.map((t) => (
          <div key={t.id} className="card stack">
            <div className="row">
              <div>
                <h2>{t.name}</h2>
                {t.description ? <p className="muted">{t.description}</p> : null}
                <div className="row">
                  <span className="pill">
                    {t.isPublic ? "Public" : "Private"}
                  </span>
                  <span className="pill">
                    Exercises: {Array.isArray(t.exercises) ? t.exercises.length : 0}
                  </span>
                </div>
              </div>
              <div className="row">
                <button className="btn" onClick={() => onStart(t.id)}>
                  Start session
                </button>
              </div>
            </div>

            {Array.isArray(t.exercises) && t.exercises.length > 0 ? (
              <div className="card">
                <strong>Exercises</strong>
                <div className="mt-2 stack">
                  {t.exercises.map((e) => (
                    <div key={e.id} className="row">
                      <div>
                        <div>
                          {e.order}. {e.exerciseName}
                        </div>
                        <div className="muted small">
                          {e.targetSets != null ? `${e.targetSets} sets` : "sets: —"}
                          {" · "}
                          {e.targetReps ? `${e.targetReps} reps` : "reps: —"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

