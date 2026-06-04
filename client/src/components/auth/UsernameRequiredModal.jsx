import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { validateUsername } from "../../lib/username.js";
import { ErrorMessage } from "../ErrorMessage.jsx";

/**
 * Blocking backfill for accounts created before usernames existed.
 * Cannot be dismissed until a valid username is saved.
 */
export function UsernameRequiredModal() {
  const { setUsername } = useAuth();
  const [username, setUsernameInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    const result = validateUsername(username);
    if (!result.ok) {
      setError(new Error(result.error));
      return;
    }
    setSubmitting(true);
    try {
      await setUsername(username);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="username-required-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="username-required-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: "rgba(0, 0, 0, 0.72)",
      }}
    >
      <form
        className="card stack"
        onSubmit={onSubmit}
        style={{ width: "100%", maxWidth: "22rem" }}
      >
        <h1 id="username-required-title" style={{ margin: 0 }}>
          Choose a username
        </h1>
        <p className="muted small" style={{ margin: 0 }}>
          Existing accounts need a username before you can use LogChamp. This step cannot be skipped.
        </p>
        <ErrorMessage error={error} />
        <label>
          Username
          <input
            value={username}
            onChange={(e) => setUsernameInput(e.target.value)}
            autoComplete="username"
            required
            minLength={3}
            maxLength={30}
            autoFocus
          />
        </label>
        <p className="muted small" style={{ margin: 0 }}>
          3–30 characters. Letters, numbers, spaces, and _ - . only.
        </p>
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? "Saving…" : "Continue"}
        </button>
      </form>
    </div>
  );
}
