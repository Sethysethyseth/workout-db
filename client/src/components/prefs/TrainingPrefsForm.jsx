import { Segmented } from "../blocks/ui/Segmented.jsx";
import { setTrainingPref, useTrainingPrefs } from "../../lib/trainingPrefs.js";
import "../../styles/training-prefs.css";

const WEIGHT_OPTIONS = [
  { value: "lbs", label: "lbs" },
  { value: "kg", label: "kg" },
];

const EFFORT_OPTIONS = [
  { value: "rir", label: "RIR" },
  { value: "rpe", label: "RPE" },
];

function formatRest(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function PrefSwitch({ checked, label, helper, onChange }) {
  return (
    <div className="training-prefs-switch">
      <div className="training-prefs-switch__text">
        <p className="training-prefs-switch__label">{label}</p>
        {helper ? <p className="training-prefs-switch__helper muted small">{helper}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`ai-switch${checked ? " ai-switch--on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span className="ai-switch__knob" aria-hidden="true" />
      </button>
    </div>
  );
}

function Group({ variant, title, children }) {
  if (variant === "page") {
    return (
      <section className="card training-prefs-card">
        <h2 className="training-prefs-group__title">{title}</h2>
        {children}
      </section>
    );
  }
  return (
    <section className="training-prefs-group">
      <h2 className="training-prefs-group__title">{title}</h2>
      {children}
    </section>
  );
}

export function TrainingPrefsForm({ variant = "page", effortNote }) {
  const prefs = useTrainingPrefs();
  const rest = prefs.restTimer;

  return (
    <div className={`training-prefs-form training-prefs-form--${variant}`}>
      <Group variant={variant} title="Units and effort">
        <div className="training-prefs-field">
          <p className="training-prefs-field__label">Weight unit</p>
          <Segmented
            fill
            label="Weight unit"
            options={WEIGHT_OPTIONS}
            value={prefs.weightUnit}
            onChange={(value) => setTrainingPref("weightUnit", value)}
          />
          <p className="training-prefs-field__helper muted small">
            Changes how weights are shown. Numbers you&apos;ve logged aren&apos;t converted.
          </p>
        </div>
        <div className="training-prefs-field">
          <p className="training-prefs-field__label">Effort scale</p>
          <Segmented
            fill
            label="Effort scale"
            options={EFFORT_OPTIONS}
            value={prefs.effortSignal}
            onChange={(value) => setTrainingPref("effortSignal", value)}
          />
          {effortNote ? (
            <p className="training-prefs-field__helper muted small">{effortNote}</p>
          ) : (
            <p className="training-prefs-field__helper muted small">
              Used for quick workouts and new templates. Blocks and templates keep the scale they
              were built with.
            </p>
          )}
        </div>
      </Group>

      <Group variant={variant} title="While logging">
        <PrefSwitch
          label="Exercise notes"
          checked={prefs.useExerciseNotes}
          onChange={(on) => setTrainingPref("useExerciseNotes", on)}
        />
        <PrefSwitch
          label="Set notes"
          checked={prefs.useSetNotes}
          onChange={(on) => setTrainingPref("useSetNotes", on)}
        />
        <PrefSwitch
          label="Repeat last time's numbers"
          helper="Shows what you lifted last time in each empty set. Tap the set number to use it."
          checked={prefs.mirrorLast}
          onChange={(on) => setTrainingPref("mirrorLast", on)}
        />
      </Group>

      <Group variant={variant} title="Rest timer">
        <PrefSwitch
          label="Rest timer"
          helper="Starts after you log a set. A block's own rest time wins."
          checked={rest.enabled}
          onChange={(on) =>
            setTrainingPref("restTimer", { enabled: on, seconds: rest.seconds })
          }
        />
        {rest.enabled ? (
          <div className="training-prefs-field">
            <p className="training-prefs-field__label">Duration</p>
            <div className="training-prefs-stepper" role="group" aria-label="Rest timer duration">
              <button
                type="button"
                className="training-prefs-stepper__btn"
                aria-label="Shorten rest by 15 seconds"
                disabled={rest.seconds <= 30}
                onClick={() =>
                  setTrainingPref("restTimer", { enabled: true, seconds: rest.seconds - 15 })
                }
              >
                -
              </button>
              <span className="training-prefs-stepper__value" aria-live="polite">
                {formatRest(rest.seconds)}
              </span>
              <button
                type="button"
                className="training-prefs-stepper__btn"
                aria-label="Lengthen rest by 15 seconds"
                disabled={rest.seconds >= 300}
                onClick={() =>
                  setTrainingPref("restTimer", { enabled: true, seconds: rest.seconds + 15 })
                }
              >
                +
              </button>
            </div>
          </div>
        ) : null}
      </Group>
    </div>
  );
}
