import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import * as authApi from "../api/authApi.js";
import { PasswordInput } from "../components/auth/PasswordInput.jsx";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
export function ProfilePage() {
  const { currentUser } = useAuth();
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
    <div className="stack">
      <div>
        <h1>Profile</h1>
        <p className="muted">Signed in as {currentUser.email}</p>
      </div>
      <ErrorMessage error={error} />
      {success ? (
        <div className="card">
          <strong>Done</strong>
          <p className="muted" style={{ margin: 0 }}>
            {success}
          </p>
        </div>
      ) : null}

      <form className="card stack" onSubmit={onSubmit}>
        <h2 style={{ margin: 0 }}>Change password</h2>
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
        <button className="btn" disabled={submitting}>
          {submitting ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
