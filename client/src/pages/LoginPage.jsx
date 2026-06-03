import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { PasswordInput } from "../components/auth/PasswordInput.jsx";

// tagline — swappable
const LOGIN_TAGLINE = "Log your shit dog";

export function LoginPage() {
  const { login } = useAuth();
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

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login({ email, password });
      navigate(nextUrl, { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="stack">
      <div className="stack" style={{ gap: "0.35rem" }}>
        <div className="brand brand--subtle">
          <span>LogChamp beta</span>
        </div>
        <p className="login-tagline" style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>
          {LOGIN_TAGLINE}
        </p>
      </div>

      <ErrorMessage error={error} />

      <form className="card stack" onSubmit={onSubmit}>
        <h1 style={{ margin: 0 }}>Login</h1>
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

      <p className="muted small" style={{ margin: 0 }}>
        Use your LogChamp beta account to continue. Cookies must be enabled.
      </p>
    </div>
  );
}
