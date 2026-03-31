import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { ApiError } from "../../api/http.js";

export function Navbar() {
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
          <Link to="/">WorkoutDB beta</Link>
        </div>
        <nav className="links">
          {currentUser ? (
            <>
              <NavLink to="/" end>
                Home
              </NavLink>
              <NavLink to="/templates" end>
                My programs
              </NavLink>
              <NavLink to="/templates/public">Public programs</NavLink>
              <NavLink to="/sessions" end>
                History
              </NavLink>
              <NavLink to="/profile">Profile</NavLink>
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
