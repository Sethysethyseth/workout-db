import { Link } from "react-router-dom";
import { formatReleaseDate, LATEST_RELEASE } from "../../data/whatsNew.js";
import "../../styles/whats-new.css";

/**
 * Quiet latest-release card for Profile, directly under the stats tiles.
 * No accent fill and no card--live. Callers decide prod vs preview.
 */
export function LatestUpdateCard({ preview = false }) {
  if (!LATEST_RELEASE) return null;

  const to = preview ? "/profile/whats-new?preview=1" : "/profile/whats-new";

  return (
    <article className="card latest-update">
      <h2 className="latest-update__title">{LATEST_RELEASE.title}</h2>
      <p className="latest-update__date muted small">{formatReleaseDate(LATEST_RELEASE.date)}</p>
      {LATEST_RELEASE.tagline ? (
        <p className="latest-update__tagline muted">{LATEST_RELEASE.tagline}</p>
      ) : null}
      <Link className="latest-update__action" to={to}>
        See what&apos;s new
      </Link>
    </article>
  );
}
