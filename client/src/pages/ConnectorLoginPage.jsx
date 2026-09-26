import { useRef, useState } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { authorizeConnector, grantAiConsent } from "../api/aiApi.js";
import { ApiError } from "../api/http.js";
import { AiConsentFacts } from "../components/ai/AiConsentFacts.jsx";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export function ConnectorLoginPage() {
  const { currentUser, authLoading, logout } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();
  const externalAuthId = params.get("external_auth_id") || "";
  const hasId = Boolean(externalAuthId.trim());

  const [error, setError] = useState(null);
  const [expired, setExpired] = useState(false);
  const [needsConsent, setNeedsConsent] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [switching, setSwitching] = useState(false);

  // Latch: at most ONE authorize attempt per external_auth_id, plus
  // exactly one post-consent retry (sentinel `${id}::consent`). A double
  // click must not POST twice. WorkOS does not document whether
  // external_auth_id is single-use (recon R1: COULD NOT SOURCE), so a
  // duplicate completion could burn the id and 409 a handshake that succeeded.
  const attemptedIdRef = useRef(null);

  async function onContinue() {
    if (attemptedIdRef.current === externalAuthId) return;
    attemptedIdRef.current = externalAuthId;

    setConnecting(true);
    setError(null);
    setExpired(false);
    setNeedsConsent(false);
    try {
      const data = await authorizeConnector(externalAuthId.trim());
      window.location.assign(data.redirectUri);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setNeedsConsent(true);
        setConnecting(false);
        return;
      }
      if (err instanceof ApiError && err.status === 409) {
        setExpired(true);
        return;
      }
      setError(err);
      setConnecting(false);
    }
  }

  async function onTurnOnAndConnect() {
    const retryKey = `${externalAuthId}::consent`;
    if (attemptedIdRef.current === retryKey) return;
    if (attemptedIdRef.current !== externalAuthId) return;
    attemptedIdRef.current = retryKey;

    setConnecting(true);
    setError(null);
    try {
      await grantAiConsent();
    } catch (err) {
      setError(err);
      setConnecting(false);
      return;
    }
    try {
      const data = await authorizeConnector(externalAuthId.trim());
      window.location.assign(data.redirectUri);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setExpired(true);
        return;
      }
      setError(err);
      setConnecting(false);
    }
  }

  async function onUseDifferentAccount() {
    if (switching) return;
    setSwitching(true);
    try {
      await logout();
    } catch {
      // Local session is already cleared; the unauthenticated branch below
      // sends us to /login?next=<this path + query>.
    }
  }

  if (!hasId) {
    return (
      <div className="card stack">
        <p>This connection link is incomplete.</p>
        <Link className="muted" to="/">
          Back to home
        </Link>
      </div>
    );
  }

  if (authLoading) {
    return (
      <LoadingState
        tone="page"
        label="Loading session…"
        slowLabel="Taking longer than usual…"
      />
    );
  }

  if (!currentUser) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (expired) {
    return (
      <div className="card stack">
        <p>
          This connection link expired. Start again from your AI assistant.
        </p>
        <Link className="muted" to="/">
          Back to home
        </Link>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (connecting) {
    return (
      <LoadingState
        tone="page"
        label="Connecting…"
        slowLabel="Finishing the connection…"
      />
    );
  }

  if (needsConsent) {
    return (
      <div className="card stack">
        <p>
          AI access is off for this account and must be on to connect.
        </p>
        <AiConsentFacts />
        <div className="row">
          <button
            type="button"
            className="btn"
            onClick={() => void onTurnOnAndConnect()}
          >
            Turn on AI access and connect
          </button>
          <Link className="muted" to="/profile/ai">
            Not now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="card stack">
      <p>
        Connect LogChamp as <strong>{currentUser.email}</strong>?
      </p>
      <p className="muted">
        Only continue if you just started connecting from your own AI
        assistant - anyone who sends you this link could otherwise read your
        training data. This link expires within a few minutes. If it does,
        start the connection again from the assistant.
      </p>
      <div className="row">
        <button
          type="button"
          className="btn"
          disabled={switching}
          onClick={() => void onContinue()}
        >
          Continue as {currentUser.email}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={switching}
          onClick={() => void onUseDifferentAccount()}
        >
          Use a different account
        </button>
      </div>
    </div>
  );
}
