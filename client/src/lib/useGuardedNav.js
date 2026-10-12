import { useLocation, useNavigate } from "react-router-dom";
import { useSessionLiveLoggingGuard } from "../context/SessionLiveLoggingGuardContext.jsx";
import { flushLiveSessionDrafts } from "./confirmLeaveLiveSession.js";

export function useGuardedNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isActive: liveSessionGuard } = useSessionLiveLoggingGuard();

  function tryNavigate(to, { replace = false } = {}) {
    if (liveSessionGuard) flushLiveSessionDrafts();
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
