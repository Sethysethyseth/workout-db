import { useEffect, useState } from "react";
import { loadEffortSignal, saveEffortSignal } from "./effortSignalPref.js";
import { loadQuickWorkoutLogPrefs, saveQuickWorkoutLogPrefs } from "./quickWorkoutLogPrefs.js";
import { loadWeightUnit, saveWeightUnit } from "./weightUnitPref.js";

const MIRROR_KEY = "workoutdb-mirror-last";
const REST_KEY = "workoutdb-rest-timer";
const PREF_EVENT = "workoutdb-training-prefs";

const REST_DEFAULT = { enabled: true, seconds: 120 };

function clampRestSeconds(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return REST_DEFAULT.seconds;
  const stepped = Math.round(n / 15) * 15;
  return Math.min(300, Math.max(30, stepped));
}

function loadMirrorLast() {
  try {
    return localStorage.getItem(MIRROR_KEY) === "true";
  } catch {
    return false;
  }
}

function loadRestTimer() {
  try {
    const raw = localStorage.getItem(REST_KEY);
    if (!raw) return { ...REST_DEFAULT };
    const o = JSON.parse(raw);
    if (!o || typeof o !== "object") return { ...REST_DEFAULT };
    return {
      enabled: o.enabled !== false,
      seconds: clampRestSeconds(o.seconds),
    };
  } catch {
    return { ...REST_DEFAULT };
  }
}

function loadUseExerciseNotes() {
  const p = loadQuickWorkoutLogPrefs();
  return typeof p.useExerciseNotes === "boolean" ? p.useExerciseNotes : true;
}

function loadUseSetNotes() {
  const p = loadQuickWorkoutLogPrefs();
  return p.useSetNotes === true;
}

export function getTrainingPrefs() {
  return {
    weightUnit: loadWeightUnit(),
    effortSignal: loadEffortSignal(),
    useExerciseNotes: loadUseExerciseNotes(),
    useSetNotes: loadUseSetNotes(),
    mirrorLast: loadMirrorLast(),
    restTimer: loadRestTimer(),
  };
}

function notify() {
  try {
    window.dispatchEvent(new CustomEvent(PREF_EVENT));
  } catch {
    /* no window */
  }
}

/** @param {"weightUnit"|"effortSignal"|"useExerciseNotes"|"useSetNotes"|"mirrorLast"|"restTimer"} name */
export function setTrainingPref(name, value) {
  if (name === "weightUnit") {
    if (value !== "lbs" && value !== "kg") return;
    saveWeightUnit(value);
  } else if (name === "effortSignal") {
    if (value !== "rir" && value !== "rpe") return;
    saveEffortSignal(value);
  } else if (name === "useExerciseNotes") {
    if (typeof value !== "boolean") return;
    saveQuickWorkoutLogPrefs({ useExerciseNotes: value });
  } else if (name === "useSetNotes") {
    if (typeof value !== "boolean") return;
    saveQuickWorkoutLogPrefs({ useSetNotes: value });
  } else if (name === "mirrorLast") {
    if (typeof value !== "boolean") return;
    try {
      localStorage.setItem(MIRROR_KEY, value ? "true" : "false");
    } catch {
      /* quota / private mode */
    }
  } else if (name === "restTimer") {
    const next = {
      enabled: Boolean(value && value.enabled),
      seconds: clampRestSeconds(value && value.seconds),
    };
    try {
      localStorage.setItem(REST_KEY, JSON.stringify(next));
    } catch {
      /* quota / private mode */
    }
  } else {
    return;
  }
  notify();
}

export function useTrainingPrefs() {
  const [prefs, setPrefs] = useState(getTrainingPrefs);
  useEffect(() => {
    function sync() {
      setPrefs(getTrainingPrefs());
    }
    window.addEventListener(PREF_EVENT, sync);
    return () => window.removeEventListener(PREF_EVENT, sync);
  }, []);
  return prefs;
}
