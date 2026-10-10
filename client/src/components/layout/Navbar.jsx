import { useRef } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useGuardedNav } from "../../lib/useGuardedNav.js";
import { canReviewFeedback } from "../../lib/reviewerEmails.js";
import { SlidingIndicator } from "../motion/SlidingIndicator.jsx";
import { NAV_SECTIONS, sectionIndexOf } from "../motion/navOrder.js";

/**
 * Desktop masthead (hidden under 720px, where BottomNav takes over). Same
 * five sections, same names, same order as the phone nav - Profile is a
 * real tab with an active state, not a bare link - and the selected look is
 * the one sliding indicator the rest of the app uses.
 */
export function Navbar() {
  const { currentUser, authLoading } = useAuth();
  const { guardedClick } = useGuardedNav();
  const { pathname } = useLocation();
  const showDevFeedback = canReviewFeedback(currentUser);
  const hostRef = useRef(null);
  // While the session is still resolving (the cold-start splash), the bar
  // shows the brand only - never a flash of Login / Register for someone
  // who is about to be signed in.
  const settled = !authLoading;
  const activeIndex = sectionIndexOf(pathname);

  return (
    <header className="nav">
      <div className="container nav-inner">
        <div className="brand brand--subtle">
          <Link to="/" onClick={guardedClick("/", { end: true })}>
            LogChamp
          </Link>
        </div>
        <nav className="links nav-main-links" aria-label="Main" ref={hostRef}>
          {settled ? (
            <SlidingIndicator
              containerRef={hostRef}
              activeKey={`${activeIndex}:${pathname}`}
              selector="a.active"
            />
          ) : null}
          {!settled ? null : currentUser ? (
            <>
              {NAV_SECTIONS.map(({ label, to, end }, i) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => (isActive || activeIndex === i ? "active" : undefined)}
                  onClick={guardedClick(to, { end })}
                >
                  {label}
                </NavLink>
              ))}
              {showDevFeedback ? (
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
