import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext.jsx";
import * as feedbackApi from "../../api/feedbackApi.js";

export function FeedbackPage() {
  const location = useLocation();
  const { theme } = useTheme();
  const [feedbackCategory, setFeedbackCategory] = useState("Bug");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  async function onFeedbackSubmit(e) {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackSuccess(false);
    const trimmed = feedbackMessage.trim();
    if (!trimmed) {
      setFeedbackError(new Error("Please enter a message."));
      return;
    }
    setFeedbackSubmitting(true);
    try {
      await feedbackApi.createFeedback({
        category: feedbackCategory,
        message: trimmed,
        pagePath: location.pathname || null,
        theme,
      });
      setFeedbackMessage("");
      setFeedbackCategory("Bug");
      setFeedbackSuccess(true);
    } catch (err) {
      setFeedbackError(err);
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  return (
    <div className="settings-page stack">
      <Link to="/profile" className="settings-page-back muted small">
        &larr; Profile
      </Link>
      <header className="settings-page-header">
        <h1 className="settings-page-title">Send feedback</h1>
      </header>

      <section className="settings-section" aria-labelledby="settings-beta-feedback-heading">
        <h2 id="settings-beta-feedback-heading" className="settings-section-heading">
          Beta feedback
        </h2>
        <form className="settings-group settings-feedback-form" onSubmit={onFeedbackSubmit}>
          <p className="settings-group-hint muted small">
            Help improve LogChamp. Report bugs, confusing moments, or small annoyances.
          </p>
          {feedbackError ? (
            <p className="settings-feedback-inline-error" role="alert">
              {feedbackError instanceof Error ? feedbackError.message : String(feedbackError)}
            </p>
          ) : null}
          {feedbackSuccess ? (
            <div className="settings-feedback settings-feedback--success" role="status">
              Thanks — feedback sent.
            </div>
          ) : null}
          <div className="settings-feedback-form__body">
            <label className="settings-feedback-field">
              <span className="settings-feedback-field__label muted small">Category</span>
              <select
                className="settings-feedback-select"
                value={feedbackCategory}
                onChange={(e) => {
                  setFeedbackCategory(e.target.value);
                  if (feedbackSuccess) setFeedbackSuccess(false);
                }}
                aria-label="Feedback category"
              >
                <option value="Bug">Bug</option>
                <option value="Confusing">Confusing</option>
                <option value="Idea">Idea</option>
              </select>
            </label>
            <label className="settings-feedback-field">
              <span className="settings-feedback-field__label muted small">Message</span>
              <textarea
                className="settings-feedback-textarea"
                rows={4}
                value={feedbackMessage}
                onChange={(e) => {
                  setFeedbackMessage(e.target.value);
                  if (feedbackSuccess) setFeedbackSuccess(false);
                }}
                placeholder="What felt off?"
                autoComplete="off"
              />
            </label>
            <div className="settings-feedback-form__actions">
              <button className="btn btn-secondary" type="submit" disabled={feedbackSubmitting}>
                {feedbackSubmitting ? "Sending…" : "Send feedback"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
