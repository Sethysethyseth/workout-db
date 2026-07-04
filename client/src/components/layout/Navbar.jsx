import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useGuardedNav } from "../../lib/useGuardedNav.js";

function parseReviewerEmails(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function Navbar() {
  const { currentUser } = useAuth();
  const { guardedClick } = useGuardedNav();
  const reviewerEmails = parseReviewerEmails(import.meta.env.VITE_FEEDBACK_REVIEWER_EMAILS);
  const canReviewFeedback =
    !!currentUser?.email && reviewerEmails.includes(String(currentUser.email).toLowerCase());

  return (
    <header className="nav">
      <div className="container nav-inner">
        <div className="nav-top">
          <div className="brand brand--subtle">
            <Link to="/" onClick={guardedClick("/", { end: true })}>
              LogChamp
            </Link>
          </div>
          {currentUser ? (
            <Link className="nav-profile-link" to="/profile" onClick={guardedClick("/profile")}>
              Profile
            </Link>
          ) : null}
        </div>
        <nav className="links nav-main-links" aria-label="Main">
          {currentUser ? (
            <>
              <NavLink to="/" end onClick={guardedClick("/", { end: true })}>
                Workout
              </NavLink>
              <NavLink to="/templates" onClick={guardedClick("/templates")}>
                Library
              </NavLink>
              <NavLink to="/sessions" end onClick={guardedClick("/sessions", { end: true })}>
                History
              </NavLink>
              <NavLink to="/analytics" end onClick={guardedClick("/analytics", { end: true })}>
                Analytics
              </NavLink>
              {canReviewFeedback ? (
                <NavLink to="/dev/feedback" onClick={guardedClick("/dev/feedback")}>
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
