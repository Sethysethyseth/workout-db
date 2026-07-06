import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { PasswordInput } from "../components/auth/PasswordInput.jsx";

export function LoginPage() {
  const { login: signIn, currentUser } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const nextUrl = useMemo(() => {
    const raw = params.get("next") || "/";
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }, [params]);

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Already signed in (or a background /auth/me just resolved a live cookie
  // session after ProtectedRoute short-circuited here): skip the form.
  useEffect(() => {
    if (submitting || !currentUser) return;
    navigate(nextUrl, { replace: true });
  }, [currentUser, submitting, navigate, nextUrl]);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signIn({ login, password });
      navigate(nextUrl, { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card stack auth-form" onSubmit={onSubmit}>
      <h2 className="auth-heading">Login</h2>

      <ErrorMessage error={error} />

      <label>
        Email or username
        <input
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          autoComplete="username"
          required
        />
      </label>
      <PasswordInput
        label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
        required
        minLength={8}
      />
      <div className="row auth-actions">
        <button className="btn" disabled={submitting}>
          {submitting ? "Logging in…" : "Login"}
        </button>
        <Link className="muted auth-crosslink" to="/register">
          Need an account? Register
        </Link>
      </div>
    </form>
  );
}

