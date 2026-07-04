import { useState } from "react";
import { Link } from "react-router-dom";
import * as authApi from "../../api/authApi.js";
import { PasswordInput } from "../../components/auth/PasswordInput.jsx";
import { ErrorMessage } from "../../components/ErrorMessage.jsx";

export function SecurityPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

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

  return (
    <div className="settings-page stack">
      <Link to="/profile" className="settings-page-back muted small">
        &larr; Profile
      </Link>
      <header className="settings-page-header">
        <h1 className="settings-page-title">Security</h1>
      </header>

      <ErrorMessage error={error} />

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
    </div>
  );
}
