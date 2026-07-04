import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useActiveSession } from "../context/ActiveSessionContext.jsx";
import { ApiError } from "../api/http.js";
import { ErrorMessage } from "../components/ErrorMessage.jsx";
import { canReviewFeedback } from "../lib/reviewerEmails.js";
import { countCompleted, countThisWeek, weekStreak } from "../lib/profileStats.js";

function getInitials(user) {
  const name = user?.displayName?.trim();
  if (name) {
    const words = name.split(/\s+/).filter(Boolean).slice(0, 2);
    return words.map((w) => w[0]).join("").toUpperCase();
  }
  const email = user?.email?.trim();
  if (email) return email[0].toUpperCase();
  return "?";
}

function formatMemberSince(createdAt) {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function formatStatValue(loading, value, suffix = "") {
  if (loading) return "\u2014";
  return `${value}${suffix}`;
}

export function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const { sessions, loading: sessionsLoading } = useActiveSession();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState(null);

  const showDevFeedback = canReviewFeedback(currentUser);
  const memberSince = formatMemberSince(currentUser?.createdAt);
  /* Placeholder only on the initial load - the context re-enters loading on
     every 20s background poll, and settled values must not flash to em dashes. */
  const statsPending = sessionsLoading && sessions.length === 0;
  const workoutCount = countCompleted(sessions);
  const thisWeekCount = countThisWeek(sessions);
  const streak = weekStreak(sessions);

  async function onLogout() {
    setLoggingOut(true);
    try {
      await logout();
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) {
        setError(err);
      }
    } finally {
      setLoggingOut(false);
      navigate("/login", { replace: true });
    }
  }

  return (
    <div className="settings-page profile-page profile-hub stack">
      <header className="profile-hub-header">
        <div className="profile-hub-avatar" aria-hidden="true">
          {getInitials(currentUser)}
        </div>
        <div className="profile-hub-identity">
          <h1 className="profile-hub-name settings-page-title">
            {currentUser?.displayName || currentUser?.email}
          </h1>
          {currentUser?.displayName ? (
            <p className="profile-hub-email muted small">{currentUser.email}</p>
          ) : null}
          {memberSince ? (
            <p className="profile-hub-member-since muted small">Member since {memberSince}</p>
          ) : null}
        </div>
      </header>

      <div className="profile-hub-stats" aria-label="Workout stats">
        <div className="profile-hub-stat-tile">
          <span className="profile-hub-stat-tile__value">
            {formatStatValue(statsPending, workoutCount)}
          </span>
          <span className="profile-hub-stat-tile__label muted small">Workouts</span>
        </div>
        <div className="profile-hub-stat-tile">
          <span className="profile-hub-stat-tile__value">
            {formatStatValue(statsPending, thisWeekCount)}
          </span>
          <span className="profile-hub-stat-tile__label muted small">This week</span>
        </div>
        <div className="profile-hub-stat-tile">
          <span className="profile-hub-stat-tile__value">
            {statsPending ? "\u2014" : `${streak} wk`}
          </span>
          <span className="profile-hub-stat-tile__label muted small">Week streak</span>
        </div>
      </div>

      <section className="settings-section" aria-labelledby="profile-settings-heading">
        <h2 id="profile-settings-heading" className="settings-section-heading">
          Settings
        </h2>
        <div className="settings-group">
          <Link className="settings-row settings-row--link" to="/profile/appearance">
            <span className="settings-row__main">
              <span className="settings-row__value">Appearance</span>
            </span>
            <span className="settings-row__chevron" aria-hidden="true">
              ›
            </span>
          </Link>
          <Link className="settings-row settings-row--link" to="/profile/security">
            <span className="settings-row__main">
              <span className="settings-row__value">Security</span>
            </span>
            <span className="settings-row__chevron" aria-hidden="true">
              ›
            </span>
          </Link>
          <Link className="settings-row settings-row--link" to="/profile/feedback">
            <span className="settings-row__main">
              <span className="settings-row__value">Send feedback</span>
            </span>
            <span className="settings-row__chevron" aria-hidden="true">
              ›
            </span>
          </Link>
          {showDevFeedback ? (
            <Link className="settings-row settings-row--link" to="/dev/feedback">
              <span className="settings-row__main">
                <span className="settings-row__value">Dev feedback</span>
              </span>
              <span className="settings-row__chevron" aria-hidden="true">
                ›
              </span>
            </Link>
          ) : null}
        </div>
      </section>

      <ErrorMessage error={error} />

      <footer className="settings-logout-region">
        <button
          type="button"
          className="settings-logout-btn"
          disabled={loggingOut}
          onClick={() => void onLogout()}
        >
          {loggingOut ? "Signing out…" : "Log out"}
        </button>
      </footer>
    </div>
  );
}
