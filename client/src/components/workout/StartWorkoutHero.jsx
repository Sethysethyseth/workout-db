import { useEffect, useRef, useState } from "react";
import { sceneSignal } from "../../lib/sceneSignal.js";
import { pickRawLogLine } from "../../lib/startLines.js";
import { PixelCrown } from "../motion/PixelCrown.jsx";
import "../../styles/blocks/bk-run.css";
import "../../styles/workout-saved.css";

const LIFT_HOLD_MS = 380;

/* Under Arena view, holding Start lifts the bar in the room ("lift"), letting
   go drops it ("drop"). Signals only: a press still starts exactly as before. */
function useLiftHold() {
  const timer = useRef(0);
  const lifting = useRef(false);
  const drop = () => {
    window.clearTimeout(timer.current);
    if (!lifting.current) return;
    lifting.current = false;
    sceneSignal("drop");
  };
  useEffect(() => drop, []);
  return {
    onPointerDown: (e) => {
      if (e.button > 0 || !document.documentElement.hasAttribute("data-arena")) return;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        lifting.current = true;
        sceneSignal("lift");
      }, LIFT_HOLD_MS);
    },
    onPointerUp: drop,
    onPointerCancel: drop,
    onPointerLeave: drop,
  };
}

/**
 * Home's first card when nothing is in progress.
 * Always logging-first: empty start + browse templates. Block day lives
 * in UpNextCard below.
 *
 * `saved` ({ name, sets, minutes } or null): the workout that was just
 * finished. While set, the card's face reads "Workout saved" with a crown
 * stamped on it; the buttons stay live the whole time (workout-saved.css).
 */
export function StartWorkoutHero({
  onStartEmpty,
  onBrowseTemplates,
  lastSessionLabel = null,
  startingEmpty = false,
  loading = false,
  saved = null,
}) {
  /* The last saved workout stays on the face while it fades back out. */
  const [shown, setShown] = useState(saved);
  if (saved && saved !== shown) setShown(saved);
  const liftHold = useLiftHold();
  /* One line per visit to Home: it must not change under a finger. */
  const [startLine] = useState(pickRawLogLine);
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

  const savedFacts = shown
    ? [
        shown.sets > 0 ? `${shown.sets} ${shown.sets === 1 ? "set" : "sets"}` : null,
        shown.minutes > 0 ? `${shown.minutes} min` : null,
        "in History",
      ]
        .filter(Boolean)
        .join(" · ")
    : null;

  return (
    <section
      className={`workout-hero workout-hero--start card card--notched${saved ? " is-saved" : ""}`}
      aria-labelledby="workout-hero-start-title"
    >
      <div className="workout-hero__faces">
        <div className="workout-hero__face workout-hero__face--idle" aria-hidden={saved ? true : undefined}>
          <p className="workout-hero__eyebrow muted small">LOG A WORKOUT</p>
          <h1 id="workout-hero-start-title" className="workout-hero__title">
            Start a workout
          </h1>
          <p className="workout-hero__lead muted small">
            {lastSessionLabel ? `Last one: ${lastSessionLabel}.` : "A raw log or a saved workout."}
          </p>
        </div>
        {shown ? (
          <div
            className="workout-hero__face workout-hero__face--saved"
            role="status"
            aria-hidden={saved ? undefined : true}
          >
            <p className="workout-hero__eyebrow workout-hero__eyebrow--saved small">Workout saved</p>
            <p className="workout-hero__title workout-hero__saved-name">{shown.name || "Nice work"}</p>
            <p className="workout-hero__lead muted small">{savedFacts}</p>
          </div>
        ) : null}
      </div>
      {shown ? (
        <span className="workout-hero__stamp" aria-hidden="true">
          <PixelCrown className="workout-hero__stamp-crown" />
          <span className="workout-hero__stamp-sparks">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
        </span>
      ) : null}
      <button
        type="button"
        className="btn workout-hero__cta"
        aria-label={startingEmpty ? undefined : `Start a raw log: ${startLine}`}
        disabled={startingEmpty}
        onClick={() => void onStartEmpty?.()}
        {...liftHold}
      >
        {startingEmpty ? "Starting…" : startLine}
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
