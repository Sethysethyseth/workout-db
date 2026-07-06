import { Navigate, useLocation } from "react-router-dom";
import { hasStoredAuthToken, useAuth } from "../context/AuthContext.jsx";
import { UsernameRequiredModal } from "./auth/UsernameRequiredModal.jsx";
import { LoadingState } from "./LoadingState.jsx";

export function ProtectedRoute({ children }) {
  const { currentUser, authLoading } = useAuth();
  const location = useLocation();
  const next = encodeURIComponent(location.pathname + location.search);

  if (authLoading) {
    // No token on this device means /auth/me can only resolve to a redirect
    // here anyway (barring a valid cookie with cleared storage - /login
    // self-heals that case). Go straight to the login form instead of making
    // a fresh visitor sit through a cold-server "Loading session..." wait.
    if (!hasStoredAuthToken()) {
      return <Navigate to={`/login?next=${next}`} replace />;
    }
    return (
      <LoadingState
        tone="page"
        label="Loading session…"
        slowLabel="Waking up the server…"
      />
    );
  }
  if (!currentUser) {
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (currentUser.usernameKey == null) {
    return <UsernameRequiredModal />;
  }

  return children;
}
