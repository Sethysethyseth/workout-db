import { defaultWorkoutSessionName } from "./defaultWorkoutSessionName.js";
import {
  isBlankSessionExerciseName,
  sessionExerciseNameForInput,
} from "./sessionExerciseName.js";

function normalizeSpaces(s) {
  return String(s ?? "")
    .replace(/[\u2012-\u2015]/g, "-")
    .replace(/[^\S\r\n]+/g, " ")
    .trim();
}

/**
 * Normalize common abbreviations/variants for lightweight categorization.
 * Intentionally conservative: only rules that are very likely correct.
 * @param {string} raw
 * @returns {string}
 */
export function normalizeExerciseName(raw) {
  let s = normalizeSpaces(raw).toLowerCase();
  if (!s) return "";

  // Expand common abbreviations (word-boundary aware).
  s = s
    .replace(/\bdb\b/g, "dumbbell")
    .replace(/\bbb\b/g, "barbell")
    .replace(/\brdl\b/g, "romanian deadlift")
    .replace(/\bohp\b/g, "overhead press");

  // Common variants / synonyms.
  s = s
    .replace(/\blat\s*pull\s*down\b/g, "lat pulldown")
    .replace(/\bpull\s*down\b/g, "pulldown")
    .replace(/\bhamstring\s*curl\b/g, "leg curl")
    .replace(/\bleg\s*ext\b/g, "leg extension")
    .replace(/\bleg\s*extension\b/g, "leg extension");

  // Canonicalize pulldown naming.
  s = s.replace(/\bpulldown\b/g, "lat pulldown");

  return s.trim();
}

function canonicalizeNameForMatch(s) {
  return normalizeExerciseName(s)
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function nameTokens(s) {
  const c = canonicalizeNameForMatch(s);
  return c ? c.split(" ") : [];
}

function includesAny(haystack, needles) {
  for (const n of needles) {
    if (haystack.includes(n)) return true;
  }
  return false;
}

/**
 * Very small rules-based categorizer intended for naming a quick-log session.
 * Returns:
 * - { major: "legs" | "push" | "pull" | "arms" | "shoulders" | "core" | "other", legsBias?: "quad" | "posterior" | "balanced" }
 */
function categorizeExercise(normalized) {
  const s = String(normalized ?? "");
  const tokens = nameTokens(s);
  const joined = ` ${tokens.join(" ")} `;

  // Core
  if (
    includesAny(joined, [
      " crunch ",
      " plank ",
      " leg raise ",
      " situp ",
      " sit up ",
      " ab ",
      " abs ",
      " core ",
    ])
  ) {
    return { major: "core" };
  }

  // Shoulders
  if (
    includesAny(joined, [
      " lateral raise ",
      " rear delt ",
      " face pull ",
      " shoulder press ",
      " overhead press ",
      " delt ",
    ])
  ) {
    return { major: "shoulders" };
  }

  // Arms (biceps/triceps)
  const isBiceps = includesAny(joined, [" curl ", " bicep ", " biceps "]);
  const isTriceps = includesAny(joined, [
    " tricep ",
    " triceps ",
    " pushdown ",
    " skullcrusher ",
    " skull crusher ",
  ]);
  if (isBiceps || isTriceps) {
    // Avoid classifying "leg extension" as arms.
    if (!joined.includes("leg extension")) return { major: "arms" };
  }

  // Legs
  const quadLike = includesAny(joined, [
    " hack squat ",
    " squat ",
    " leg press ",
    " lunge ",
    " split squat ",
    " leg extension ",
  ]);
  const posteriorLike = includesAny(joined, [
    " romanian deadlift ",
    " deadlift ",
    " hip thrust ",
    " glute bridge ",
    " leg curl ",
    " hinge ",
  ]);
  if (quadLike || posteriorLike) {
    const legsBias = quadLike && posteriorLike ? "balanced" : quadLike ? "quad" : "posterior";
    return { major: "legs", legsBias };
  }

  // Push / pull major patterns
  if (
    includesAny(joined, [
      " bench ",
      " incline press ",
      " chest press ",
      " fly ",
      " dip ",
      " push up ",
      " pushup ",
      " press ",
    ])
  ) {
    // Keep OHP as shoulders (handled earlier); everything else "press" leans push.
    if (!joined.includes("overhead press")) return { major: "push" };
  }

  if (
    includesAny(joined, [
      " row ",
      " lat pulldown ",
      " pullup ",
      " pull up ",
      " chinup ",
      " chin up ",
    ])
  ) {
    return { major: "pull" };
  }

  return { major: "other" };
}

/**
 * Generate a smart name for ad-hoc quick log sessions, based on exercise names.
 * Never overrides user-entered names (caller responsibility).
 *
 * @param {Array<{exerciseName?: string | null}>} sessionExercises
 * @param {Date | string | number | null | undefined} whenFallback
 * @returns {string}
 */
export function smartWorkoutNameFromSessionExercises(sessionExercises, whenFallback) {
  const list = Array.isArray(sessionExercises) ? sessionExercises : [];
  const names = [];
  for (const se of list) {
    const raw = se?.exerciseName;
    if (!raw) continue;
    if (isBlankSessionExerciseName(raw)) continue;
    const inputName = sessionExerciseNameForInput(raw);
    const trimmed = String(inputName ?? "").trim();
    if (trimmed) names.push(trimmed);
  }

  const normalized = names.map(normalizeExerciseName).filter(Boolean);
  if (normalized.length === 0) return defaultWorkoutSessionName(whenFallback);

  const counts = {
    legs: { total: 0, quad: 0, posterior: 0, balanced: 0 },
    push: 0,
    pull: 0,
    arms: 0,
    shoulders: 0,
    core: 0,
    other: 0,
  };

  for (const n of normalized) {
    const c = categorizeExercise(n);
    if (c.major === "legs") {
      counts.legs.total += 1;
      counts.legs[c.legsBias || "balanced"] += 1;
    } else {
      counts[c.major] += 1;
    }
  }

  const majors = [
    ["legs", counts.legs.total],
    ["push", counts.push],
    ["pull", counts.pull],
    ["arms", counts.arms],
    ["shoulders", counts.shoulders],
    ["core", counts.core],
    ["other", counts.other],
  ];

  const nonZeroMajorCount = majors.filter(([, v]) => v > 0).length;
  const top = [...majors].sort((a, b) => b[1] - a[1])[0];
  const topKey = top?.[0];
  const topVal = top?.[1] ?? 0;

  // Mixed sessions
  const hasChestBackMix = counts.push > 0 && counts.pull > 0;
  if (hasChestBackMix || nonZeroMajorCount >= 3) return "Full Body";

  // Legs naming
  if (topKey === "legs" && topVal > 0) {
    const q = counts.legs.quad;
    const p = counts.legs.posterior;
    const b = counts.legs.balanced;
    const legsTotal = counts.legs.total || 1;
    const quadRatio = q / legsTotal;
    const postRatio = p / legsTotal;

    if (quadRatio >= 0.6 && postRatio <= 0.25) return "Quad-Focused Leg Day";
    if (postRatio >= 0.6 && quadRatio <= 0.25) return "Posterior Chain Leg Day";
    if (q > 0 && p > 0) return "Leg Day";
    if (b > 0) return "Leg Day";
    return "Leg Day";
  }

  // Push / pull
  if (topKey === "push" && topVal > 0) return "Push Day";
  if (topKey === "pull" && topVal > 0) return "Pull Day";

  // Arms / shoulders / core (only call it these if it dominates)
  if (topKey === "arms" && topVal >= Math.max(counts.push, counts.pull, counts.legs.total)) {
    return "Arm Day";
  }
  if (
    topKey === "shoulders" &&
    topVal >= Math.max(counts.push, counts.pull, counts.legs.total, counts.arms)
  ) {
    return "Shoulder Day";
  }
  if (topKey === "core" && topVal >= Math.max(counts.push, counts.pull, counts.legs.total)) {
    return "Core Day";
  }

  return defaultWorkoutSessionName(whenFallback);
}

