import { useLocation, useNavigate } from "react-router-dom";
import { useSessionLiveLoggingGuard } from "../context/SessionLiveLoggingGuardContext.jsx";
import { confirmLeaveLiveSession } from "./confirmLeaveLiveSession.js";

function isSessionDetailPath(pathname) {
  return /^\/sessions\/[^/]+$/.test(pathname);
}

export function useGuardedNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isActive: liveSessionGuard } = useSessionLiveLoggingGuard();

  function tryNavigate(to, { replace = false } = {}) {
    if (liveSessionGuard) {
      const from = location.pathname;
      if (isSessionDetailPath(from) && isSessionDetailPath(to) && from !== to) {
        navigate(to, { replace });
        return;
      }
      if (!confirmLeaveLiveSession()) return;
    }
    navigate(to, { replace });
  }

  function guardedClick(to, { end = false } = {}) {
    return (e) => {
      if (!liveSessionGuard) return;
      const onTarget = end
        ? location.pathname === to
        : location.pathname.startsWith(to);
      if (onTarget) return;
      e.preventDefault();
      tryNavigate(to);
    };
  }

  return { tryNavigate, guardedClick };
}
