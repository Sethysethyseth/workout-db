import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { PasswordInput } from "../components/auth/PasswordInput.jsx";

export function LoginPage() {
  const { login: signIn } = useAuth();
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
    <div className="stack">
      <h2>Login</h2>

      <ErrorMessage error={error} />

      <form className="card stack" onSubmit={onSubmit}>
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
        <div className="row">
          <button className="btn" disabled={submitting}>
            {submitting ? "Logging in…" : "Login"}
          </button>
          <Link className="muted" to="/register">
            Need an account? Register
          </Link>
        </div>
      </form>
    </div>
  );
}

