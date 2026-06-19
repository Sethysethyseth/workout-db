import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { PasswordInput } from "../components/auth/PasswordInput.jsx";
import { validateUsername } from "../lib/username.js";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError(new Error("Passwords do not match."));
      return;
    }
    const usernameResult = validateUsername(username);
    if (!usernameResult.ok) {
      setError(new Error(usernameResult.error));
      return;
    }
    setSubmitting(true);
    try {
      await register({ email, password, username });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card stack auth-form" onSubmit={onSubmit}>
      <h2 className="auth-heading">Register</h2>

      <ErrorMessage error={error} />

      <label>
        Email
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          inputMode="email"
          required
        />
      </label>
      <label>
        Username
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          minLength={3}
          maxLength={30}
        />
      </label>
      <p className="muted small auth-helper" style={{ margin: 0 }}>
        3–30 characters. Letters, numbers, spaces, and _ - . only.
      </p>
      <PasswordInput
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="new-password"
        required
        minLength={8}
      />
      <PasswordInput
        label="Confirm password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        autoComplete="new-password"
        required
        minLength={8}
      />
      <div className="row auth-actions">
        <button className="btn" disabled={submitting}>
          {submitting ? "Creating…" : "Create account"}
        </button>
        <Link className="muted auth-crosslink" to="/login">
          Already have an account? Login
        </Link>
      </div>
    </form>
  );
}

