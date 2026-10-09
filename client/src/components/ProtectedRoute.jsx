import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { UsernameRequiredModal } from "./auth/UsernameRequiredModal.jsx";
import { LoadingState } from "./LoadingState.jsx";

export function ProtectedRoute({ children }) {
  const { currentUser, authLoading } = useAuth();
  const location = useLocation();
  const next = encodeURIComponent(location.pathname + location.search);

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
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (currentUser.usernameKey == null) {
    return <UsernameRequiredModal />;
  }

  return children;
}
