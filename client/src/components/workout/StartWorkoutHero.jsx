import "../../styles/blocks/bk-run.css";

function timeOfDayWord(date) {
  const h = date.getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  if (h < 21) return "Evening";
  return "Night";
}

/**
 * Home's first card when nothing is in progress.
 * With an active block run and a next day: title is that day, primary CTA
 * starts it; "Other workout" opens the empty/templates picker.
 */
export function StartWorkoutHero({
  onOpenPicker,
  lastSessionLabel = null,
  nextDayLabel = null,
  blockName = null,
  onStartNextDay = null,
  startingNextDay = false,
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

  const now = new Date();
  const dateLine = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const trimmedNext = nextDayLabel != null ? String(nextDayLabel).trim() : "";
  const hasNext = trimmedNext !== "";
  const blockDayMode = hasNext && typeof onStartNextDay === "function";
  const blockSubtitle =
    blockName != null && String(blockName).trim() !== "" ? String(blockName).trim() : null;

  if (blockDayMode) {
    return (
      <section
        className="workout-hero workout-hero--start workout-hero--block-day card card--notched"
        aria-labelledby="workout-hero-start-title"
      >
        <p className="workout-hero__eyebrow muted small">{dateLine}</p>
        <h1 id="workout-hero-start-title" className="workout-hero__title">
          {trimmedNext}
        </h1>
        <p className="workout-hero__lead muted small">
          {blockSubtitle
            ? blockSubtitle
            : lastSessionLabel
              ? `Last one: ${lastSessionLabel}.`
              : "Continue your block."}
        </p>
        <button
          type="button"
          className="btn workout-hero__cta"
          disabled={startingNextDay}
          onClick={() => void onStartNextDay()}
        >
          {startingNextDay ? "Starting…" : `Start ${trimmedNext}`}
        </button>
        <button
          type="button"
          className="btn btn-ghost workout-hero__other"
          disabled={startingNextDay}
          onClick={onOpenPicker}
        >
          Other workout
        </button>
      </section>
    );
  }

  return (
    <section
      className="workout-hero workout-hero--start card card--notched"
      aria-labelledby="workout-hero-start-title"
    >
      <p className="workout-hero__eyebrow muted small">{dateLine}</p>
      <h1 id="workout-hero-start-title" className="workout-hero__title">
        {`${timeOfDayWord(now)} session?`}
      </h1>
      <p className="workout-hero__lead muted small">
        {lastSessionLabel ? `Last one: ${lastSessionLabel}.` : "Empty session or a saved workout."}
      </p>
      <button type="button" className="btn workout-hero__cta" onClick={onOpenPicker}>
        Start Workout
      </button>
    </section>
  );
}
