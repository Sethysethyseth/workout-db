import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useGuardedNav } from "../../lib/useGuardedNav.js";

const TABS = [
  {
    label: "Home",
    to: "/",
    end: true,
    icon: (
      <>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5.5 9.6V20h13V9.6" />
      </>
    ),
  },
  {
    label: "Analytics",
    to: "/analytics",
    end: true,
    icon: (
      <>
        <path d="M5 20v-7" />
        <path d="M10 20V7" />
        <path d="M15 20v-4" />
        <path d="M20 20V4" />
      </>
    ),
  },
  {
    label: "History",
    to: "/sessions",
    end: true,
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </>
    ),
  },
  {
    label: "Library",
    to: "/templates",
    end: false,
    icon: (
      <>
        <rect x="4" y="4" width="6" height="6" rx="1" />
        <rect x="14" y="4" width="6" height="6" rx="1" />
        <rect x="4" y="14" width="6" height="6" rx="1" />
        <rect x="14" y="14" width="6" height="6" rx="1" />
      </>
    ),
  },
  {
    label: "Profile",
    to: "/profile",
    end: false,
    icon: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c0-3.9 3.1-6 7-6s7 2.1 7 6" />
      </>
    ),
  },
];

export function BottomNav() {
  const { currentUser } = useAuth();
  const { guardedClick } = useGuardedNav();

  if (!currentUser) return null;

  return (
    <nav className="bottom-nav" aria-label="Main">
      {TABS.map(({ label, to, end, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className="bottom-nav__item"
          onClick={guardedClick(to, { end })}
        >
          <svg
            className="bottom-nav__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {icon}
          </svg>
          <span className="bottom-nav__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
