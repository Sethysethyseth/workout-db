/** Pure rx / rest / duration formatters for block surfaces (BK4). */

/**
 * Device/API unit ("lbs"|"lb"|"kg") -> display unit ("lb"|"kg").
 * @param {string | null | undefined} unit
 * @returns {"lb"|"kg"|null}
 */
export function normalizeRxUnit(unit) {
  if (unit == null || unit === "") return null;
  const u = String(unit).toLowerCase();
  if (u === "kg") return "kg";
  if (u === "lb" || u === "lbs") return "lb";
  return String(unit);
}

/**
 * @param {number | null | undefined} sec
 * @returns {string | null}
 */
export function formatRest(sec) {
  if (sec == null || Number.isNaN(Number(sec))) return null;
  const n = Number(sec);
  if (!(n > 0)) return null;
  if (n < 60) return `${n}s`;
  const m = Math.floor(n / 60);
  const s = n % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * @param {number | null | undefined} sec
 * @returns {string | null}
 */
export function formatDuration(sec) {
  if (sec == null || Number.isNaN(Number(sec))) return null;
  const n = Number(sec);
  if (n < 60) return `${n}s`;
  if (n % 60 === 0) return `${n / 60} min`;
  const m = Math.floor(n / 60);
  const s = n % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * @param {{
 *   sets?: number | null,
 *   reps?: number | null,
 *   repsMax?: number | null,
 *   durationSec?: number | null,
 *   weight?: number | null,
 *   unit?: string | null,
 *   effort?: string | null,
 *   effortValue?: number | null,
 *   effortCap?: boolean | null,
 *   restSec?: number | null,
 * }} rx
 * @returns {{ key: string, label: string | null, value: string }[]}
 */
export function formatRx({
  sets,
  reps,
  repsMax,
  durationSec,
  weight,
  unit,
  effort,
  effortValue,
  effortCap,
  restSec,
} = {}) {
  const parts = [];

  const dose = buildDose({ sets, reps, repsMax, durationSec });
  if (dose) parts.push({ key: "dose", label: null, value: dose });

  const displayUnit = normalizeRxUnit(unit);
  if (weight != null && displayUnit != null) {
    parts.push({ key: "weight", label: "@", value: `${weight} ${displayUnit}` });
  }

  const effortPart = buildEffort({ effort, effortValue, effortCap });
  if (effortPart) parts.push({ key: "effort", label: null, value: effortPart });

  const rest = formatRest(restSec);
  if (rest != null) parts.push({ key: "rest", label: "Rest", value: rest });

  return parts;
}

function buildDose({ sets, reps, repsMax, durationSec }) {
  if (sets == null) return null;

  if (durationSec != null) {
    const dur = formatDuration(durationSec);
    if (dur == null) return null;
    return `${sets} × ${dur}`;
  }

  if (reps != null && repsMax != null && repsMax !== reps) {
    return `${sets} × ${reps}-${repsMax}`;
  }

  if (reps != null) {
    return `${sets} × ${reps}`;
  }

  return null;
}

function buildEffort({ effort, effortValue, effortCap }) {
  if (effort == null || effortValue == null) return null;
  const kind = String(effort).toLowerCase();
  if (kind === "rpe") {
    return effortCap ? `RPE ≤ ${effortValue}` : `RPE ${effortValue}`;
  }
  if (kind === "rir") {
    return effortCap ? `RIR ≥ ${effortValue}` : `RIR ${effortValue}`;
  }
  return null;
}
