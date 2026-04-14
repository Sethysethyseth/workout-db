import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { ApiError } from "../../api/http.js";
import { useSessionLiveLoggingGuard } from "../../context/SessionLiveLoggingGuardContext.jsx";
import { confirmLeaveLiveSession } from "../../lib/confirmLeaveLiveSession.js";

function isSessionDetailPath(pathname) {
  return /^\/sessions\/[^/]+$/.test(pathname);
}

export function Navbar() {
  const { currentUser, logout } = useAuth();
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

  async function onLogout() {
    if (liveSessionGuard && !confirmLeaveLiveSession()) return;
    try {
      await logout();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        // already logged out
      }
    } finally {
      navigate("/login");
    }
  }

  return (
    <header className="nav">
      <div className="container nav-inner">
        <div className="brand">
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
        <nav className="links">
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
                to="/profile"
                onClick={(e) => {
                  if (!liveSessionGuard) return;
                  if (location.pathname.startsWith("/profile")) return;
                  e.preventDefault();
                  tryNavigate("/profile");
                }}
              >
                Profile
              </NavLink>
              <button className="btn btn-ghost" type="button" onClick={onLogout}>
                Logout
              </button>
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
