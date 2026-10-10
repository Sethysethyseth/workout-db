import { useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useGuardedNav } from "../../lib/useGuardedNav.js";
import { SlidingIndicator } from "../motion/SlidingIndicator.jsx";
import { NAV_SECTIONS, sectionIndexOf } from "../motion/navOrder.js";

const ICONS = {
  home: (
    <>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 9.6V20h13V9.6" />
    </>
  ),
  analytics: (
    <>
      <path d="M5 20v-7" />
      <path d="M10 20V7" />
      <path d="M15 20v-4" />
      <path d="M20 20V4" />
    </>
  ),
  history: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 8v4l3 2" />
    </>
  ),
  library: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.9 3.1-6 7-6s7 2.1 7 6" />
    </>
  ),
};

/**
 * Phone tab bar. One sliding indicator (the accent bar + a soft halo) FLIPs
 * between the five items instead of each item growing its own bar; the icon
 * you tapped pops once. The nav order here IS the shell's axis
 * (navOrder.js) - the route transition slides pages along it.
 */
export function BottomNav() {
  const { currentUser } = useAuth();
  const { guardedClick } = useGuardedNav();
  const { pathname } = useLocation();
  const hostRef = useRef(null);
  const [tapped, setTapped] = useState(null);

  if (!currentUser) return null;

  /* Nested routes (e.g. /sessions/:id) keep their section lit so the
     indicator never vanishes mid-app; NavLink's own `end` matching decides
     `.active` for the plain tabs, this only covers the deep paths. */
  const activeIndex = sectionIndexOf(pathname);

  return (
    <nav className="bottom-nav" aria-label="Main" ref={hostRef}>
      <SlidingIndicator
        containerRef={hostRef}
        activeKey={activeIndex}
        selector=".bottom-nav__item.active"
      />
      {NAV_SECTIONS.map(({ key, label, to, end }, i) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `bottom-nav__item${isActive || activeIndex === i ? " active" : ""}`
          }
          onClick={(e) => {
            setTapped((t) => ({ key, seq: (t?.seq || 0) + 1 }));
            guardedClick(to, { end })(e);
          }}
        >
          <svg
            key={tapped && tapped.key === key ? `pop-${tapped.seq}` : "icon"}
            className={`bottom-nav__icon${tapped && tapped.key === key ? " bottom-nav__icon--tapped" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {ICONS[key]}
          </svg>
          <span className="bottom-nav__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
