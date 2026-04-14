export function StartWorkoutHero({ onOpenPicker }) {
  return (
    <section className="workout-hero workout-hero--start card" aria-labelledby="workout-hero-start-title">
      <h1 id="workout-hero-start-title" className="workout-hero__title">
        Start workout
      </h1>
      <p className="workout-hero__lead muted small">Empty session or a saved workout—your choice.</p>
      <button type="button" className="btn workout-hero__cta" onClick={onOpenPicker}>
        Start Workout
      </button>
    </section>
  );
}
