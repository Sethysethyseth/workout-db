import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useSessionLiveLoggingGuard } from "../../context/SessionLiveLoggingGuardContext.jsx";
import { confirmLeaveLiveSession } from "../../lib/confirmLeaveLiveSession.js";

function isSessionDetailPath(pathname) {
  return /^\/sessions\/[^/]+$/.test(pathname);
}

function parseReviewerEmails(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function Navbar() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isActive: liveSessionGuard } = useSessionLiveLoggingGuard();
  const reviewerEmails = parseReviewerEmails(import.meta.env.VITE_FEEDBACK_REVIEWER_EMAILS);
  const canReviewFeedback =
    !!currentUser?.email && reviewerEmails.includes(String(currentUser.email).toLowerCase());

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

  return (
    <header className="nav">
      <div className="container nav-inner">
        <div className="nav-top">
          <div className="brand brand--subtle">
            <Link
              to="/"
              onClick={(e) => {
                if (!liveSessionGuard || location.pathname === "/") return;
                e.preventDefault();
                tryNavigate("/");
              }}
            >
              WorkoutDB beta
            </Link>
          </div>
          {currentUser ? (
            <Link
              className="nav-profile-link"
              to="/profile"
              onClick={(e) => {
                if (!liveSessionGuard) return;
                if (location.pathname.startsWith("/profile")) return;
                e.preventDefault();
                tryNavigate("/profile");
              }}
            >
              Profile
            </Link>
          ) : null}
        </div>
        <nav className="links nav-main-links" aria-label="Main">
          {currentUser ? (
            <>
              <NavLink
                to="/"
                end
                onClick={(e) => {
                  if (!liveSessionGuard) return;
                  if (location.pathname === "/") return;
                  e.preventDefault();
                  tryNavigate("/");
                }}
              >
                Workout
              </NavLink>
              <NavLink
                to="/templates"
                onClick={(e) => {
                  if (!liveSessionGuard) return;
                  if (location.pathname.startsWith("/templates")) return;
                  e.preventDefault();
                  tryNavigate("/templates");
                }}
              >
                Programs
              </NavLink>
              <NavLink
                to="/sessions"
                end
                onClick={(e) => {
                  if (!liveSessionGuard) return;
                  if (location.pathname === "/sessions") return;
                  e.preventDefault();
                  tryNavigate("/sessions");
                }}
              >
                History
              </NavLink>
              <NavLink
                to="/hello"
                onClick={(e) => {
                  if (!liveSessionGuard) return;
                  if (location.pathname.startsWith("/hello")) return;
                  e.preventDefault();
                  tryNavigate("/hello");
                }}
              >
                Hello!
              </NavLink>
              {canReviewFeedback ? (
                <NavLink
                  to="/dev/feedback"
                  onClick={(e) => {
                    if (!liveSessionGuard) return;
                    if (location.pathname.startsWith("/dev/feedback")) return;
                    e.preventDefault();
                    tryNavigate("/dev/feedback");
                  }}
                >
                  Dev feedback
                </NavLink>
              ) : null}
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
