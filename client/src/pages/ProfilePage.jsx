import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import * as authApi from "../api/authApi.js";
import * as feedbackApi from "../api/feedbackApi.js";
import { ApiError } from "../api/http.js";
import { PasswordInput } from "../components/auth/PasswordInput.jsx";
import { ErrorMessage } from "../components/ErrorMessage.jsx";

export function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [feedbackCategory, setFeedbackCategory] = useState("Bug");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackError, setFeedbackError] = useState(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword !== confirmPassword) {
      setError(new Error("New passwords do not match."));
      return;
    }
    if (newPassword.length < 8) {
      setError(new Error("New password must be at least 8 characters."));
      return;
    }
    setSubmitting(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      setSuccess("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function onLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) {
        setError(err);
      }
    } finally {
      setLoggingOut(false);
      navigate("/login", { replace: true });
    }
  }

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
    <div className="settings-page profile-page stack">
      <header className="settings-page-header">
        <h1 className="settings-page-title">Profile</h1>
        <p className="settings-page-subtitle muted small">Account &amp; security</p>
      </header>

      <ErrorMessage error={error} />

      <section className="settings-section" aria-labelledby="settings-account-heading">
        <h2 id="settings-account-heading" className="settings-section-heading">
          Account
        </h2>
        <div className="settings-group">
          <div className="settings-row settings-row--identity" role="group" aria-label="Signed-in account">
            <div className="settings-row__main">
              <span className="settings-row__label muted small">Signed in as</span>
              <span className="settings-row__value">{currentUser?.email}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="settings-section" aria-labelledby="settings-appearance-heading">
        <h2 id="settings-appearance-heading" className="settings-section-heading">
          Appearance
        </h2>
        <div className="settings-group settings-group--tight">
          <p className="settings-group-hint muted small">Applies to this device only.</p>
          <div className="settings-theme-list" role="radiogroup" aria-label="Theme">
            <label className="settings-theme-row">
              <span className="settings-theme-row__label">Light</span>
              <input
                type="radio"
                name="theme"
                value="light"
                checked={theme === "light"}
                onChange={() => setTheme("light")}
              />
            </label>
            <label className="settings-theme-row">
              <span className="settings-theme-row__label">Dark</span>
              <input
                type="radio"
                name="theme"
                value="dark"
                checked={theme === "dark"}
                onChange={() => setTheme("dark")}
              />
            </label>
            <label className="settings-theme-row">
              <span className="settings-theme-row__label">System</span>
              <input
                type="radio"
                name="theme"
                value="system"
                checked={theme === "system"}
                onChange={() => setTheme("system")}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="settings-section" aria-labelledby="settings-security-heading">
        <h2 id="settings-security-heading" className="settings-section-heading">
          Security
        </h2>
        <form className="settings-group settings-security-form" onSubmit={onSubmit}>
          {success ? (
            <div className="settings-feedback settings-feedback--success" role="status">
              {success}
            </div>
          ) : null}
          <PasswordInput
            label="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <PasswordInput
            label="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
          />
          <PasswordInput
            label="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
          />
          <div className="settings-security-actions">
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </section>

      <section className="settings-section" aria-labelledby="settings-beta-feedback-heading">
        <h2 id="settings-beta-feedback-heading" className="settings-section-heading">
          Beta feedback
        </h2>
        <form className="settings-group settings-feedback-form" onSubmit={onFeedbackSubmit}>
          <p className="settings-group-hint muted small">
            Help improve WorkoutDB. Report bugs, confusing moments, or small annoyances.
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

      <footer className="settings-logout-region">
        <button
          type="button"
          className="settings-logout-btn"
          disabled={loggingOut}
          onClick={() => void onLogout()}
        >
          {loggingOut ? "Signing out…" : "Log out"}
        </button>
      </footer>
    </div>
  );
}
