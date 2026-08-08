import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { authorizeConnector } from "../api/aiApi.js";
import { ApiError } from "../api/http.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { LoadingState } from "../components/LoadingState.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export function ConnectorLoginPage() {
  const { currentUser, authLoading } = useAuth();
  const location = useLocation();
  const [params] = useSearchParams();
  const externalAuthId = params.get("external_auth_id") || "";
  const hasId = Boolean(externalAuthId.trim());

  const [error, setError] = useState(null);
  const [expired, setExpired] = useState(false);
  const [needsConsent, setNeedsConsent] = useState(false);

  // Latch the completion call to at most ONE attempt per external_auth_id.
  // A `cancelled` flag stops a late setState but does NOT stop a second POST,
  // and this effect can re-fire twice over: StrictMode double-invokes it in
  // dev, and `currentUser` is an object whose identity changes on any auth
  // refresh. WorkOS does not document whether external_auth_id is single-use
  // (recon R1: COULD NOT SOURCE), so a duplicate completion could burn the id
  // and 409 the user out of a handshake that actually succeeded.
  const attemptedIdRef = useRef(null);

  useEffect(() => {
    if (authLoading || !currentUser || !hasId) return;
    if (attemptedIdRef.current === externalAuthId) return;
    attemptedIdRef.current = externalAuthId;

    let cancelled = false;
    async function run() {
      setError(null);
      setExpired(false);
      setNeedsConsent(false);
      try {
        const data = await authorizeConnector(externalAuthId.trim());
        if (cancelled) return;
        window.location.assign(data.redirectUri);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 403) {
          setNeedsConsent(true);
          return;
        }
        if (err instanceof ApiError && err.status === 409) {
          setExpired(true);
          return;
        }
        setError(err);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [authLoading, currentUser, hasId, externalAuthId]);

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
        slowLabel="Waking up the server…"
      />
    );
  }

  if (!currentUser) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (needsConsent) {
    return <Navigate to="/profile/ai" replace />;
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

  return (
    <LoadingState
      tone="page"
      label="Connecting…"
      slowLabel="Finishing the connection…"
    />
  );
}
