import { formatReleaseDate } from "../../data/whatsNew.js";

/**
 * One release's notes: date kicker, title, tagline, categorized sections.
 * Shared by the What's New modal (latest release) and the Profile >
 * What's new archive page (every release). Structure only - the visual
 * patch-notes treatment lands in the L5 task block.
 */
export function WhatsNewContent({ release, headingId }) {
  if (!release) return null;
  return (
    <div className="whats-new-release stack">
      <header className="whats-new-release__header">
        <p className="whats-new-release__date muted small">
          {formatReleaseDate(release.date)}
        </p>
        <h2 id={headingId} className="whats-new-release__title">
          {release.title}
        </h2>
        {release.tagline ? (
          <p className="whats-new-release__tagline muted">{release.tagline}</p>
        ) : null}
      </header>
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
