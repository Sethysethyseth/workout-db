import "../../styles/blocks/bk-run.css";

/**
 * Home's first card when nothing is in progress.
 * Always logging-first: empty start + browse templates. Block day lives
 * in UpNextCard below.
 */
export function StartWorkoutHero({
  onStartEmpty,
  onBrowseTemplates,
  lastSessionLabel = null,
  startingEmpty = false,
  loading = false,
}) {
  if (loading) {
    return (
      <section
        className="workout-hero workout-hero--start workout-hero--skel card card--notched"
        aria-busy="true"
        aria-label="Loading workout"
      >
        <div className="workout-hero-skel__line workout-hero-skel__line--eyebrow" />
        <div className="workout-hero-skel__line workout-hero-skel__line--title" />
        <div className="workout-hero-skel__line workout-hero-skel__line--lead" />
        <div className="workout-hero-skel__cta" />
      </section>
    );
  }

  return (
    <section
      className="workout-hero workout-hero--start card card--notched"
      aria-labelledby="workout-hero-start-title"
    >
      <p className="workout-hero__eyebrow muted small">LOG A WORKOUT</p>
      <h1 id="workout-hero-start-title" className="workout-hero__title">
        Start a workout
      </h1>
      <p className="workout-hero__lead muted small">
        {lastSessionLabel ? `Last one: ${lastSessionLabel}.` : "Empty session or a saved workout."}
      </p>
      <button
        type="button"
        className="btn workout-hero__cta"
        disabled={startingEmpty}
        onClick={() => void onStartEmpty?.()}
      >
        {startingEmpty ? "Starting…" : "Start empty workout"}
      </button>
      <button
        type="button"
        className="btn btn-ghost workout-hero__browse"
        disabled={startingEmpty}
        onClick={onBrowseTemplates}
      >
        Browse templates
      </button>
    </section>
  );
}
