import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ApiError } from "../api/http.js";

export function NavBar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function onLogout() {
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
          <Link to="/">WorkoutDB</Link>
        </div>
        <nav className="links">
          {currentUser ? (
            <>
              <NavLink to="/templates">My Templates</NavLink>
              <NavLink to="/templates/public">Public Templates</NavLink>
              <NavLink to="/sessions">Sessions</NavLink>
              <button className="btn btn-ghost" onClick={onLogout}>
                Logout
              </button>
              <span className="muted small">{currentUser.email}</span>
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

