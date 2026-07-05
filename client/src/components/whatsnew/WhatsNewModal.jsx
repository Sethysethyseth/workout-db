import { useEffect } from "react";
import { Link } from "react-router-dom";
import { WhatsNewContent } from "./WhatsNewContent.jsx";

/**
 * Once-per-release announcement modal (patch-notes style). Behavior lives
 * here (dismiss paths, a11y); the visual treatment lands in the L5 task
 * block. Same fixed-overlay pattern as UsernameRequiredModal - rendered
 * inside #root, so it sits above the scene layer without a portal.
 */
export function WhatsNewModal({ release, onDismiss }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onDismiss();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDismiss]);

  if (!release) return null;

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
      <div className="whats-new-card card stack">
        <p className="whats-new-kicker muted small">What&apos;s new in LogChamp</p>
        <WhatsNewContent release={release} headingId="whats-new-title" />
        <footer className="whats-new-footer">
          <button type="button" className="btn" onClick={onDismiss}>
            Got it
          </button>
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
