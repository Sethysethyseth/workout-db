function timeOfDayWord(date) {
  const h = date.getHours();
  if (h < 5) return "Late night";
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  if (h < 21) return "Evening";
  return "Night";
}

/**
 * Home's first card when nothing is in progress. The headline is the day,
 * not a restatement of the button: one line of context, one verb.
 */
export function StartWorkoutHero({ onOpenPicker, lastSessionLabel = null }) {
  const now = new Date();
  const dateLine = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  return (
    <section className="workout-hero workout-hero--start card card--notched" aria-labelledby="workout-hero-start-title">
      <p className="workout-hero__eyebrow muted small">{dateLine}</p>
      <h1 id="workout-hero-start-title" className="workout-hero__title">
        {timeOfDayWord(now)} session?
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
