import { useEffect } from "react";
import { Link } from "react-router-dom";
import { WhatsNewContent } from "../../components/whatsnew/WhatsNewContent.jsx";
import { LATEST_RELEASE, RELEASES } from "../../data/whatsNew.js";
import { saveLastSeenRelease } from "../../lib/whatsNewStorage.js";

/**
 * Profile > What's new: the full release-notes archive, newest first.
 * Visiting it counts as having seen the latest release, so the modal
 * doesn't re-fire afterward.
 */
export function WhatsNewPage() {
  useEffect(() => {
    if (LATEST_RELEASE) saveLastSeenRelease(LATEST_RELEASE.id);
  }, []);

  return (
    <div className="settings-page whats-new-page stack">
      <Link to="/profile" className="settings-page-back">
        &larr; Profile
      </Link>
      <header className="settings-page-header">
        <h1 className="settings-page-title">What&apos;s new</h1>
      </header>
      {RELEASES.map((release) => (
        <article key={release.id} className="card whats-new-archive-entry">
          <WhatsNewContent release={release} />
        </article>
      ))}
    </div>
  );
}
