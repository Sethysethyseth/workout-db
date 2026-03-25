import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { PasswordInput } from "../components/auth/PasswordInput.jsx";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
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
    setSubmitting(true);
    try {
      await register({ email, password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="stack">
      <div>
        <h1>Register</h1>
        <p className="muted">
          Create your WorkoutDB beta account. Password must be at least 8 characters.
        </p>
      </div>

      <ErrorMessage error={error} />

      <form className="card stack" onSubmit={onSubmit}>
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
        <div className="row">
          <button className="btn" disabled={submitting}>
            {submitting ? "Creating…" : "Create account"}
          </button>
          <Link className="muted" to="/login">
            Already have an account? Login
          </Link>
        </div>
      </form>
    </div>
  );
}

