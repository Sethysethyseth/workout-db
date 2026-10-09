import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  WhatsNewReleaseHeader,
  WhatsNewReleaseSections,
} from "./WhatsNewContent.jsx";

/**
 * Once-per-release announcement modal (patch-notes style). Behavior lives
 * here (dismiss paths, a11y); visual treatment in index.css whats-new-* rules
 * plus client/src/styles/whats-new.css. Concise sections only. When the
 * release has details, "See the details" marks it seen and opens the archive
 * at that release. Same fixed-overlay pattern as UsernameRequiredModal -
 * rendered inside #root, so it sits above the scene layer without a portal.
 */
export function WhatsNewModal({ release, onDismiss }) {
  const navigate = useNavigate();

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onDismiss();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDismiss]);

  if (!release) return null;

  const hasDetails = Array.isArray(release.details) && release.details.length > 0;

  function onSeeDetails() {
    onDismiss();
    navigate(`/profile/whats-new#${release.id}`);
  }

  return (
    <div
      className="whats-new-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whats-new-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div className="whats-new-card card">
        <div className="whats-new-card__scroll">
          <div className="whats-new-hero">
            <p className="whats-new-kicker">What&apos;s new in LogChamp</p>
            <WhatsNewReleaseHeader release={release} headingId="whats-new-title" />
          </div>
          <WhatsNewReleaseSections release={release} />
        </div>
        <footer className="whats-new-footer">
          <div className="whats-new-footer__actions">
            <button type="button" className="btn" onClick={onDismiss}>
              Got it
            </button>
            {hasDetails ? (
              <button type="button" className="btn btn-secondary" onClick={onSeeDetails}>
                See the details
              </button>
            ) : null}
          </div>
          <Link
            className="whats-new-all-link muted small"
            to="/profile/whats-new"
            onClick={onDismiss}
          >
            See all updates
          </Link>
        </footer>
      </div>
    </div>
  );
}
