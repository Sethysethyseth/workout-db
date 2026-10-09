import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import {
  WhatsNewContent,
  WhatsNewDetails,
  WhatsNewReleaseSections,
} from "../../components/whatsnew/WhatsNewContent.jsx";
import { formatReleaseDate, LATEST_RELEASE, RELEASES } from "../../data/whatsNew.js";
import { saveLastSeenRelease } from "../../lib/whatsNewStorage.js";
import { isProdEnv, isWhatsNewPreview } from "../../lib/appEnv.js";
import "../../styles/whats-new.css";

/**
 * Profile > What's new. The latest release reads as a short note; older
 * releases are collapsed rows. Prod-only, plus an off-prod ?preview=1
 * path that never writes the seen id. The modal stays prod-only.
 */
export function WhatsNewPage() {
  const [searchParams] = useSearchParams();
  const { hash } = useLocation();
  const preview = isWhatsNewPreview(searchParams.toString());
  const targetId = hash.startsWith("#") ? decodeURIComponent(hash.slice(1)) : "";

  useEffect(() => {
    if (isProdEnv() && LATEST_RELEASE) saveLastSeenRelease(LATEST_RELEASE.id);
  }, []);

  useEffect(() => {
    if (!targetId) return;
    const el = document.getElementById(targetId);
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [targetId]);

  if (!isProdEnv() && !preview) return <Navigate to="/profile" replace />;

  const [latest, ...older] = RELEASES;

  return (
    <div className="settings-page whats-new-page stack">
      <Link to={preview ? "/profile?preview=1" : "/profile"} className="settings-page-back">
        &larr; Profile
      </Link>
      {preview ? <p className="whats-new-preview-note">Preview. Only visible on staging.</p> : null}
      {latest ? (
        <WhatsNewContent
          release={latest}
          headingId={`whats-new-${latest.id}`}
          layout="note"
          id={latest.id}
        />
      ) : null}
      {older.map((release) => (
        <OlderRelease key={release.id} release={release} startOpen={targetId === release.id} />
      ))}
    </div>
  );
}

function OlderRelease({ release, startOpen }) {
  const [open, setOpen] = useState(startOpen);

  useEffect(() => {
    if (startOpen) setOpen(true);
  }, [startOpen]);

  return (
    <article id={release.id} className="card whats-new-older">
      <button
        type="button"
        className="whats-new-older__toggle"
        aria-expanded={open}
        aria-controls={`${release.id}-body`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="whats-new-older__title">{release.title}</span>
        <span className="whats-new-older__date muted small">{formatReleaseDate(release.date)}</span>
      </button>
      {open ? (
        <div id={`${release.id}-body`} className="whats-new-older__body">
          <WhatsNewReleaseSections release={release} />
          <WhatsNewDetails release={release} />
        </div>
      ) : null}
    </article>
  );
}
