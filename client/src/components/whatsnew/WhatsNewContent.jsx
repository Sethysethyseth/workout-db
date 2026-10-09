import { formatReleaseDate } from "../../data/whatsNew.js";
import "../../styles/whats-new.css";

function WhatsNewReleaseHeader({ release, headingId }) {
  return (
    <header className="whats-new-release__header">
      <p className="whats-new-release__date muted small">{formatReleaseDate(release.date)}</p>
      <h2 id={headingId} className="whats-new-release__title">
        {release.title}
      </h2>
      {release.tagline ? (
        <p className="whats-new-release__tagline muted">{release.tagline}</p>
      ) : null}
    </header>
  );
}

function WhatsNewNoteHeader({ release, headingId }) {
  return (
    <header className="whats-new-note__header">
      <div className="whats-new-note__headline">
        <h1 id={headingId} className="whats-new-note__title">
          {release.title}
        </h1>
        <p className="whats-new-note__date muted">{formatReleaseDate(release.date)}</p>
      </div>
      {release.tagline ? (
        <p className="whats-new-release__tagline muted">{release.tagline}</p>
      ) : null}
    </header>
  );
}

function WhatsNewReleaseSections({ release }) {
  return (
    <div className="whats-new-release__sections stack">
      {release.sections.map((section) => (
        <section key={section.heading} className="whats-new-section">
          <h3 className="whats-new-section__heading">{section.heading}</h3>
          <ul className="whats-new-section__list">
            {section.items.map((item) => (
              <li key={item} className="whats-new-section__item">
                {item}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function WhatsNewDetails({ release }) {
  const details = Array.isArray(release?.details) ? release.details : [];
  if (details.length === 0) return null;

  return (
    <details className="whats-new-details">
      <summary className="whats-new-details__summary">See the details</summary>
      <div className="whats-new-details__body">
        {details.map((detail) => (
          <section key={detail.heading} className="whats-new-detail">
            <h3 className="whats-new-detail__heading">{detail.heading}</h3>
            {detail.body.map((paragraph) => (
              <p key={paragraph} className="whats-new-detail__body">
                {paragraph}
              </p>
            ))}
            {detail.where ? (
              <p className="whats-new-detail__where muted small">Where to find it: {detail.where}</p>
            ) : null}
          </section>
        ))}
      </div>
    </details>
  );
}

/**
 * One release's notes. Concise sections first; an in-depth disclosure
 * follows only when the release has `details`. `layout="note"` is the
 * archive's latest release: a large title with the date beside it.
 * Shared pieces also feed the modal, which stays concise-only.
 */
export function WhatsNewContent({ release, headingId, layout = "default", id }) {
  if (!release) return null;
  return (
    <div
      id={id}
      className={layout === "note" ? "whats-new-release whats-new-note" : "whats-new-release"}
    >
      {layout === "note" ? (
        <WhatsNewNoteHeader release={release} headingId={headingId} />
      ) : (
        <WhatsNewReleaseHeader release={release} headingId={headingId} />
      )}
      <WhatsNewReleaseSections release={release} />
      <WhatsNewDetails release={release} />
    </div>
  );
}

export { WhatsNewReleaseHeader, WhatsNewReleaseSections, WhatsNewDetails };
